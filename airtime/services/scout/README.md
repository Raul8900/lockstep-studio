# scout

Airtime's trend scout (unit 5). It collects free trend signals per market and probes YouTube
demand and competition for candidate topics. API: contract G in
[`airtime/contracts/scout.schema.json`](../../contracts/scout.schema.json). It needs no keys and
pays for nothing.

## Sources

| Source id | What | Endpoint | Key | TTL |
|---|---|---|---|---|
| `google_trends` | Trending searches per country (~10, ranked by approximate traffic; `url` is the top news story) | `https://trends.google.com/trending/rss?geo=US` | country | 1 h |
| `wikimedia_country` | Most-viewed Wikipedia articles per country (views are Wikimedia's rounded-up ceilings) | `wikimedia.org/api/rest_v1/metrics/pageviews/top-per-country/{CC}/all-access/{yyyy/mm/dd}` | country | 6 h |
| `wikimedia_language` | Most-viewed articles of each market language's Wikipedia (en, hi, de, fr, pt, es, ja) | `…/pageviews/top/{lang}.wikipedia/all-access/{yyyy/mm/dd}` | language | 6 h |
| `youtube_autocomplete` | What YouTube's search box completes for explainer seeds ("how does", "कैसे काम करता है", "仕組み 解説" …) per `gl`/`hl` | `suggestqueries.google.com/complete/search?client=firefox&ds=yt` | market:language | 3 h |
| `hacker_news` | Front page, ranked by points; in the packs of English-speaking markets | `hn.algolia.com/api/v1/search?tags=front_page` | global | 30 min |

Wikipedia lists are articles only (main pages, searches and other namespaces are dropped), from
the newest published day (yesterday UTC, or up to `SCOUT_WIKIMEDIA_MAX_LAG_DAYS` back).
`first_seen` is the earliest of the date the source gives (trend start, story time, data day) and
the first time scout saw the title. Requests carry the User-Agent
`Airtime/0.1 (self-hosted trend research)` and nothing that identifies the owner. Each host gets
one request at a time with a minimum gap (Trends 1 s, Wikimedia 0.2 s, autocomplete 0.5 s,
HN 1 s), and timeouts, 429 and 5xx are retried with backoff (`Retry-After` honoured, at most 30 s).

## API (127.0.0.1:`$SCOUT_PORT`, default 8002)

- `GET /v1/signals?markets=US,IN&max_age_h=24` → `{packs:[{market, collected_at, items, errors, sources}]}`.
  Without `markets`, every enabled market in `markets.yaml`. A source's cached answer is used
  while it is younger than both its TTL and `max_age_h`; otherwise it is fetched again, and if
  that fails the older answer is served (`sources[].state: stale`, with the reason in `errors`)
  as long as it is within `max_age_h`. `collected_at` is the time of the oldest data in the pack.
  A key is never fetched more often than every `SCOUT_MIN_REFETCH_S` (also after a failure).
  Unknown market → 400 `unknown_market`.
- `POST /v1/probe {queries:[{query, market, language?}], max_results?}` → `{probes:[…]}`. For each
  query: YouTube autocomplete suggestions for the query (`gl`=market, `hl`=language, default the
  market's first language) and the youtube service's `POST /v1/search` (`YOUTUBE_URL`). `stats` are
  the youtube service's where it reports them; the rest are computed from its results:
  `result_count`, `median_views`, `recent_breakouts` (uploaded within 30 days with ≥ 50,000
  views) and `shorts_share` (among results whose kind is known). Queries run one at a time. If
  the youtube service is down, the probe still carries the suggestions, `missing: ["results",
  "stats"]` and the reason in `errors` (stats are then null and `result_count` is left out), and
  the remaining queries of that request do not wait for it again. Suggestions are cached 6 h,
  search answers 12 h.
- `GET /v1/sources` → each source's status (`ok`, `degraded`, `down`, `unknown`), last attempt,
  last success, last error and per-key detail (keys starting `probe:` are probe suggestions).
- `GET /healthz`; `GET /readyz` (markets.yaml readable, cache database answering).
- Errors: `{"error": {"code", "message", "details"}}`.

## Command line

```sh
uv run scout collect --markets US,IN            # a table: market, source, key, state, items
uv run scout collect --markets US --json        # the SignalsResponse
uv run scout collect --max-age-h 0              # refetch everything (within the refetch floor)
uv run scout serve                              # the API
```

`collect` exits 1 when a source gave nothing for some key, 2 for an unknown market.

## Configuration

| Variable | Default | |
|---|---|---|
| `AIRTIME_DATA_DIR` | `~/.local/share/airtime` | the cache is `scout/cache.db` under it (SQLite) |
| `AIRTIME_CONFIG_DIR` | `/config` | `markets.yaml` is read from here (in the repo: `airtime/config`) |
| `AIRTIME_FAKE` | `0` | `1`: no network (see below) |
| `YOUTUBE_URL` | `http://127.0.0.1:8003` | the youtube service, for probes |
| `SCOUT_HOST` / `AIRTIME_HOST` | `127.0.0.1` | bind address |
| `SCOUT_PORT` | `8002` | |
| `SCOUT_USER_AGENT` | `Airtime/0.1 (self-hosted trend research)` | never put a name, e-mail or repository here |
| `SCOUT_HTTP_TIMEOUT_S`, `SCOUT_HTTP_RETRIES` | `15`, `2` | per request to a free source |
| `SCOUT_DEFAULT_MAX_AGE_H` | `24` | `max_age_h` when the caller gives none |
| `SCOUT_ITEMS_PER_SOURCE` | `20` | items kept per source and key |
| `SCOUT_MIN_REFETCH_S` | `300` | the politeness floor per key |
| `SCOUT_TTL_GOOGLE_TRENDS_S`, `…_WIKIMEDIA_S`, `…_YOUTUBE_AUTOCOMPLETE_S`, `…_HACKER_NEWS_S` | `3600`, `21600`, `10800`, `1800` | signal cache lifetimes |
| `SCOUT_TTL_SUGGESTIONS_S`, `SCOUT_TTL_YOUTUBE_SEARCH_S` | `21600`, `43200` | probe cache lifetimes |
| `SCOUT_WIKIMEDIA_MAX_LAG_DAYS` | `3` | how far back to look for a published Wikimedia day |
| `SCOUT_AUTOCOMPLETE_SEEDS` | built in | JSON per language, e.g. `{"en": ["how does", "why do"]}` |
| `SCOUT_YOUTUBE_TIMEOUT_S` | `90` | per search |
| `SCOUT_BREAKOUT_MAX_AGE_DAYS`, `SCOUT_BREAKOUT_MIN_VIEWS` | `30`, `50000` | what counts as a recent breakout |
| `SCOUT_RETENTION_DAYS` | `30` | cached answers and first-seen titles older than this are forgotten |

## Fake mode and recordings

With `AIRTIME_FAKE=1` scout makes no network request: the free sources are answered from
`src/scout/recordings/` (real answers for all ten markets, trimmed), so the real parsers run, and
the youtube search is answered by a deterministic generator (20 plausible results per query). The
tests replay the same recordings. To refresh them from the live sources:

```sh
uv run python scripts/record.py --config ../../config/markets.yaml
```

## Development

```sh
uv sync
uv run pytest
uv run ruff check . && uv run ruff format --check .
AIRTIME_CONFIG_DIR=../../config AIRTIME_DATA_DIR=/tmp/airtime-dev uv run scout serve
```

The image (`Dockerfile`: `python:3.12-slim-bookworm` + uv, uid/gid from the `AIRTIME_UID` and
`AIRTIME_GID` build args, a `HEALTHCHECK` on `/healthz`) runs `scout serve`; compose runs it with
`network_mode: host` and binds 127.0.0.1 only.
