"""Re-record the answers fake mode and the tests replay (src/scout/recordings) from the live free
sources, for every market in markets.yaml. Answers are trimmed to what scout reads.

    uv run python scripts/record.py --config ../../config/markets.yaml
"""

import argparse
import asyncio
import json
import re
from collections.abc import Callable
from datetime import date, timedelta
from pathlib import Path

from scout.fake import RECORDINGS
from scout.http import FetchError, Http
from scout.markets import load_markets
from scout.settings import Settings
from scout.sources import AUTOCOMPLETE, HN_SEARCH, TRENDS_RSS, WIKIMEDIA
from scout.timeutil import utcnow

KEEP_ARTICLES = 40


def trim_trends(xml: str) -> str:
    """The first news item of each trend; no pictures."""
    xml = re.sub(
        r"(</ht:news_item>)(?:\s*<ht:news_item>.*?</ht:news_item>)+", r"\1", xml, flags=re.S
    )
    return re.sub(
        r"\s*<ht:(news_item_)?picture(_source)?>[^<]*</ht:(news_item_)?picture(_source)?>", "", xml
    )


async def wikimedia(http: Http, path_for: Callable[[date], str]) -> dict:
    yesterday = utcnow().date() - timedelta(days=1)
    for lag in range(3):
        try:
            response = await http.get(
                f"{WIKIMEDIA}/{path_for(yesterday - timedelta(days=lag))}", min_interval_s=0.2
            )
        except FetchError as exc:
            if exc.code == "not_found":
                continue
            raise
        data = response.json()
        data["items"][0]["articles"] = data["items"][0]["articles"][:KEEP_ARTICLES]
        return data
    raise SystemExit("no Wikimedia data for the last 3 days")


def write(name: str, text: str) -> None:
    (RECORDINGS / name).write_text(text, encoding="utf-8")


async def record(config: Path) -> None:
    settings = Settings()
    markets = load_markets(config)
    http = Http(settings)
    RECORDINGS.mkdir(exist_ok=True)
    try:
        for m in markets.values():
            response = await http.get(TRENDS_RSS, params={"geo": m.code}, min_interval_s=1.0)
            write(f"trends_{m.code}.xml", trim_trends(response.text))
        try:
            for m in markets.values():
                data = await wikimedia(
                    http, lambda day, c=m.code: f"top-per-country/{c}/all-access/{day:%Y/%m/%d}"
                )
                write(f"wikimedia_country_{m.code}.json", json.dumps(data, ensure_ascii=False))
            for language in sorted({lang for m in markets.values() for lang in m.languages}):
                data = await wikimedia(
                    http,
                    lambda day, lang=language: f"top/{lang}.wikipedia/all-access/{day:%Y/%m/%d}",
                )
                write(f"wikimedia_language_{language}.json", json.dumps(data, ensure_ascii=False))
        except FetchError as exc:  # usually 403: no contact information in SCOUT_USER_AGENT
            print(f"Wikimedia not recorded ({exc.code}: {exc.message}); kept the old recordings")
        autocomplete = {}
        for m in markets.values():
            for language in m.languages:
                for seed in settings.seeds_for(language):
                    params = {
                        "client": "firefox",
                        "ds": "yt",
                        "hl": language,
                        "gl": m.code,
                        "q": seed,
                    }
                    response = await http.get(AUTOCOMPLETE, params=params, min_interval_s=0.5)
                    autocomplete[f"{m.code}|{language}|{seed}"] = response.text
        write("autocomplete.json", json.dumps(autocomplete, ensure_ascii=False, indent=0))
        response = await http.get(HN_SEARCH, params={"tags": "front_page", "hitsPerPage": 30})
        keep = ("title", "url", "points", "num_comments", "created_at", "objectID")
        hits = [{field: hit.get(field) for field in keep} for hit in response.json()["hits"]]
        write("hacker_news.json", json.dumps({"hits": hits}, ensure_ascii=False))
    finally:
        await http.aclose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--config", type=Path, default=Path(__file__).parents[3] / "config" / "markets.yaml"
    )
    asyncio.run(record(parser.parse_args().config))
