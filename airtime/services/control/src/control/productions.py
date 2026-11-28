"""The production state machine (plan: Lifecycle steps 2–7; addendum F).

  queued → briefing → producing → scoring ⇄ revising → finalizing → awaiting_approval → uploading
  → scheduled → published → monitoring → done

A step that cannot go on ends in needs_attention with a reason: claude_unavailable resumes by itself
after retry_at, the others wait for the owner. The worker calls drive() for every production in a
DRIVEN state; a handler does one step, then reloads the row, checks that nothing changed meanwhile
and moves on. Database work happens only between awaits, so it never interleaves with the API.
"""

from __future__ import annotations

import logging
import os
import re
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import timedelta
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from . import config, kit, planning, scoring
from .clients import ClaudeUnavailable, ServiceError
from .core import (ActionError, Ctx, StepFailed, Superseded, brain_learnings, brain_markets, brain_rubric,
                   emit, poll, run_role)
from .ids import new_id
from .models import Opportunity, Production, Revision
from .timeutil import iso, now, parse_dt

log = logging.getLogger(__name__)

WORK = ("briefing", "producing", "scoring", "revising", "finalizing")  # count toward max_concurrent
DRIVEN = (*WORK, "uploading")
TERMINAL = ("done", "failed", "cancelled")
UPLOAD_FINAL = ("published", "scheduled", "failed", "needs_attention")
SHORT = {"name": "short", "duration_s": {"target": 45, "max": 58}}
MAX_TRANSIENT = 10  # times in a row a service may be down (30 s apart) before the step needs attention


def move(s: Session, prd: Production, state: str, note: str | None = None, **fields) -> None:
    defaults = {"attention_reason": None, "resume_state": None, "retry_at": None}
    if state != "needs_attention":
        defaults["error"] = None
    for key, value in {**defaults, **fields}.items():
        setattr(prd, key, value)
    prd.pending = {k: v for k, v in (prd.pending or {}).items() if k != "transient"}
    prd.state = state
    prd.timeline = [*(prd.timeline or []), {"at": iso(now()), "state": state, "note": note}]
    emit(s, "production.state", prd.id, {"state": state, "attention_reason": prd.attention_reason, "note": note})


def attention(s: Session, prd: Production, reason: str, error: dict, note: str | None = None, **fields) -> None:
    fields.setdefault("resume_state", prd.state)
    move(s, prd, "needs_attention", note or error.get("message"), attention_reason=reason, error=error, **fields)


@contextmanager
def held(ctx: Ctx, pid: str, state: str) -> Iterator[tuple[Session, Production]]:
    """The production, if it is still in `state`; committed on exit."""
    with ctx.session() as s:
        prd = s.get(Production, pid)
        if prd is None or prd.state != state:
            raise Superseded
        yield s, prd
        s.commit()


def revisions(s: Session, pid: str) -> list[Revision]:
    return list(s.scalars(select(Revision).where(Revision.production_id == pid).order_by(Revision.revision)))


def _revision(s: Session, pid: str, n: int | None) -> Revision | None:
    if n is None:
        return None
    return s.scalar(select(Revision).where(Revision.production_id == pid, Revision.revision == n))


async def drive(ctx: Ctx, pid: str) -> None:
    while True:
        with ctx.session() as s:
            prd = s.get(Production, pid)
            if prd is None or prd.state not in DRIVEN or (prd.retry_at and prd.retry_at > now()):
                return
            state = prd.state
        try:
            await HANDLERS[state](ctx, pid)
        except Superseded:
            pass
        except ClaudeUnavailable as exc:
            _settle(ctx, pid, state, claude=exc)
        except StepFailed as exc:
            _settle(ctx, pid, state, reason=exc.reason, error=exc.error)
        except ServiceError as exc:
            _settle(ctx, pid, state, service=exc)
        except Exception as exc:
            log.exception("production %s: the %s step failed", pid, state)
            _settle(ctx, pid, state, reason="other", error={"code": "internal", "message": f"{type(exc).__name__}: {exc}"})
        with ctx.session() as s:
            prd = s.get(Production, pid)
            if prd is None or prd.state == state:  # waiting (between upload attempts, a service down)
                return


def _settle(ctx: Ctx, pid: str, state: str, *, claude: ClaudeUnavailable | None = None,
            service: ServiceError | None = None, reason: str = "other", error: dict | None = None) -> None:
    with ctx.session() as s:
        prd = s.get(Production, pid)
        if prd is None or prd.state != state:
            return
        transient = (prd.pending or {}).get("transient", 0)
        if claude is not None:
            retry_at = claude.retry_at or now() + timedelta(minutes=30)
            attention(s, prd, "claude_unavailable", claude.to_dict(),
                      f"no Claude account is available until {iso(retry_at)}; the step is retried then",
                      retry_at=retry_at)
        elif service is not None and service.transient and transient < MAX_TRANSIENT:
            prd.pending = {**prd.pending, "transient": transient + 1}
            prd.retry_at, prd.error = now() + timedelta(seconds=30), service.to_dict()
            emit(s, "production.updated", pid, {"error": prd.error})
        else:
            if service is not None:
                reason, error = ("engine_failed" if service.service == "engine" else "other"), service.to_dict()
            attention(s, prd, reason, error or {"code": "unknown", "message": "the step failed"})
        s.commit()


# ----------------------------------------------------------------------------- briefing


def normalize_markets(items: list | None) -> list[dict]:
    """[{code, weight}] summing to 1, from [{code, weight}] or ["US", …] (missing weights: equal)."""
    rows: dict[str, float | None] = {}
    for item in items or []:
        code, weight = (item, None) if isinstance(item, str) else (item.get("code"), item.get("weight"))
        if code:
            rows.setdefault(str(code).upper(), float(weight) if weight else None)
    if not rows:
        return []
    if any(w is None for w in rows.values()):
        rows = dict.fromkeys(rows, 1.0)
    total = sum(rows.values())
    return [{"code": code, "weight": round(w / total, 4)} for code, w in rows.items()]


def default_markets(s: Session, ctx: Ctx, top: int = 5) -> list[dict]:
    markets = sorted(config.markets(s, ctx.files, enabled_only=True), key=lambda m: -m["weight"])[:top]
    return normalize_markets([{"code": m["code"], "weight": m["weight"]} for m in markets])


def render_request(b: dict) -> str:
    """The brief in the engine's PROMPTING.md template, for a brief_writer answer without one."""
    lines = [f"Make a {round(b['duration_s']['target'])}-second short about {b['topic']}.", ""]
    for label, value in (("Angle", b["angle"]), ("Audience", b["audience"]), ("Platform", "YouTube Shorts"),
                         ("Tone", ", ".join(b["tone"])), ("", ""), ("Visuals", b["visual_direction"]),
                         ("Give time to", "; ".join(b["give_time_to"])), ("Music", b["music_mood"]), ("", ""),
                         ("Must include", "; ".join(b["must_include"])), ("Avoid", "; ".join(b["avoid"]))):
        if not label:
            lines.append("")
        elif value:
            lines.append(f"{label}: {value}")
    return "\n".join(lines).strip()


def build_brief(out: dict, prd: Production, rubric: dict, learnings: list[dict]) -> dict:
    """The brief_writer's answer completed into a GrowthBrief (contract A)."""
    b = {k: v for k, v in out.items() if k not in ("schema_version", "brief_id", "opportunity_id", "created_at")}
    b["format"] = b.get("format") if b.get("format") in ("short", "long") else "short"
    b.setdefault("duration_s", SHORT["duration_s"])
    b["topic"] = b.get("topic") or prd.topic
    b["angle"] = b.get("angle") or prd.angle or prd.topic
    for key in ("why_now", "audience", "visual_direction", "music_mood"):
        b[key] = str(b.get(key) or "")
    for key in ("tone", "hook_options", "title_options", "must_include", "avoid", "give_time_to"):
        b[key] = [str(x) for x in b.get(key) or []]
    b["keywords"] = {k: list((b.get("keywords") or {}).get(k) or []) for k in ("primary", "secondary")}
    b["language"] = b.get("language") or "en"
    b["markets"] = normalize_markets(b.get("markets")) or prd.markets
    b["title_options"] = [kit.title(t) for t in b["title_options"] if kit.title(t)] or [kit.title(prd.topic)]
    b["hook_options"] = b["hook_options"] or [b["angle"]]
    b["competitors"] = [c for c in b.get("competitors") or []
                        if isinstance(c, dict) and c.get("title") and str(c.get("url", "")).startswith("http")]
    b["learnings"] = [{"id": x["id"], "statement": x["statement"], "weight": x["weight"]} for x in learnings]
    b["rubric"] = brain_rubric(rubric)
    if len(b.get("engine_request_md") or "") < 20:
        b["engine_request_md"] = render_request(b)
    return {"schema_version": "1", "brief_id": new_id("brf"), "opportunity_id": prd.opportunity_id,
            "created_at": iso(now()), **b}


async def _briefing(ctx: Ctx, pid: str) -> None:
    with ctx.session() as s:
        prd = s.get(Production, pid)
        opp = s.get(Opportunity, prd.opportunity_id) if prd.opportunity_id else None
        rubric = config.rubric(s, ctx.files)
        ap = config.autopilot(s, ctx.files)
        opportunity = ({**{k: v for k, v in opp.data.items() if k != "competitors"}, "opportunity_id": opp.id}
                       if opp else {"opportunity_id": None, "topic": prd.topic, "angle": prd.angle or "",
                                    "format": "short", "markets": prd.markets,
                                    "why": prd.notes or "requested by the owner"})
        inp = {"now": iso(now()), "opportunity": opportunity, "markets": brain_markets(s, ctx.files),
               "competitors": (opp.data.get("competitors") if opp else None) or [],
               "learnings": brain_learnings(s, ctx.files, ap), "rubric": brain_rubric(rubric), "format": SHORT,
               "engine_template_md": ctx.engine_template_md}
        if prd.notes:
            inp["owner_notes"] = prd.notes
    out = await run_role(ctx, Production, pid, "brief", "brief_writer", inp)
    with held(ctx, pid, "briefing") as (s, prd):
        move(s, prd, "producing", "brief written", brief=build_brief(out, prd, rubric, inp["learnings"]))


# ----------------------------------------------------------------------------- the engine


def engine_view(job: dict) -> dict:
    keys = ("job_id", "state", "stage", "revision", "slug", "claude", "retry_at", "error", "updated_at")
    return {k: job.get(k) for k in keys}


def revision_done(job: dict, n: int) -> bool:
    if job.get("state") == "completed" and (job.get("revision") or 0) >= n:
        return True
    return any(r.get("revision") == n and r.get("state") == "completed" for r in job.get("revisions") or [])


async def _producing(ctx: Ctx, pid: str) -> None:
    with ctx.session() as s:
        prd = s.get(Production, pid)
        job_id, brief, attempt = prd.job_id, prd.brief, prd.job_attempt
    if not job_id:
        job = await ctx.clients.engine.post("/v1/jobs", {"request_id": f"{pid}:{attempt}", "brief": brief,
                                                         "options": {}})
        with held(ctx, pid, "producing") as (s, prd):
            prd.job_id, prd.engine = job["job_id"], engine_view(job)
            emit(s, "production.engine", pid, prd.engine)
        job_id = job["job_id"]
    await _await_cut(ctx, pid, "producing", job_id)


async def _revising(ctx: Ctx, pid: str) -> None:
    with ctx.session() as s:
        prd = s.get(Production, pid)
        job_id, notes = prd.job_id, (prd.pending or {}).get("revise")
    if notes is not None:
        try:
            await ctx.clients.engine.post(f"/v1/jobs/{job_id}/revise", {"notes": notes})
        except ServiceError as exc:
            if exc.status != 409:  # 409: the engine is already on this revision
                raise
        with held(ctx, pid, "revising") as (s, prd):
            prd.pending = {k: v for k, v in prd.pending.items() if k != "revise"}
    await _await_cut(ctx, pid, "revising", job_id)


async def _await_cut(ctx: Ctx, pid: str, state: str, job_id: str) -> None:
    """Wait for the engine's next revision and store its handoff."""
    with ctx.session() as s:
        expected = len(revisions(s, pid))

    def save(job: dict) -> None:
        with held(ctx, pid, state) as (s, prd):
            view = engine_view(job)
            if view != prd.engine:
                prd.engine = view
                emit(s, "production.engine", pid, view)

    engine = ctx.clients.engine
    job = await poll(lambda: engine.get(f"/v1/jobs/{job_id}"),
                     lambda j: j.get("state") in ("failed", "cancelled") or revision_done(j, expected),
                     interval=ctx.env.control_poll_s, grace_s=ctx.env.control_unreachable_grace_s, on_value=save)
    if not revision_done(job, expected):
        error = job.get("error")
        raise StepFailed("engine_failed", {
            "code": f"job_{job.get('state')}", "job_id": job_id, "service": "engine",
            "message": (error.get("message") if isinstance(error, dict) else error) or f"the engine job {job.get('state')}"})
    handoff = await engine.get(f"/v1/jobs/{job_id}/revisions/{expected}/handoff")
    with held(ctx, pid, state) as (s, prd):
        s.add(Revision(production_id=pid, revision=expected, state=handoff.get("status") or "completed",
                       handoff=handoff))
        move(s, prd, "scoring", f"cut {expected} is ready")


# ----------------------------------------------------------------------------- scoring


def rename_paths(value, names: dict[str, str]):
    """The same document with each sent file's absolute path replaced by the name brain copies it to."""
    if isinstance(value, dict):
        return {k: rename_paths(v, names) for k, v in value.items()}
    if isinstance(value, list):
        return [rename_paths(v, names) for v in value]
    return names.get(value, value) if isinstance(value, str) else value


def critic_inputs(handoff: dict) -> tuple[list[str], dict]:
    """Contact sheet, ≤ 8 keyframes and the captions (role-inputs.md), and the handoff renamed to match."""
    frames = handoff.get("frames") or {}
    paths = [frames.get("contact_sheet"), *[k.get("path") for k in (frames.get("keyframes") or [])[:8]],
             (handoff.get("captions") or {}).get("srt")]
    files = [p for p in paths if p and os.path.isfile(p)]
    return files, rename_paths(handoff, {p: Path(p).name for p in files})


def _clock(seconds: float) -> str:
    return f"{int(seconds // 60)}:{int(seconds % 60):02d}"


def review_notes(critic: dict, card: dict, rubric: dict, round_: int) -> dict:
    """The critic's notes as ReviewNotes for the next round (contract B)."""
    given = critic.get("review_notes") or {}
    notes = []
    for i, n in enumerate(x for x in given.get("notes") or [] if isinstance(x, dict) and x.get("issue") and x.get("change")):
        at = n.get("at_s")
        notes.append({"priority": max(1, int(n.get("priority") or i + 1)), "dimension": str(n.get("dimension") or "general"),
                      "at_s": float(at) if isinstance(at, int | float) and at >= 0 else None, "beat": n.get("beat"),
                      "issue": str(n["issue"]), "change": str(n["change"]),
                      "expected_gain": n.get("expected_gain") if isinstance(n.get("expected_gain"), int | float) else None})
    feedback = given.get("engine_feedback_md") or "\n".join(
        f"- {_clock(n['at_s']) + ', ' if n['at_s'] is not None else ''}{n['beat'] + ': ' if n['beat'] else ''}{n['change']}"
        for n in sorted(notes, key=lambda n: n["priority"]))
    return {"round": round_, "score": card["total"], "threshold": rubric["threshold"],
            "summary": str(given.get("summary") or ""), "notes": notes, "keep": [str(k) for k in given.get("keep") or []],
            "engine_feedback_md": feedback or "- Raise the weakest dimensions of the scorecard."}


def decide(s: Session, prd: Production, rubric: dict) -> None:
    """Pass, revise, or pick the best cut (Lifecycle steps 4–5)."""
    revs = revisions(s, prd.id)
    latest = revs[-1]
    card = latest.scorecard
    if card["passed"]:
        return move(s, prd, "finalizing", f"cut {latest.revision} passes with {card['total']:g}",
                    chosen_revision=latest.revision)
    if latest.revision < rubric["max_rounds"] and not prd.pending.get("no_more_rounds"):
        return move(s, prd, "revising",
                    f"cut {latest.revision} scores {card['total']:g}; asking for revision {latest.revision + 1}",
                    pending={**prd.pending, "revise": latest.review_notes})
    best = scoring.choose([(r.revision, r.scorecard) for r in revs])
    if best is None:
        return attention(s, prd, "hard_gate", {"code": "hard_gate", "message": "every cut fails a hard gate"},
                         "every cut fails a hard gate: choose a cut, ask for a revision, or upload anyway")
    total = next(r.scorecard["total"] for r in revs if r.revision == best)
    move(s, prd, "finalizing", f"cut {best} chosen ({total:g}, the best that passes the hard gates)",
         chosen_revision=best)


async def _scoring(ctx: Ctx, pid: str) -> None:
    with ctx.session() as s:
        prd = s.get(Production, pid)
        rubric, brief = config.rubric(s, ctx.files), prd.brief
        todo = [(r.id, r.revision, r.handoff, r.critic_runs) for r in revisions(s, pid) if r.scorecard is None]
    for rid, n, handoff, runs in todo:
        files, renamed = critic_inputs(handoff)
        with ctx.session() as s:
            previous = [{"revision": r.revision, "scorecard": r.scorecard, "review_notes": r.review_notes}
                        for r in revisions(s, pid) if r.scorecard and r.revision < n]
        inp = {"round": n, "brief": brief, "handoff": renamed, "rubric": brain_rubric(rubric), "previous": previous}
        if runs:
            inp["rescore"] = runs  # a different input, so brain's cache does not answer a rescore
        critic = await run_role(ctx, Production, pid, f"critic:{n}:{runs}", "critic", inp, files)
        with held(ctx, pid, "scoring") as (s, prd):
            rev = s.get(Revision, rid)
            card = scoring.scorecard(critic, handoff, rubric)
            rev.critic, rev.scorecard = critic, card
            rev.review_notes = review_notes(critic, card, rubric, n + 1)
            emit(s, "production.scored", pid, {"revision": n, "total": card["total"], "gates_passed": card["gates_passed"]})
    with held(ctx, pid, "scoring") as (s, prd):
        decide(s, prd, rubric)


# ----------------------------------------------------------------------------- publishing


async def _finalizing(ctx: Ctx, pid: str) -> None:
    with ctx.session() as s:
        prd = s.get(Production, pid)
        rev = _revision(s, pid, prd.chosen_revision)
        if rev is None:
            raise StepFailed("other", {"code": "no_cut", "message": "no cut is chosen"})
        n, handoff, card, brief = rev.revision, rev.handoff, rev.scorecard, prd.brief or {}
        markets = brain_markets(s, ctx.files)
    hk = handoff.get("publish_kit") or {}
    thumbs = [t["path"] for t in hk.get("thumbnail_candidates") or [] if os.path.isfile(t.get("path") or "")][:4]
    languages = ctx.files.translate_to
    seo = await run_role(ctx, Production, pid, f"seo:{n}", "seo", {
        "brief": brief, "publish_kit": rename_paths(hk, {p: Path(p).name for p in thumbs}),
        "script": {"title": handoff["script"].get("title"), "text": handoff["script"].get("text")},
        "markets": markets, "languages": languages, "competitors": brief.get("competitors") or [],
        "scorecard": card}, thumbs)
    srt = (handoff.get("captions") or {}).get("srt")
    cues = kit.read_srt(srt) if srt and os.path.isfile(srt) else []
    translations: dict[str, list[str]] = {}
    if cues and languages:
        out = await run_role(ctx, Production, pid, f"translate:{n}", "translator", {
            "source_language": (handoff.get("captions") or {}).get("language") or "en", "languages": languages,
            "lines": [{"i": i, "text": c.text} for i, c in enumerate(cues)],
            "context": {"topic": brief.get("topic") or handoff["script"].get("title"), "title": seo.get("title")}})
        translations = kit.complete_translations(out, len(cues))
    final = kit.build(ctx.env.airtime_data_dir / "publish" / pid, handoff, seo, cues, translations, thumbs)
    with held(ctx, pid, "finalizing") as (s, prd):
        ap = config.autopilot(s, ctx.files)
        market = planning.main_market(brief.get("markets") or prd.markets,
                                      config.markets(s, ctx.files, enabled_only=True), final["schedule_market"])
        at = planning.schedule_time(ap["timing"]["schedule_strategy"], market, now())
        final.update(schedule_at=iso(at), schedule_market=market["code"] if market else None,
                     visibility=ap["upload_visibility"])
        missing = [lang for lang in languages if lang not in translations] if cues else []
        note = "publish kit ready" + (f"; no captions in {', '.join(missing)}" if missing else "")
        upload_now = prd.approved or ap["auto_upload"]
        move(s, prd, "uploading" if upload_now else "awaiting_approval", note, final_kit=final, schedule_at=at)


def _with_attempt(upload: dict, attempt: dict) -> dict:
    attempts = sorted([a for a in upload["attempts"] if a["n"] != attempt["n"]] + [attempt], key=lambda a: a["n"])
    return {**upload, "attempts": attempts}


def _merge_attempt(attempt: dict, status: dict) -> dict:
    merged = {**attempt, "state": status.get("state") or attempt["state"], "error": status.get("error"),
              "video_id": status.get("video_id") or attempt.get("video_id"),
              "url": status.get("url") or attempt.get("url"), "steps": status.get("steps") or attempt.get("steps") or []}
    if merged["state"] in ("published", "scheduled") and not merged["video_id"]:
        merged.update(state="failed", error={"code": "no_video_id", "message": "youtube reported no video id"})
    return merged


async def _uploading(ctx: Ctx, pid: str) -> None:
    """One upload attempt (addendum F): at most upload_max_attempts, resuming a video already created."""
    with ctx.session() as s:
        prd = s.get(Production, pid)
        ap = config.autopilot(s, ctx.files)
        upload = prd.upload or {"attempts": [], "max_attempts": ap["upload_max_attempts"], "video_id": None,
                                "url": None, "manual": False}
        final, brief_markets = prd.final_kit, (prd.brief or {}).get("markets") or prd.markets
        markets = config.markets(s, ctx.files, enabled_only=True)
    if not final:
        raise StepFailed("other", {"code": "no_kit", "message": "there is no publish kit"})

    def save(attempt: dict) -> None:
        nonlocal upload
        with held(ctx, pid, "uploading") as (s, prd):
            upload = _with_attempt(prd.upload or upload, attempt)
            if upload != prd.upload:
                prd.upload, prd.retry_at = upload, None
                emit(s, "production.upload", pid, {"n": attempt["n"], "state": attempt["state"]})

    youtube = ctx.clients.youtube
    attempts = upload["attempts"]
    attempt = attempts[-1] if attempts and attempts[-1]["state"] not in UPLOAD_FINAL else None
    if attempt is None:
        resume = next((a["video_id"] for a in reversed(attempts) if a.get("video_id")), upload.get("resume_video_id"))
        at = parse_dt(final.get("schedule_at"))
        if at is not None and at < now() + planning.UPLOAD_LEAD / 2:  # the suggested time is (nearly) past
            market = planning.main_market(brief_markets, markets, final.get("schedule_market"))
            at = planning.schedule_time("market_prime_time", market, now())
        request = kit.upload_request(final, upload_id=new_id("upl"), resume_video_id=resume, schedule_at=iso(at),
                                     visibility=final.get("visibility") or ap["upload_visibility"])
        attempt = {"n": len(attempts) + 1, "upload_id": request["upload_id"], "state": "queued", "error": None,
                   "steps": [], "video_id": resume, "url": None, "schedule_at": iso(at), "started_at": iso(now())}
        save(attempt)
        try:
            status = await youtube.post("/v1/uploads", request)
        except ServiceError as exc:
            status = {"state": "failed", "error": exc.to_dict()}
        attempt = _merge_attempt(attempt, status)
        save(attempt)
    if attempt["state"] not in UPLOAD_FINAL:
        def progress(status: dict) -> None:
            save(_merge_attempt(attempt, status))

        try:
            status = await poll(lambda: youtube.get(f"/v1/uploads/{attempt['upload_id']}"),
                                lambda st: st.get("state") in UPLOAD_FINAL, interval=ctx.env.control_poll_s,
                                grace_s=ctx.env.control_unreachable_grace_s, on_value=progress)
        except ServiceError as exc:
            status = {"state": "failed", "error": exc.to_dict()}
        attempt = _merge_attempt(attempt, status)
    with held(ctx, pid, "uploading") as (s, prd):
        upload = _with_attempt(prd.upload or upload, attempt)
        n, vid = attempt["n"], attempt["video_id"]
        if attempt["state"] in ("published", "scheduled"):
            url = attempt.get("url") or f"https://youtube.com/shorts/{vid}"
            at = parse_dt(attempt.get("schedule_at")) if attempt["state"] == "scheduled" else None
            move(s, prd, attempt["state"], f"uploaded as {vid} (attempt {n})", upload={**upload, "video_id": vid, "url": url},
                 video_id=vid, video_url=url, schedule_at=at, published_at=at or now())
        elif n >= upload["max_attempts"]:
            error = attempt.get("error")
            attention(s, prd, "upload_failed", error if isinstance(error, dict) else {"code": "upload_failed", "message": str(error)},
                      f"the upload failed {n} times: upload it by hand, then mark it uploaded", upload=upload)
        else:
            prd.upload, prd.retry_at = upload, now() + timedelta(seconds=ctx.env.control_upload_retry_s)
            prd.timeline = [*prd.timeline, {"at": iso(now()), "state": "uploading",
                                            "note": f"attempt {n} failed; trying again"}]
            emit(s, "production.upload", pid, {"n": n, "state": attempt["state"]})


HANDLERS = {"briefing": _briefing, "producing": _producing, "revising": _revising, "scoring": _scoring,
            "finalizing": _finalizing, "uploading": _uploading}


# ----------------------------------------------------------------------------- the owner's actions


def _conflict(message: str) -> ActionError:
    return ActionError(409, "invalid_state", message)


def create(s: Session, ctx: Ctx, *, topic: str, angle: str | None = None, markets: list | None = None,
           notes: str | None = None, source: str = "manual", opportunity: Opportunity | None = None) -> Production:
    prd = Production(id=new_id("prd"), state="queued", source=source, topic=topic.strip(),
                     opportunity_id=opportunity.id if opportunity else None, angle=(angle or "").strip() or None,
                     markets=normalize_markets(markets) or default_markets(s, ctx), notes=notes,
                     pending={}, timeline=[])
    s.add(prd)
    move(s, prd, "queued", f"created from {opportunity.id}" if opportunity else "created")
    return prd


def from_opportunity(s: Session, ctx: Ctx, opp: Opportunity, source: str = "opportunity") -> Production:
    if opp.status not in ("new", "expired"):
        raise _conflict(f"the opportunity is {opp.status}")
    opp.status = "producing"
    return create(s, ctx, topic=opp.topic, angle=opp.angle, markets=opp.data.get("markets"), source=source,
                  opportunity=opp)


def autopilot(s: Session, ctx: Ctx, ap: dict) -> list[Production]:
    """Start the day's productions from the best opportunities (auto mode, within the daily cap)."""
    day = now().astimezone(ZoneInfo(ap["timezone"])).replace(hour=0, minute=0, second=0, microsecond=0)
    made = s.scalar(select(func.count()).select_from(Production)
                    .where(Production.source == "autopilot", Production.created_at >= day))
    room = ap["limits"]["max_productions_per_day"] - made
    since = now() - timedelta(days=ap["timing"]["topic_cooldown_days"])
    recent = list(s.scalars(select(Production.topic).where(Production.created_at >= since,
                                                           Production.state != "cancelled")))
    created = []
    for opp in s.scalars(select(Opportunity).where(Opportunity.status == "new")
                         .order_by(Opportunity.priority.desc(), Opportunity.created_at)):
        if len(created) >= room:
            break
        if (opp.expires_at and opp.expires_at < now()) or planning.duplicate_of(opp.topic, recent):
            continue
        created.append(from_opportunity(s, ctx, opp, source="autopilot"))
        recent.append(opp.topic)
    return created


def cancel(s: Session, prd: Production) -> None:
    if prd.state in TERMINAL:
        raise _conflict(f"the production is already {prd.state}")
    move(s, prd, "cancelled", "cancelled by the owner")


def retry(s: Session, ctx: Ctx, prd: Production) -> None:
    if prd.state == "needs_attention" and prd.attention_reason == "upload_failed":
        return approve_upload(s, ctx, prd)
    if prd.state == "needs_attention" and prd.attention_reason == "hard_gate":
        raise _conflict("every cut fails a hard gate: choose a cut, ask for a revision or upload anyway")
    if prd.state not in ("needs_attention", "failed") or not prd.resume_state:
        raise _conflict(f"nothing to retry in {prd.state}")
    target, fields = prd.resume_state, {}
    if prd.attention_reason == "engine_failed" and target == "producing":
        fields = {"job_id": None, "job_attempt": prd.job_attempt + 1, "engine": None}  # a new engine job
    elif prd.attention_reason == "engine_failed" and target == "revising":
        target, fields = "scoring", {"pending": {**prd.pending, "no_more_rounds": True}}  # use the cuts there are
    move(s, prd, target, "retried by the owner", **fields)


def _require_revision(s: Session, prd: Production, n: int) -> Revision:
    rev = _revision(s, prd.id, n)
    if rev is None:
        raise ActionError(404, "not_found", f"there is no cut {n}")
    return rev


def approve_upload(s: Session, ctx: Ctx, prd: Production, revision: int | None = None) -> None:
    """The owner's one click (also: upload anyway after a hard gate, or try again after upload_failed)."""
    attention_reason = prd.attention_reason if prd.state == "needs_attention" else None
    if revision is not None and revision != prd.chosen_revision:
        if prd.state != "awaiting_approval" and attention_reason not in ("hard_gate", "upload_failed"):
            raise _conflict(f"cannot upload from {prd.state}")
        _require_revision(s, prd, revision)
        return move(s, prd, "finalizing", f"cut {revision} chosen; it uploads when its kit is ready",
                    chosen_revision=revision, final_kit=None, upload=None, approved=True)
    if prd.state == "awaiting_approval":
        move(s, prd, "uploading", "upload approved", approved=True)
    elif attention_reason == "upload_failed":
        up = prd.upload or {"attempts": []}
        resume = next((a["video_id"] for a in reversed(up["attempts"]) if a.get("video_id")), up.get("resume_video_id"))
        move(s, prd, "uploading", "upload tried again by the owner", approved=True,
             upload={**up, "attempts": [], "resume_video_id": resume,
                     "earlier_attempts": [*up.get("earlier_attempts", []), *up["attempts"]]})
    elif attention_reason == "hard_gate":
        best = scoring.best_by_total([(r.revision, r.scorecard) for r in revisions(s, prd.id)])
        if best is None:
            raise _conflict("no cut is scored")
        move(s, prd, "finalizing", f"upload anyway: cut {best}, the highest score", chosen_revision=best,
             final_kit=None, upload=None, approved=True)
    else:
        raise _conflict(f"cannot upload from {prd.state}")


def choose(s: Session, prd: Production, revision: int) -> None:
    if prd.state != "awaiting_approval" and not (
            prd.state == "needs_attention" and prd.attention_reason in ("hard_gate", "upload_failed")):
        raise _conflict(f"cannot choose a cut in {prd.state}")
    _require_revision(s, prd, revision)
    move(s, prd, "finalizing", f"cut {revision} chosen by the owner", chosen_revision=revision,
         final_kit=None, upload=None)


def _reviewable(prd: Production) -> None:
    if prd.state != "awaiting_approval" and not (prd.state == "needs_attention" and prd.attention_reason == "hard_gate"):
        raise _conflict(f"cannot do that in {prd.state}")


def request_revision(s: Session, prd: Production, notes_md: str | None) -> None:
    """Another round beyond the automatic ones, with the owner's notes first."""
    _reviewable(prd)
    revs = revisions(s, prd.id)
    if not prd.job_id or not revs or not revs[-1].review_notes:
        raise _conflict("the latest cut has not been scored yet")
    notes = {**revs[-1].review_notes, "round": revs[-1].revision + 1}
    if notes_md and notes_md.strip():
        notes["engine_feedback_md"] = f"{notes_md.strip()}\n{notes['engine_feedback_md']}".strip()
    move(s, prd, "revising", "revision asked for by the owner", pending={**prd.pending, "revise": notes},
         chosen_revision=None, final_kit=None, upload=None, approved=False)


def rescore(s: Session, prd: Production, revision: int | None) -> None:
    _reviewable(prd)
    revs = revisions(s, prd.id)
    rev = _require_revision(s, prd, revision) if revision is not None else (revs[-1] if revs else None)
    if rev is None:
        raise _conflict("there is no cut to score")
    rev.scorecard, rev.critic_runs = None, rev.critic_runs + 1
    move(s, prd, "scoring", f"scoring cut {rev.revision} again", final_kit=None)


def edit_final_kit(s: Session, prd: Production, edit: dict) -> None:
    if not prd.final_kit or (prd.state != "awaiting_approval" and not (
            prd.state == "needs_attention" and prd.attention_reason == "upload_failed")):
        raise _conflict(f"the publish kit cannot be edited in {prd.state}")
    if "schedule_at" in edit and edit["schedule_at"] is not None:
        at = parse_dt(edit["schedule_at"])
        if at is None or at < now():
            raise ActionError(422, "invalid_request", "schedule_at must be a future time")
        edit = {**edit, "schedule_at": iso(at)}
        prd.schedule_at = at
    prd.final_kit = kit.apply_edit(prd.final_kit, edit)
    prd.timeline = [*prd.timeline, {"at": iso(now()), "state": prd.state, "note": "publish kit edited by the owner"}]
    emit(s, "production.updated", prd.id, {"final_kit": "edited"})


_VIDEO_ID = re.compile(r"[A-Za-z0-9_-]{11}")


def parse_video_id(text: str) -> str | None:
    """The video id in a YouTube watch, shorts, youtu.be or Studio URL, or a bare 11-character id."""
    text = text.strip()
    if _VIDEO_ID.fullmatch(text):
        return text
    url = urlparse(text if "://" in text else f"https://{text}")
    host = (url.hostname or "").lower().removeprefix("www.").removeprefix("m.")
    parts = [p for p in url.path.split("/") if p]
    if host == "youtu.be":
        candidate = parts[0] if parts else ""
    elif host == "youtube.com" or host.endswith(".youtube.com"):
        candidate = parse_qs(url.query).get("v", [""])[0] or (
            parts[1] if len(parts) >= 2 and parts[0] in ("shorts", "live", "embed", "v", "video") else "")
    else:
        return None
    return candidate if _VIDEO_ID.fullmatch(candidate) else None


def mark_uploaded(s: Session, ctx: Ctx, prd: Production, video_url: str) -> None:
    """The owner uploaded it by hand: monitoring carries on as if Airtime had uploaded it."""
    vid = parse_video_id(video_url)
    if vid is None:
        raise ActionError(422, "invalid_video_url", "not a YouTube video URL or id")
    if prd.state not in ("awaiting_approval", "uploading", "needs_attention", "failed"):
        raise _conflict(f"cannot mark the production uploaded in {prd.state}")
    other = s.scalar(select(Production.id).where(Production.video_id == vid, Production.id != prd.id))
    if other:
        raise _conflict(f"{vid} belongs to {other}")
    url = f"https://youtube.com/shorts/{vid}"
    ap = config.autopilot(s, ctx.files)
    up = prd.upload or {"attempts": [], "max_attempts": ap["upload_max_attempts"]}
    move(s, prd, "monitoring", f"uploaded by hand as {vid}", video_id=vid, video_url=url, published_at=now(),
         upload={**up, "video_id": vid, "url": url, "manual": True})
