"""Polite HTTP for the free sources: one User-Agent, one request at a time per host with a minimum
gap between requests, and a few retries with backoff on timeouts, 429 and 5xx."""

import asyncio
import time
from collections import defaultdict

import httpx

from scout.settings import Settings

RETRY_STATUS = {429, 500, 502, 503, 504}
MAX_RETRY_AFTER_S = 30.0


class FetchError(Exception):
    """A source could not be read. `code` is short and stable (timeout, network, http_503, ...)."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


class Http:
    def __init__(self, settings: Settings, transport: httpx.AsyncBaseTransport | None = None):
        self.retries = settings.http_retries
        self.client = httpx.AsyncClient(
            timeout=settings.http_timeout_s,
            headers={"User-Agent": settings.user_agent},
            follow_redirects=True,
            transport=transport,
        )
        self._host_locks: defaultdict[str, asyncio.Lock] = defaultdict(asyncio.Lock)
        self._next_at: dict[str, float] = {}

    async def aclose(self) -> None:
        await self.client.aclose()

    async def get(
        self, url: str, *, params: dict | None = None, min_interval_s: float = 1.0
    ) -> httpx.Response:
        """GET with the host's rate limit and retries. Raises FetchError (404 → code not_found)."""
        host = httpx.URL(url).host
        for attempt in range(self.retries + 1):
            response, error = None, None
            async with self._host_locks[host]:
                wait = self._next_at.get(host, 0.0) - time.monotonic()
                if wait > 0:
                    await asyncio.sleep(wait)
                try:
                    response = await self.client.get(url, params=params)
                except httpx.TimeoutException:
                    error = FetchError("timeout", f"{host} did not answer in time")
                except httpx.HTTPError as exc:
                    error = FetchError("network", f"{host}: {type(exc).__name__}: {exc}")
                finally:
                    self._next_at[host] = time.monotonic() + min_interval_s
            if response is not None and response.is_success:
                return response
            if response is not None:
                error = FetchError(
                    "not_found" if response.status_code == 404 else f"http_{response.status_code}",
                    f"{host} answered HTTP {response.status_code}",
                )
                if response.status_code not in RETRY_STATUS:
                    raise error
            if attempt == self.retries:
                raise error
            await asyncio.sleep(_backoff(response, attempt))
        raise AssertionError("unreachable")


def _backoff(response: httpx.Response | None, attempt: int) -> float:
    retry_after = response.headers.get("Retry-After", "") if response is not None else ""
    if retry_after.isdigit():
        return min(float(retry_after), MAX_RETRY_AFTER_S)
    return float(2**attempt)
