"""The free signal sources: where each one is read, and how its answer becomes SignalItems.

Each source is fetched per key: a country (google_trends, wikimedia_country), a language wiki
(wikimedia_language), a market and language (youtube_autocomplete), or "global" (hacker_news).
"""

import json
import re
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from email.utils import parsedate_to_datetime
from urllib.parse import quote, quote_plus
from xml.etree.ElementTree import ParseError

import httpx
from defusedxml import DefusedXmlException
from defusedxml.ElementTree import fromstring

from scout.http import FetchError, Http
from scout.markets import Market
from scout.models import Metric, SignalItem
from scout.settings import Settings
from scout.timeutil import from_iso

TRENDS_RSS = "https://trends.google.com/trending/rss"
WIKIMEDIA = "https://wikimedia.org/api/rest_v1/metrics/pageviews"
AUTOCOMPLETE = "https://suggestqueries.google.com/complete/search"
HN_SEARCH = "https://hn.algolia.com/api/v1/search"

# Minimum seconds between two requests to the same host.
TRENDS_GAP_S, WIKIMEDIA_GAP_S, AUTOCOMPLETE_GAP_S, HN_GAP_S = 1.0, 0.2, 0.5, 1.0

HT = "{https://trends.google.com/trending/rss}"


@dataclass
class Fetched:
    items: list[SignalItem]
    data_date: date | None = None


FetchFn = Callable[[Http, str, Settings, datetime], Awaitable[Fetched]]


@dataclass(frozen=True)
class Source:
    id: str
    name: str
    endpoint: str
    ttl_setting: str
    keys: Callable[[Market], list[str]]  # the keys a market's pack needs
    fetch: FetchFn

    def ttl_s(self, settings: Settings) -> int:
        return getattr(settings, self.ttl_setting)


def _json(response: httpx.Response) -> object:
    try:
        return response.json()
    except ValueError as exc:
        raise FetchError("bad_response", f"{response.url.host} did not answer JSON") from exc


def youtube_search_url(query: str) -> str:
    return f"https://www.youtube.com/results?search_query={quote_plus(query)}"


# --- Google Trends: trending searches per country -------------------------------------------


async def fetch_trends(http: Http, geo: str, settings: Settings, now: datetime) -> Fetched:
    response = await http.get(TRENDS_RSS, params={"geo": geo}, min_interval_s=TRENDS_GAP_S)
    return Fetched(parse_trends(response.text, geo, now)[: settings.items_per_source])


def parse_trends(xml_text: str, geo: str, now: datetime) -> list[SignalItem]:
    """The feed lists ~10 searches, newest first; they are ranked by approximate traffic."""
    try:
        root = fromstring(xml_text)
    except (ParseError, DefusedXmlException) as exc:
        raise FetchError("bad_response", f"Trends feed for {geo} is not RSS: {exc}") from exc
    if root.tag != "rss":
        raise FetchError("bad_response", f"Trends feed for {geo} is not RSS")
    rows = []
    for item in root.iter("item"):
        title = (item.findtext("title") or "").strip()
        if not title:
            continue
        url, detail = None, None
        news = item.find(f"{HT}news_item")
        if news is not None:
            url = (news.findtext(f"{HT}news_item_url") or "").strip() or None
            headline = (news.findtext(f"{HT}news_item_title") or "").strip()
            outlet = (news.findtext(f"{HT}news_item_source") or "").strip()
            detail = f"{headline} ({outlet})" if headline and outlet else headline or None
        explore = f"https://trends.google.com/trends/explore?geo={geo}&q={quote_plus(title)}"
        started = _rfc822(item.findtext("pubDate")) or now
        rows.append(
            (_traffic(item.findtext(f"{HT}approx_traffic")), title, url or explore, started, detail)
        )
    rows.sort(key=lambda row: -(row[0] or 0))  # stable: equal traffic keeps newest first
    return [
        SignalItem(
            source="google_trends",
            title=title,
            url=url,
            rank=rank,
            metric=Metric(name="approx_traffic", value=traffic),
            first_seen=started,
            detail=detail,
        )
        for rank, (traffic, title, url, started, detail) in enumerate(rows, 1)
    ]


def _traffic(text: str | None) -> int | None:
    """'2000+' → 2000, '20K+' → 20000, '1M+' → 1000000."""
    match = re.fullmatch(r"([\d.,]+)\s*([KkMm]?)\+?", (text or "").strip())
    if not match:
        return None
    try:
        number = float(match[1].replace(",", ""))
    except ValueError:
        return None
    return int(number * {"": 1, "k": 1_000, "m": 1_000_000}[match[2].lower()])


def _rfc822(text: str | None) -> datetime | None:
    try:
        return parsedate_to_datetime(text).astimezone(UTC).replace(microsecond=0)
    except (TypeError, ValueError):
        return None


# --- Wikimedia: most-viewed Wikipedia articles per country and per language wiki --------------

# A namespace prefix: "Special:Search", "Wikipedia:Portada", "विशेष:खोज" (an article title with a
# colon has a space after it, "Mission:_Impossible").
_NAMESPACED = re.compile(r"^[^_:]+:[^_]")
_MAIN_PAGES = {
    "-", "Main_Page", "メインページ", "मुखपृष्ठ", "Заглавная_страница", "Pagina_principale",
    "Hoofdpagina", "Anasayfa", "الصفحة_الرئيسية",
}  # fmt: skip


# Wikimedia's robot policy asks automated clients for contact information in the User-Agent and
# refuses many that have none. Scout does not work around that: the owner decides whether to add it.
WIKIMEDIA_BLOCKED = (
    "Wikimedia refused the request: its robot policy (https://w.wiki/4wJS) asks for contact "
    "information (an e-mail address or website) in the User-Agent. To use this source, set "
    "SCOUT_USER_AGENT, e.g. 'Airtime/0.1 (self-hosted trend research; <e-mail or website>)'."
)


def is_article(title: str) -> bool:
    return bool(title) and title not in _MAIN_PAGES and not _NAMESPACED.match(title)


async def fetch_wikimedia_country(
    http: Http, country: str, settings: Settings, now: datetime
) -> Fetched:
    return await _wikimedia(
        http, settings, now, "wikimedia_country", "views_ceil", None,
        lambda day: f"{WIKIMEDIA}/top-per-country/{country}/all-access/{day:%Y/%m/%d}",
    )  # fmt: skip


async def fetch_wikimedia_language(
    http: Http, language: str, settings: Settings, now: datetime
) -> Fetched:
    project = f"{language}.wikipedia"
    return await _wikimedia(
        http, settings, now, "wikimedia_language", "views", project,
        lambda day: f"{WIKIMEDIA}/top/{project}/all-access/{day:%Y/%m/%d}",
    )  # fmt: skip


async def _wikimedia(
    http: Http,
    settings: Settings,
    now: datetime,
    source: str,
    views_field: str,
    project: str | None,
    url_for: Callable[[date], str],
) -> Fetched:
    """The newest published day: yesterday (UTC), or an earlier day while it is not out yet."""
    yesterday = now.date() - timedelta(days=1)
    for lag in range(settings.wikimedia_max_lag_days):
        day = yesterday - timedelta(days=lag)
        try:
            response = await http.get(url_for(day), min_interval_s=WIKIMEDIA_GAP_S)
        except FetchError as exc:
            if exc.code == "not_found":
                continue
            if exc.code == "http_403":
                raise FetchError("blocked_by_policy", WIKIMEDIA_BLOCKED) from exc
            raise
        items = parse_wikimedia(_json(response), source, views_field, project, day)
        return Fetched(items[: settings.items_per_source], data_date=day)
    raise FetchError(
        "not_found", f"no data published for the last {settings.wikimedia_max_lag_days} days"
    )


def parse_wikimedia(
    data: object, source: str, views_field: str, project: str | None, day: date
) -> list[SignalItem]:
    """Articles only (no main pages, searches or other namespaces), from Wikipedias only."""
    try:
        articles = data["items"][0]["articles"]  # type: ignore[index]
    except (KeyError, IndexError, TypeError) as exc:
        raise FetchError("bad_response", "Wikimedia answer has no articles") from exc
    day_start = datetime(day.year, day.month, day.day, tzinfo=UTC)
    items: list[SignalItem] = []
    for article in articles:
        wiki = project or str(article.get("project", ""))
        title = str(article.get("article", ""))
        if not wiki.endswith(".wikipedia") or not is_article(title):
            continue
        items.append(
            SignalItem(
                source=source,
                title=title.replace("_", " "),
                url=f"https://{wiki}.org/wiki/{quote(title, safe='/:(),')}",
                language=wiki.split(".")[0],
                rank=len(items) + 1,
                metric=Metric(name="views", value=article.get(views_field)),
                first_seen=day_start,
            )
        )
    return items


# --- YouTube search autocomplete per market and language ------------------------------------


async def suggest(http: Http, query: str, market: str, language: str) -> list[str]:
    """What YouTube's search box suggests for `query` to people in `market` using `language`."""
    params = {"client": "firefox", "ds": "yt", "hl": language, "gl": market, "q": query}
    response = await http.get(AUTOCOMPLETE, params=params, min_interval_s=AUTOCOMPLETE_GAP_S)
    return parse_autocomplete(response.text, query)


def parse_autocomplete(text: str, query: str) -> list[str]:
    """Accepts the JSON form (["q", ["s1", ...], ...]) and the JSONP form (["s1", 0, [..]])."""
    text = text.strip()
    if not text.startswith("["):  # window.google.ac.h([...])
        start, end = text.find("("), text.rfind(")")
        text = text[start + 1 : end] if 0 <= start < end else text
    try:
        data = json.loads(text)
    except ValueError as exc:
        raise FetchError("bad_response", "autocomplete answer is not JSON") from exc
    if not isinstance(data, list) or len(data) < 2 or not isinstance(data[1], list):
        raise FetchError("bad_response", "autocomplete answer has no suggestions list")
    seen, suggestions = {query.strip().casefold()}, []
    for entry in data[1]:
        value = entry[0] if isinstance(entry, list) and entry else entry
        value = value.strip() if isinstance(value, str) else ""
        if value and value.casefold() not in seen:
            seen.add(value.casefold())
            suggestions.append(value)
    return suggestions


async def fetch_autocomplete(http: Http, key: str, settings: Settings, now: datetime) -> Fetched:
    """Completions of a few explainer seeds ("how does …"), interleaved so the top completion of
    every seed comes before the second of any."""
    market, language = key.split(":")
    seeds = settings.seeds_for(language)
    lists = [await suggest(http, seed, market, language) for seed in seeds]
    items: list[SignalItem] = []
    seen: set[str] = set()
    for position in range(max(map(len, lists), default=0)):
        for seed, suggestions in zip(seeds, lists, strict=True):
            if position >= len(suggestions) or suggestions[position].casefold() in seen:
                continue
            seen.add(suggestions[position].casefold())
            items.append(
                SignalItem(
                    source="youtube_autocomplete",
                    title=suggestions[position],
                    url=youtube_search_url(suggestions[position]),
                    language=language,
                    rank=len(items) + 1,
                    metric=Metric(name="suggestion_rank", value=position + 1),
                    first_seen=now,
                    detail=f"completes “{seed}”",
                )
            )
    return Fetched(items[: settings.items_per_source])


# --- Hacker News front page -----------------------------------------------------------------


async def fetch_hacker_news(http: Http, key: str, settings: Settings, now: datetime) -> Fetched:
    params = {"tags": "front_page", "hitsPerPage": 30}
    response = await http.get(HN_SEARCH, params=params, min_interval_s=HN_GAP_S)
    return Fetched(parse_hacker_news(_json(response), now)[: settings.items_per_source])


def parse_hacker_news(data: object, now: datetime) -> list[SignalItem]:
    hits = data.get("hits") if isinstance(data, dict) else None
    if not isinstance(hits, list):
        raise FetchError("bad_response", "Hacker News answer has no hits")
    stories = [hit for hit in hits if isinstance(hit, dict) and hit.get("title")]
    stories.sort(key=lambda hit: -(hit.get("points") or 0))
    items = []
    for rank, hit in enumerate(stories, 1):
        try:
            posted = from_iso(hit["created_at"])
        except (KeyError, TypeError, ValueError):
            posted = now
        items.append(
            SignalItem(
                source="hacker_news",
                title=hit["title"],
                url=hit.get("url") or f"https://news.ycombinator.com/item?id={hit.get('objectID')}",
                language="en",
                rank=rank,
                metric=Metric(name="points", value=hit.get("points")),
                first_seen=posted,
                category="technology",
                detail=f"{hit.get('num_comments') or 0} comments on Hacker News",
            )
        )
    return items


SOURCES: list[Source] = [
    Source(
        "google_trends", "Google Trends trending searches (RSS)", TRENDS_RSS,
        "ttl_google_trends_s", lambda m: [m.code], fetch_trends,
    ),
    Source(
        "wikimedia_country", "Wikipedia most-viewed articles per country",
        f"{WIKIMEDIA}/top-per-country", "ttl_wikimedia_s", lambda m: [m.code],
        fetch_wikimedia_country,
    ),
    Source(
        "wikimedia_language", "Wikipedia most-viewed articles per language wiki",
        f"{WIKIMEDIA}/top", "ttl_wikimedia_s", lambda m: list(m.languages),
        fetch_wikimedia_language,
    ),
    Source(
        "youtube_autocomplete", "YouTube search autocomplete", AUTOCOMPLETE,
        "ttl_youtube_autocomplete_s", lambda m: [f"{m.code}:{lang}" for lang in m.languages],
        fetch_autocomplete,
    ),
    Source(
        "hacker_news", "Hacker News front page (Algolia)", HN_SEARCH, "ttl_hacker_news_s",
        lambda m: ["global"] if "en" in m.languages else [], fetch_hacker_news,
    ),
]  # fmt: skip
SOURCES_BY_ID = {source.id: source for source in SOURCES}
