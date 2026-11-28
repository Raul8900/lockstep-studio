"""Demand and competition probes: what YouTube's search box suggests for a topic in a market
(demand), and what the youtube service's signed-out search finds for it (competition)."""

import asyncio
import statistics
import time
from collections.abc import Callable
from datetime import datetime

import httpx

from scout.http import FetchError, Http
from scout.markets import Market
from scout.models import (
    ProbeQuery,
    ProbeRequest,
    ProbeResponse,
    ProbeStats,
    SearchResponse,
    SourceError,
    TopicProbe,
)
from scout.settings import Settings
from scout.sources import suggest
from scout.store import Store
from scout.timeutil import utcnow

SEARCH = "youtube_search"
SUGGESTIONS = "youtube_autocomplete"


class Prober:
    def __init__(
        self,
        settings: Settings,
        store: Store,
        http: Http,
        markets: Callable[[], dict[str, Market]],
        now: Callable[[], datetime] = utcnow,
    ):
        self.settings, self.store, self.http, self.markets, self.now = (
            settings,
            store,
            http,
            markets,
            now,
        )

    async def probe(self, request: ProbeRequest) -> ProbeResponse:
        known = self.markets()
        probes, youtube_down = [], None
        for query in request.queries:  # one at a time: the youtube service drives one browser
            probe = await self._probe(
                query, known.get(query.market), request.max_results, youtube_down
            )
            for error in probe.errors:
                if error.source == SEARCH and error.code in ("unreachable", "timeout"):
                    youtube_down = error  # don't wait for it again in this request
            probes.append(probe)
        return ProbeResponse(probes=probes)

    async def _probe(
        self,
        q: ProbeQuery,
        market: Market | None,
        max_results: int,
        youtube_down: SourceError | None,
    ) -> TopicProbe:
        language = q.language or (market.language if market else "en")
        cache_key = f"{q.market}:{language}:{q.query.casefold()}"
        (suggestions, suggest_error), (search, searched_at, search_error) = await asyncio.gather(
            self._suggestions(q, language, cache_key),
            self._search(q, language, cache_key, youtube_down),
        )
        missing, errors = [], []
        if suggest_error:
            missing.append("suggestions")
            errors.append(suggest_error)
        if search_error:
            missing += ["results", "stats"]
            errors.append(search_error)
        return TopicProbe(
            query=q.query,
            market=q.market,
            language=language,
            probed_at=searched_at or self.now(),
            results=search.results[:max_results] if search else [],
            stats=probe_stats(search, self.settings) if search else ProbeStats(),
            suggestions=suggestions,
            missing=missing,
            errors=errors,
        )

    async def _suggestions(
        self, q: ProbeQuery, language: str, cache_key: str
    ) -> tuple[list[str], SourceError | None]:
        now = self.now()
        entry = self.store.get("probe_suggestions", cache_key)
        if entry and entry.age_s(now) < self.settings.ttl_suggestions_s:
            return list(entry.payload), None  # type: ignore[call-overload]
        health_key = f"probe:{q.market}:{language}"
        started = time.monotonic()
        try:
            suggestions = await suggest(self.http, q.query, q.market, language)
        except FetchError as exc:
            self.store.record(
                SUGGESTIONS, health_key, now, ok=False, error_code=exc.code, error=exc.message
            )
            return [], SourceError(
                source=SUGGESTIONS, key=health_key, code=exc.code, message=exc.message
            )
        latency = int((time.monotonic() - started) * 1000)
        self.store.put("probe_suggestions", cache_key, now, suggestions)
        self.store.record(
            SUGGESTIONS, health_key, now, ok=True, item_count=len(suggestions), latency_ms=latency
        )
        return suggestions, None

    async def _search(
        self, q: ProbeQuery, language: str, cache_key: str, youtube_down: SourceError | None
    ) -> tuple[SearchResponse | None, datetime | None, SourceError | None]:
        now = self.now()
        entry = self.store.get(SEARCH, cache_key)
        if entry and entry.age_s(now) < self.settings.ttl_youtube_search_s:
            return SearchResponse.model_validate(entry.payload), entry.fetched_at, None
        if youtube_down:
            return None, None, youtube_down
        url = f"{self.settings.youtube_url.rstrip('/')}/v1/search"
        body = {"query": q.query, "market": q.market, "language": language}
        started = time.monotonic()
        try:
            response = await self.http.client.post(
                url, json=body, timeout=self.settings.youtube_timeout_s
            )
            if not response.is_success:
                code, message = _service_error(response)
                raise FetchError(
                    code, f"the youtube service answered HTTP {response.status_code}: {message}"
                )
            search = SearchResponse.model_validate(response.json())
        except httpx.TimeoutException:
            timeout = self.settings.youtube_timeout_s
            error = FetchError(
                "timeout", f"the youtube service ({url}) did not answer in {timeout:g} s"
            )
        except httpx.HTTPError as exc:
            error = FetchError(
                "unreachable", f"the youtube service ({url}) is not reachable: {exc}"
            )
        except ValueError as exc:  # not JSON, or not the contract's shape
            error = FetchError("bad_response", f"the youtube service's answer is unusable: {exc}")
        except FetchError as exc:
            error = exc
        else:
            latency = int((time.monotonic() - started) * 1000)
            self.store.put(SEARCH, cache_key, now, search.model_dump(mode="json"))
            self.store.record(
                SEARCH, "search", now, ok=True, item_count=len(search.results), latency_ms=latency
            )
            return search, now, None
        self.store.record(
            SEARCH, "search", now, ok=False, error_code=error.code, error=error.message
        )
        return None, None, SourceError(source=SEARCH, code=error.code, message=error.message)


def _service_error(response: httpx.Response) -> tuple[str, str]:
    """The service's {"error": {"code", "message"}} envelope, or the bare status."""
    try:
        error = response.json()["error"]
        return str(error["code"]), str(error.get("message", ""))
    except (ValueError, KeyError, TypeError):
        return f"http_{response.status_code}", response.text[:200]


def probe_stats(search: SearchResponse, settings: Settings) -> ProbeStats:
    """The youtube service's stats where it reports them; the rest computed from its results:
    median views, breakouts (uploaded within SCOUT_BREAKOUT_MAX_AGE_DAYS with at least
    SCOUT_BREAKOUT_MIN_VIEWS views) and the share of Shorts among results whose kind is known."""
    results = search.results
    views = [r.views for r in results if r.views is not None]
    kinds = [r.is_short for r in results if r.is_short is not None]
    dated = [r for r in results if r.views is not None and r.age_days is not None]
    computed = ProbeStats(
        result_count=len(results),
        median_views=statistics.median(views) if views else None,
        recent_breakouts=sum(
            1
            for r in dated
            if r.age_days <= settings.breakout_max_age_days
            and r.views >= settings.breakout_min_views
        )
        if dated
        else None,
        shorts_share=round(sum(kinds) / len(kinds), 3) if kinds else None,
    )
    if search.stats is None:
        return computed
    return ProbeStats(
        **{
            name: reported
            if (reported := getattr(search.stats, name)) is not None
            else getattr(computed, name)
            for name in ProbeStats.model_fields
        }
    )
