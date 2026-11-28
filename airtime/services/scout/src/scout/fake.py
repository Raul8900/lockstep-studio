"""Fake mode (AIRTIME_FAKE=1): no network. Requests to the free sources are answered from
recordings of their real answers for all ten markets (src/scout/recordings, re-recorded with
scripts/record.py), so the real parsers run; the youtube service's search is answered by a
deterministic generator. The tests use the same transport."""

import base64
import hashlib
import json
import random
from functools import cache
from pathlib import Path

import httpx

RECORDINGS = Path(__file__).parent / "recordings"

_TITLES = [
    "{q} explained", "How {q} actually works", "The truth about {q}", "{q} in 60 seconds",
    "Why {q} matters", "{q}: what nobody tells you", "I tried {q} for a week",
    "{q}, the full story", "{q} (animated)", "What is {q}?", "{q} #shorts", "Is {q} worth it?",
]  # fmt: skip
_CHANNELS = [
    "Explained Daily", "The Curious Lab", "Minute Mechanics", "Data Desk", "Global Brief",
    "Tech Unboxed", "History Bits", "Science Shorts", "Plain Numbers", "Field Notes",
]  # fmt: skip
_SUFFIXES = ["explained", "how it works", "kya hai", "documentary", "shorts", "news", "facts"]


@cache
def _autocomplete() -> dict[str, str]:
    return json.loads((RECORDINGS / "autocomplete.json").read_text(encoding="utf-8"))


def _recording(name: str, content_type: str) -> httpx.Response:
    path = RECORDINGS / name
    if not path.is_file():
        return httpx.Response(404, text=f"fake mode: no recording {name}")
    return httpx.Response(200, content=path.read_bytes(), headers={"Content-Type": content_type})


def fake_search(body: dict) -> dict:
    """Twenty plausible results for a query, the same every time for the same query and market."""
    query = str(body.get("query", "")).strip() or "topic"
    rng = random.Random(hashlib.sha256(f"{query}|{body.get('market')}".encode()).digest())
    results = []
    for title in rng.sample(_TITLES, 12) + rng.choices(_TITLES, k=8):
        is_short = "#shorts" in title or rng.random() < 0.45
        results.append(
            {
                "video_id": base64.urlsafe_b64encode(rng.randbytes(9)).decode()[:11],
                "title": title.format(q=query[:1].upper() + query[1:]),
                "channel": rng.choice(_CHANNELS),
                "views": int(rng.lognormvariate(10.5, 1.7)),
                "age_days": round(rng.uniform(0.5, 900), 1),
                "duration_s": rng.randint(15, 59) if is_short else rng.randint(120, 1500),
                "is_short": is_short,
            }
        )
    return {"results": results}


def fake_transport() -> httpx.MockTransport:
    def handler(request: httpx.Request) -> httpx.Response:
        url = request.url
        if request.method == "POST" and url.path.rstrip("/").endswith("/v1/search"):
            return httpx.Response(200, json=fake_search(json.loads(request.content or b"{}")))
        if url.host == "trends.google.com":
            return _recording(f"trends_{url.params.get('geo', '')}.xml", "text/xml; charset=utf-8")
        if url.host == "wikimedia.org":
            parts = url.path.split("/")
            if "top-per-country" in parts:
                country = parts[parts.index("top-per-country") + 1]
                return _recording(f"wikimedia_country_{country}.json", "application/json")
            if "top" in parts:
                language = parts[parts.index("top") + 1].split(".")[0]
                return _recording(f"wikimedia_language_{language}.json", "application/json")
        if url.host == "suggestqueries.google.com":
            q, gl, hl = (url.params.get(name, "") for name in ("q", "gl", "hl"))
            recorded = _autocomplete().get(f"{gl}|{hl}|{q}")
            text = recorded or json.dumps(
                [q, [f"{q} {suffix}" for suffix in _SUFFIXES]], ensure_ascii=False
            )
            return httpx.Response(
                200, text=text, headers={"Content-Type": "text/javascript; charset=UTF-8"}
            )
        if url.host == "hn.algolia.com":
            return _recording("hacker_news.json", "application/json")
        return httpx.Response(404, text="fake mode: nothing recorded for this request")

    return httpx.MockTransport(handler)
