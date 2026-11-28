"""Database tables. JSON columns hold contract documents as received (brief, handoff, scorecard, …).

JSON values are always replaced, never mutated in place, so SQLAlchemy sees every change.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base
from .timeutil import now


class Setting(Base):
    """The owner's edits to the config YAMLs, and computed state (calibration, market refit)."""

    __tablename__ = "settings"
    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    value: Mapped[dict]
    updated_at: Mapped[datetime] = mapped_column(default=now, onupdate=now)


class Task(Base):
    """A research, analytics or learning run (crons and manual buttons)."""

    __tablename__ = "tasks"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    kind: Mapped[str] = mapped_column(String(16), index=True)  # research | analytics | learning
    state: Mapped[str] = mapped_column(String(16), index=True)  # queued|running|waiting|succeeded|failed
    trigger: Mapped[str] = mapped_column(String(16))  # manual | cron
    params: Mapped[dict] = mapped_column(default=lambda: {})
    data: Mapped[dict] = mapped_column(default=lambda: {})  # checkpoints, so a retry resumes
    pending: Mapped[dict] = mapped_column(default=lambda: {})  # brain run ids in flight
    result: Mapped[dict | None]
    error: Mapped[dict | None]
    retry_at: Mapped[datetime | None]
    created_at: Mapped[datetime] = mapped_column(default=now, index=True)
    started_at: Mapped[datetime | None]
    finished_at: Mapped[datetime | None]


class Opportunity(Base):
    __tablename__ = "opportunities"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    task_id: Mapped[str | None] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(16), index=True)  # new|producing|dismissed|expired
    topic: Mapped[str] = mapped_column(Text)
    angle: Mapped[str] = mapped_column(Text, default="")
    format: Mapped[str] = mapped_column(String(8), default="short")
    priority: Mapped[float] = mapped_column(default=0.0)
    data: Mapped[dict]  # the strategist's opportunity plus competitors from the probes
    expires_at: Mapped[datetime | None]
    created_at: Mapped[datetime] = mapped_column(default=now, index=True)
    updated_at: Mapped[datetime] = mapped_column(default=now, onupdate=now)


class Production(Base):
    __tablename__ = "productions"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    state: Mapped[str] = mapped_column(String(24), index=True)
    attention_reason: Mapped[str | None] = mapped_column(String(32))
    resume_state: Mapped[str | None] = mapped_column(String(24))  # where retry goes back to
    retry_at: Mapped[datetime | None]  # not before this time (Claude cooldown, upload pause)
    source: Mapped[str] = mapped_column(String(16))  # manual | opportunity | autopilot
    opportunity_id: Mapped[str | None] = mapped_column(String(40), index=True)
    topic: Mapped[str] = mapped_column(Text)
    angle: Mapped[str | None] = mapped_column(Text)
    markets: Mapped[list] = mapped_column(default=lambda: [])
    notes: Mapped[str | None] = mapped_column(Text)
    brief: Mapped[dict | None]
    job_id: Mapped[str | None] = mapped_column(String(64))
    job_attempt: Mapped[int] = mapped_column(default=0)  # request_id = <production id>:<attempt>
    engine: Mapped[dict | None]  # the last Job seen
    chosen_revision: Mapped[int | None]
    approved: Mapped[bool] = mapped_column(default=False)  # the owner pressed Upload
    final_kit: Mapped[dict | None]
    upload: Mapped[dict | None]  # {attempts, max_attempts, video_id, url, manual}
    video_id: Mapped[str | None] = mapped_column(String(32), index=True)
    video_url: Mapped[str | None] = mapped_column(Text)
    schedule_at: Mapped[datetime | None]
    published_at: Mapped[datetime | None]
    error: Mapped[dict | None]
    pending: Mapped[dict] = mapped_column(default=lambda: {})  # brain run ids, revise notes to send
    timeline: Mapped[list] = mapped_column(default=lambda: [])
    created_at: Mapped[datetime] = mapped_column(default=now, index=True)
    updated_at: Mapped[datetime] = mapped_column(default=now, onupdate=now)


class Revision(Base):
    """One cut from the engine (revision 0 is the first) with its critic scorecard."""

    __tablename__ = "revisions"
    __table_args__ = (UniqueConstraint("production_id", "revision"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    production_id: Mapped[str] = mapped_column(ForeignKey("productions.id", ondelete="CASCADE"), index=True)
    revision: Mapped[int]
    state: Mapped[str] = mapped_column(String(16))  # the handoff's status: completed | unfinished
    handoff: Mapped[dict]
    scorecard: Mapped[dict | None]
    critic: Mapped[dict | None]  # the critic's raw output
    review_notes: Mapped[dict | None]  # ReviewNotes for the next round
    critic_runs: Mapped[int] = mapped_column(default=0)  # rescores
    created_at: Mapped[datetime] = mapped_column(default=now)
    updated_at: Mapped[datetime] = mapped_column(default=now, onupdate=now)


class Snapshot(Base):
    """One analytics export (channel totals); per-video rows are in video_snapshots."""

    __tablename__ = "snapshots"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    task_id: Mapped[str | None] = mapped_column(String(40))
    period_name: Mapped[str] = mapped_column(String(16))
    taken_at: Mapped[datetime] = mapped_column(index=True)
    period: Mapped[dict]
    channel: Mapped[dict]
    missing: Mapped[list] = mapped_column(default=lambda: [])
    created_at: Mapped[datetime] = mapped_column(default=now)


class Video(Base):
    __tablename__ = "videos"
    video_id: Mapped[str] = mapped_column(String(32), primary_key=True)
    production_id: Mapped[str | None] = mapped_column(String(40), index=True)
    title: Mapped[str | None] = mapped_column(Text)
    published_at: Mapped[datetime | None]
    is_short: Mapped[bool | None]
    latest: Mapped[dict] = mapped_column(default=lambda: {})  # metrics, by_country, traffic, retention
    last_snapshot_at: Mapped[datetime | None]
    created_at: Mapped[datetime] = mapped_column(default=now)


class VideoSnapshot(Base):
    __tablename__ = "video_snapshots"
    id: Mapped[int] = mapped_column(primary_key=True)
    video_id: Mapped[str] = mapped_column(String(32), index=True)
    snapshot_id: Mapped[str] = mapped_column(String(40))
    taken_at: Mapped[datetime]
    period: Mapped[dict]
    metrics: Mapped[dict]
    by_country: Mapped[list] = mapped_column(default=lambda: [])
    traffic_sources: Mapped[list] = mapped_column(default=lambda: [])
    retention: Mapped[list] = mapped_column(default=lambda: [])


class Diagnosis(Base):
    __tablename__ = "diagnoses"
    id: Mapped[int] = mapped_column(primary_key=True)
    video_id: Mapped[str] = mapped_column(String(32), index=True)
    production_id: Mapped[str | None] = mapped_column(String(40))
    checkpoint_h: Mapped[float]
    as_of: Mapped[datetime]
    data: Mapped[dict]  # the analyst's Diagnosis
    created_at: Mapped[datetime] = mapped_column(default=now, index=True)


class Learning(Base):
    __tablename__ = "learnings"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    status: Mapped[str] = mapped_column(String(16), index=True)  # active | retired
    scope: Mapped[str] = mapped_column(String(64), default="general")
    statement: Mapped[str] = mapped_column(Text)
    evidence: Mapped[list] = mapped_column(default=lambda: [])
    effect: Mapped[str | None] = mapped_column(Text)
    confidence: Mapped[float]
    applies_to: Mapped[list] = mapped_column(default=lambda: [])
    source: Mapped[str] = mapped_column(String(16), default="learner")  # learner | owner
    confirmations: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(default=now)
    last_confirmed_at: Mapped[datetime] = mapped_column(default=now)
    retired_at: Mapped[datetime | None]
    retired_reason: Mapped[str | None] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(default=now, onupdate=now)


class Event(Base):
    """The dashboard's event stream (GET /api/events)."""

    __tablename__ = "events"
    seq: Mapped[int] = mapped_column(primary_key=True)
    at: Mapped[datetime] = mapped_column(default=now, index=True)
    type: Mapped[str] = mapped_column(String(40))
    production_id: Mapped[str | None] = mapped_column(String(40))
    data: Mapped[dict] = mapped_column(default=lambda: {})
