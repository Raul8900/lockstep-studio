"""What the state machines share: the context, brain runs, polling, events and step errors."""

from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from functools import cached_property
from importlib import resources
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from . import config, learning
from .clients import ClaudeUnavailable, Clients, ServiceError
from .config import Files
from .env import Env
from .models import Diagnosis, Event, Learning, Production
from .timeutil import iso, now

log = logging.getLogger(__name__)


class StepFailed(Exception):
    """A step cannot go on; the production goes to needs_attention with this reason."""

    def __init__(self, reason: str, error: dict):
        super().__init__(error.get("message"))
        self.reason, self.error = reason, error


class Superseded(Exception):
    """The production changed state while a step was waiting (cancelled, say): drop the result."""


class ActionError(Exception):
    """A dashboard action that is not possible now (HTTP 4xx)."""

    def __init__(self, status: int, code: str, message: str, details: Any = None):
        super().__init__(message)
        self.status, self.code, self.message, self.details = status, code, message, details


@dataclass
class Ctx:
    env: Env
    files: Files
    sessions: sessionmaker
    clients: Clients
    worker: Any = None
    status_cache: dict = field(default_factory=dict)

    def session(self) -> Session:
        return self.sessions()

    @cached_property
    def engine_template_md(self) -> str:
        """The template block of the engine's PROMPTING.md (a bundled copy unless one is configured)."""
        path = self.env.engine_prompting_md
        if path is not None and path.is_file():
            blocks = path.read_text(encoding="utf-8").partition("## Template")[2].split("```")
            if len(blocks) >= 3:
                return blocks[1].strip("\n")
        return resources.files("control").joinpath("prompting_template.md").read_text(encoding="utf-8").strip()


def emit(s: Session, type_: str, production_id: str | None = None, data: dict | None = None) -> None:
    s.add(Event(at=now(), type=type_, production_id=production_id, data=data or {}))


async def poll(fetch: Callable[[], Awaitable[Any]], done: Callable[[Any], bool], *, interval: float,
               grace_s: float, on_value: Callable[[Any], None] | None = None) -> Any:
    """Fetch until done(value). A service that is down or restarting is waited for up to grace_s."""
    failing_since: float | None = None
    while True:
        try:
            value = await fetch()
        except ServiceError as exc:
            if not exc.transient:
                raise
            failing_since = failing_since or time.monotonic()
            if time.monotonic() - failing_since > grace_s:
                raise
        else:
            failing_since = None
            if on_value is not None:
                on_value(value)
            if done(value):
                return value
        await asyncio.sleep(interval)


def _set_pending(ctx: Ctx, model: type, owner_id: str, key: str, value: str | None) -> None:
    with ctx.session() as s:
        owner = s.get(model, owner_id)
        pending = {k: v for k, v in (owner.pending or {}).items() if k != key}
        if value is not None:
            pending[key] = value
        owner.pending = pending
        s.commit()


async def run_role(ctx: Ctx, model: type, owner_id: str, key: str, role: str, inp: dict,
                   files: list[str] | tuple = ()) -> dict:
    """Run a brain role and return its output.

    The run id is kept on the owner row (production or task) under `key` while the run is in
    flight, so after a restart control waits for the same run instead of paying for a new one.
    """
    brain = ctx.clients.brain
    with ctx.session() as s:
        run_id = (s.get(model, owner_id).pending or {}).get(key)
    run = None
    if run_id:
        try:
            run = await brain.get(f"/v1/runs/{run_id}")
        except ServiceError as exc:
            if exc.status != 404:
                raise
    if run is None:
        run = await brain.post("/v1/runs", {"role": role, "input": inp, "files": list(files), "wait": False})
        _set_pending(ctx, model, owner_id, key, run["run_id"])
    if run["state"] in ("queued", "running"):
        run = await poll(lambda: brain.get(f"/v1/runs/{run['run_id']}"),
                         lambda r: r["state"] not in ("queued", "running"),
                         interval=ctx.env.control_poll_s, grace_s=ctx.env.control_unreachable_grace_s)
    _set_pending(ctx, model, owner_id, key, None)
    if run["state"] != "succeeded":
        error = run.get("error") or {}
        if error.get("code") == "claude_unavailable":
            raise ClaudeUnavailable("brain", "claude_unavailable", error.get("message") or "no Claude account",
                                    details=error.get("details"))
        raise StepFailed("other", {"code": error.get("code") or "brain_failed", "service": "brain",
                                   "message": error.get("message") or f"the {role} run failed",
                                   "run_id": run["run_id"], "role": role})
    return run.get("output") or {}


# ----------------------------------------------------------------------------- brain inputs


def brain_markets(s: Session, files: Files) -> list[dict]:
    keys = ("code", "name", "languages", "weight", "rpm_index")
    return [{k: m[k] for k in keys} for m in config.markets(s, files, enabled_only=True)]


def brain_learnings(s: Session, files: Files, ap: dict, limit: int = 20) -> list[dict]:
    """Active learnings with a current weight above 0.05, heaviest first (role-inputs.md)."""
    at, half_life = now(), ap["timing"]["half_life_days"]
    rows = [(learning.current_weight(x, half_life, at), x)
            for x in s.scalars(select(Learning).where(Learning.status == "active"))]
    rows.sort(key=lambda r: -r[0])
    return [{"id": x.id, "statement": x.statement, "weight": round(w, 3), "scope": x.scope}
            for w, x in rows if w > 0.05][:limit]


def brain_rubric(rubric: dict) -> dict:
    return {"threshold": rubric["threshold"],
            "dimensions": [{"id": d["id"], "weight": d["weight"], "what": d["what"]} for d in rubric["dimensions"]]}


def recent_topics(s: Session, days: int = 60) -> list[dict]:
    since = now().timestamp() - days * 86400
    out = []
    for prd in s.scalars(select(Production).order_by(Production.created_at.desc()).limit(100)):
        if prd.created_at.timestamp() < since or prd.state == "cancelled":
            continue
        diagnosis = (s.scalar(select(Diagnosis).where(Diagnosis.video_id == prd.video_id)
                              .order_by(Diagnosis.created_at.desc()).limit(1)) if prd.video_id else None)
        out.append({"topic": prd.topic, "angle": prd.angle, "published_at": iso(prd.published_at),
                    "verdict": diagnosis.data.get("verdict") if diagnosis else None})
    return out
