"""HTTP clients for brain, scout, youtube and engine-bridge (contracts in airtime/contracts).

Control always talks to the other services over HTTP, fake mode included: each service fakes its
own external dependency. A failed call raises ServiceError with the service's error envelope.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

import httpx

from .env import Env
from .timeutil import parse_dt


class ServiceError(Exception):
    def __init__(self, service: str, code: str, message: str, *, status: int | None = None,
                 details: Any = None):
        super().__init__(f"{service}: {message}")
        self.service, self.code, self.message, self.status, self.details = (
            service, code, message, status, details)

    @property
    def transient(self) -> bool:
        """Worth retrying later: the service is down or restarting."""
        return self.code == "unreachable" or (self.status or 0) in (502, 503, 504)

    def to_dict(self) -> dict:
        return {"code": self.code, "message": self.message, "service": self.service,
                "details": self.details}


class ClaudeUnavailable(ServiceError):
    """brain has no Claude account to run on until `retry_at` (addendum B)."""

    transient = False

    @property
    def retry_at(self) -> datetime | None:
        details = self.details if isinstance(self.details, dict) else {}
        return parse_dt(details.get("retry_at"))


def _error_of(response: httpx.Response) -> dict:
    try:
        body = response.json()
    except ValueError:
        return {"message": response.text[:300]}
    if isinstance(body, dict):
        for candidate in (body.get("error"), body.get("detail")):
            if isinstance(candidate, dict):
                inner = candidate.get("error")
                return inner if isinstance(inner, dict) else candidate
            if isinstance(candidate, str):
                return {"message": candidate}
    return {"message": str(body)[:300]}


class Service:
    def __init__(self, name: str, url: str, timeout: float = 30.0):
        self.name, self.url = name, url.rstrip("/")
        self.http = httpx.AsyncClient(base_url=self.url, timeout=timeout)

    async def call(self, method: str, path: str, *, json: Any = None, params: dict | None = None,
                   timeout: float | None = None) -> Any:
        try:
            response = await self.http.request(
                method, path, json=json, params=params,
                timeout=timeout if timeout is not None else httpx.USE_CLIENT_DEFAULT)
        except httpx.HTTPError as exc:
            raise ServiceError(self.name, "unreachable",
                               f"{self.name} did not answer ({exc.__class__.__name__})") from exc
        if response.status_code >= 400:
            err = _error_of(response)
            code = str(err.get("code") or f"http_{response.status_code}")
            cls = ClaudeUnavailable if code == "claude_unavailable" else ServiceError
            raise cls(self.name, code, str(err.get("message") or f"HTTP {response.status_code}"),
                      status=response.status_code, details=err.get("details"))
        if not response.content:
            return None
        try:
            return response.json()
        except ValueError as exc:
            raise ServiceError(self.name, "bad_response", "answered with something that is not JSON",
                               status=response.status_code) from exc

    async def get(self, path: str, **kw: Any) -> Any:
        return await self.call("GET", path, **kw)

    async def post(self, path: str, json: Any = None, **kw: Any) -> Any:
        return await self.call("POST", path, json={} if json is None else json, **kw)


class Clients:
    def __init__(self, env: Env):
        self.brain = Service("brain", env.brain_url)
        self.scout = Service("scout", env.scout_url, timeout=120)
        self.youtube = Service("youtube", env.youtube_url, timeout=120)
        self.engine = Service("engine", env.engine_url)

    def all(self) -> dict[str, Service]:
        return {"brain": self.brain, "scout": self.scout, "youtube": self.youtube, "engine": self.engine}

    async def aclose(self) -> None:
        for service in self.all().values():
            await service.http.aclose()
