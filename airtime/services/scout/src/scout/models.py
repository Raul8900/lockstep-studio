"""Contract G (scout) and the parts of contract H (youtube search) scout reads, as pydantic models.

The canonical JSON Schemas are airtime/contracts/scout.schema.json and youtube.schema.json. Scout
adds a few optional fields the schemas allow: `detail` on an item, `sources` on a pack, and
`errors` on a pack and on a probe ({source, key, code, message}).
"""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Metric(BaseModel):
    name: str
    value: int | float | None = None


class SignalItem(BaseModel):
    source: str
    title: str
    url: str | None = None
    language: str | None = None
    rank: int
    metric: Metric
    first_seen: datetime
    category: str | None = None
    detail: str | None = None  # one line of context, e.g. the headline a trend comes from


class SourceError(BaseModel):
    source: str
    key: str | None = None
    code: str
    message: str


class PackSource(BaseModel):
    """Where a pack's items came from. state: fresh = fetched for this request; cached = within its
    TTL; stale = the refresh failed and older data within max_age_h is served; failed = nothing."""

    source: str
    key: str
    state: Literal["fresh", "cached", "stale", "failed"]
    fetched_at: datetime | None = None
    item_count: int = 0
    data_date: date | None = None


class SignalPack(BaseModel):
    market: str
    collected_at: datetime
    items: list[SignalItem]
    errors: list[SourceError] = Field(default_factory=list)
    sources: list[PackSource] = Field(default_factory=list)


class SignalsResponse(BaseModel):
    packs: list[SignalPack]


def normalize_language(value: str) -> str:
    """'PT-br' -> 'pt-BR': the language in lower case, a region in upper case."""
    base, _, region = value.strip().partition("-")
    return f"{base.lower()}-{region.upper()}" if region else base.lower()


class ProbeQuery(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    query: str = Field(min_length=1, max_length=200)
    market: str = Field(pattern=r"^[A-Za-z]{2}$")
    language: str | None = Field(default=None, pattern=r"^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})?$")

    @field_validator("market")
    @classmethod
    def _market_upper(cls, value: str) -> str:
        return value.upper()

    @field_validator("language")
    @classmethod
    def _language_case(cls, value: str | None) -> str | None:
        return normalize_language(value) if value else None


class ProbeRequest(BaseModel):
    queries: list[ProbeQuery] = Field(min_length=1)
    max_results: int = Field(default=20, ge=1, le=100)


class VideoResult(BaseModel):
    model_config = ConfigDict(extra="ignore")

    video_id: str = Field(min_length=1)
    title: str
    channel: str | None = None
    views: int | None = Field(default=None, ge=0)
    age_days: int | float | None = Field(default=None, ge=0)
    duration_s: int | float | None = Field(default=None, ge=0)
    is_short: bool | None = None


class ProbeStats(BaseModel):
    model_config = ConfigDict(extra="ignore")

    result_count: int = 0
    median_views: int | float | None = None
    recent_breakouts: int | None = None
    shorts_share: float | None = None


class TopicProbe(BaseModel):
    query: str
    market: str
    language: str | None
    probed_at: datetime
    results: list[VideoResult]
    stats: ProbeStats
    suggestions: list[str]
    missing: list[str] = Field(default_factory=list)  # parts that could not be filled
    errors: list[SourceError] = Field(default_factory=list)  # why they are missing


class ProbeResponse(BaseModel):
    probes: list[TopicProbe]


class SourceKeyHealth(BaseModel):
    key: str
    ok: bool
    attempted_at: datetime
    last_success_at: datetime | None = None
    consecutive_failures: int = 0
    item_count: int | None = None
    latency_ms: int | None = None
    error_code: str | None = None
    error: str | None = None
    cached_at: datetime | None = None
    expires_at: datetime | None = None


class SourceHealth(BaseModel):
    id: str
    name: str
    kind: Literal["signal", "probe"]
    endpoint: str
    ttl_s: int
    min_interval_s: float | None = None
    status: Literal["ok", "degraded", "down", "unknown"]
    last_attempt_at: datetime | None = None
    last_success_at: datetime | None = None
    last_error: str | None = None
    consecutive_failures: int = 0
    keys: list[SourceKeyHealth] = Field(default_factory=list)


class SourcesResponse(BaseModel):
    fake: bool
    user_agent: str
    sources: list[SourceHealth]
