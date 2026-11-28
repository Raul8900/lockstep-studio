"""SignalPacks per market. Each source is read per key and cached: an answer younger than its TTL
(and than the caller's max_age_h) is served from the cache; an older one is refetched; if that
fails, the old answer is served as `stale` while it is within max_age_h. A key is never fetched
more often than SCOUT_MIN_REFETCH_S, so a failing source is not hammered."""

import asyncio
import time
from collections import defaultdict
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta

from scout.http import FetchError, Http
from scout.markets import Market
from scout.models import (
    PackSource,
    SignalItem,
    SignalPack,
    SignalsResponse,
    SourceError,
    SourceHealth,
    SourceKeyHealth,
    SourcesResponse,
)
from scout.settings import Settings
from scout.sources import SOURCES, SOURCES_BY_ID, Source
from scout.store import Entry, Store
from scout.timeutil import utcnow


@dataclass
class Served:
    source: str
    key: str
    state: str  # fresh | cached | stale | failed
    items: list[SignalItem] = field(default_factory=list)
    fetched_at: datetime | None = None
    data_date: date | None = None
    error: SourceError | None = None


class Collector:
    def __init__(
        self, settings: Settings, store: Store, http: Http, now: Callable[[], datetime] = utcnow
    ):
        self.settings, self.store, self.http, self.now = settings, store, http, now
        self._locks: defaultdict[tuple[str, str], asyncio.Lock] = defaultdict(asyncio.Lock)

    async def signals(
        self, markets: list[Market], max_age_h: float | None = None
    ) -> SignalsResponse:
        if max_age_h is None:
            max_age_h = self.settings.default_max_age_h
        max_age_s = max(max_age_h * 3600, self.settings.min_refetch_s)
        pairs = list(
            dict.fromkeys((src.id, key) for m in markets for src in SOURCES for key in src.keys(m))
        )
        served = await asyncio.gather(
            *(self._serve(SOURCES_BY_ID[source], key, max_age_s) for source, key in pairs)
        )
        by_pair = {(part.source, part.key): part for part in served}
        self.store.prune(self.now() - timedelta(days=self.settings.retention_days))
        return SignalsResponse(packs=[self._pack(market, by_pair) for market in markets])

    def _pack(self, market: Market, by_pair: dict[tuple[str, str], Served]) -> SignalPack:
        parts = [by_pair[(src.id, key)] for src in SOURCES for key in src.keys(market)]
        fetched = [part.fetched_at for part in parts if part.fetched_at]
        return SignalPack(
            market=market.code,
            collected_at=min(fetched) if fetched else self.now(),  # the oldest data in the pack
            items=[item for part in parts for item in part.items],
            errors=[part.error for part in parts if part.error],
            sources=[
                PackSource(
                    source=part.source,
                    key=part.key,
                    state=part.state,
                    fetched_at=part.fetched_at,
                    item_count=len(part.items),
                    data_date=part.data_date,
                )
                for part in parts
            ],
        )

    async def _serve(self, source: Source, key: str, max_age_s: float) -> Served:
        async with self._locks[(source.id, key)]:  # one fetch per key, however many callers
            now = self.now()
            entry = self.store.get(source.id, key)
            age = entry.age_s(now) if entry else float("inf")
            if entry and age < min(source.ttl_s(self.settings), max_age_s):
                return self._cached(source, key, entry, "cached")
            [last] = self.store.health(source.id, key) or [None]
            error = None
            if last and (now - last.attempted_at).total_seconds() < self.settings.min_refetch_s:
                if not last.ok:  # it failed moments ago: don't ask again yet
                    error = SourceError(
                        source=source.id, key=key, code=last.error_code or "error",
                        message=f"{last.error} (retried after {self.settings.min_refetch_s} s)",
                    )  # fmt: skip
            else:
                try:
                    return await self._fetch(source, key, now)
                except FetchError as exc:
                    error = SourceError(
                        source=source.id, key=key, code=exc.code, message=exc.message
                    )
            if entry and age <= max_age_s:
                return self._cached(source, key, entry, "stale" if error else "cached", error)
            if error is None:
                error = SourceError(
                    source=source.id, key=key, code="too_old",
                    message="the cached answer is older than max_age_h",
                )  # fmt: skip
            return Served(source.id, key, "failed", error=error)

    async def _fetch(self, source: Source, key: str, now: datetime) -> Served:
        started = time.monotonic()
        try:
            try:
                fetched = await source.fetch(self.http, key, self.settings, now)
            except (KeyError, TypeError, ValueError) as exc:  # an answer in an unexpected shape
                raise FetchError("bad_response", f"{type(exc).__name__}: {exc}") from exc
        except FetchError as exc:
            latency = int((time.monotonic() - started) * 1000)
            self.store.record(
                source.id,
                key,
                now,
                ok=False,
                latency_ms=latency,
                error_code=exc.code,
                error=exc.message,
            )
            raise
        latency = int((time.monotonic() - started) * 1000)
        first = self.store.first_seen(
            source.id, key, [(item.title, item.first_seen) for item in fetched.items], now
        )
        items = [
            item.model_copy(update={"first_seen": first.get(item.title, item.first_seen)})
            for item in fetched.items
        ]
        payload = [item.model_dump(mode="json") for item in items]
        self.store.put(source.id, key, now, payload, fetched.data_date)
        self.store.record(source.id, key, now, ok=True, item_count=len(items), latency_ms=latency)
        return Served(source.id, key, "fresh", items, now, fetched.data_date)

    @staticmethod
    def _cached(
        source: Source, key: str, entry: Entry, state: str, error: SourceError | None = None
    ) -> Served:
        items = [SignalItem.model_validate(item) for item in entry.payload]  # type: ignore[union-attr]
        return Served(source.id, key, state, items, entry.fetched_at, entry.data_date, error)


# Probe-side sources, listed in GET /v1/sources next to the signal sources.
PROBE_SOURCES = [
    ("youtube_search", "YouTube search through the youtube service", "ttl_youtube_search_s"),
]


def sources_health(settings: Settings, store: Store) -> SourcesResponse:
    """Per-source status from the last attempt for every key: ok (all keys ok), degraded, down
    (no key ok) or unknown (never tried)."""
    by_source = defaultdict(list)
    for row in store.health():
        by_source[row.source].append(row)
    described = [
        (src.id, src.name, "signal", src.endpoint, src.ttl_s(settings)) for src in SOURCES
    ] + [
        (
            sid,
            name,
            "probe",
            f"{settings.youtube_url.rstrip('/')}/v1/search",
            getattr(settings, ttl),
        )
        for sid, name, ttl in PROBE_SOURCES
    ]
    sources = []
    for source_id, name, kind, endpoint, ttl_s in described:
        rows = by_source.get(source_id, [])
        ok = [row.ok for row in rows]
        failed = sorted((row for row in rows if not row.ok), key=lambda row: row.attempted_at)
        successes = [row.last_success_at for row in rows if row.last_success_at]
        sources.append(
            SourceHealth(
                id=source_id,
                name=name,
                kind=kind,
                endpoint=endpoint,
                ttl_s=ttl_s,
                status="unknown"
                if not rows
                else "ok"
                if all(ok)
                else "down"
                if not any(ok)
                else "degraded",
                last_attempt_at=max((row.attempted_at for row in rows), default=None),
                last_success_at=max(successes, default=None),
                last_error=failed[-1].error if failed else None,
                keys=[
                    SourceKeyHealth(
                        key=row.key,
                        ok=row.ok,
                        attempted_at=row.attempted_at,
                        last_success_at=row.last_success_at,
                        consecutive_failures=row.consecutive_failures,
                        item_count=row.item_count,
                        latency_ms=row.latency_ms,
                        error=row.error,
                    )
                    for row in rows
                ],
            )
        )
    return SourcesResponse(fake=settings.fake, user_agent=settings.user_agent, sources=sources)
