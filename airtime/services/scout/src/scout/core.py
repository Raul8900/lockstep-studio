"""Everything scout needs, wired once and shared by the API and the CLI."""

from dataclasses import dataclass

import httpx

from scout.collector import Collector, sources_health
from scout.fake import fake_transport
from scout.http import Http
from scout.markets import Market, load_markets
from scout.models import ProbeRequest, ProbeResponse, SignalsResponse, SourcesResponse
from scout.probe import Prober
from scout.settings import Settings
from scout.store import Store


class UnknownMarket(ValueError):
    def __init__(self, codes: list[str], known: list[str]):
        super().__init__(f"unknown market(s) {', '.join(codes)}; known: {', '.join(known)}")
        self.codes, self.known = codes, known


@dataclass
class Scout:
    settings: Settings
    store: Store
    http: Http
    collector: Collector
    prober: Prober

    @classmethod
    def open(cls, settings: Settings, transport: httpx.AsyncBaseTransport | None = None) -> "Scout":
        """In fake mode every outbound request is answered by the fake transport (no network)."""
        if transport is None and settings.fake:
            transport = fake_transport()
        store = Store(settings.cache_path)
        http = Http(settings, transport)
        markets = lambda: load_markets(settings.markets_path)  # noqa: E731 (re-read: it may change)
        return cls(
            settings,
            store,
            http,
            Collector(settings, store, http),
            Prober(settings, store, http, markets),
        )

    async def aclose(self) -> None:
        await self.http.aclose()
        self.store.close()

    def select(self, codes: list[str] | None) -> list[Market]:
        """The markets asked for, or every enabled one."""
        markets = load_markets(self.settings.markets_path)
        if not codes:
            return [market for market in markets.values() if market.enabled]
        unknown = [code for code in codes if code not in markets]
        if unknown:
            raise UnknownMarket(unknown, list(markets))
        return [markets[code] for code in dict.fromkeys(codes)]

    async def signals(
        self, codes: list[str] | None, max_age_h: float | None = None
    ) -> SignalsResponse:
        return await self.collector.signals(self.select(codes), max_age_h)

    async def probe(self, request: ProbeRequest) -> ProbeResponse:
        return await self.prober.probe(request)

    def sources(self) -> SourcesResponse:
        return sources_health(self.settings, self.store)
