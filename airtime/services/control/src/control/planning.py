"""When to publish (the main market's prime time) and which topics are too close to recent ones."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from rapidfuzz import fuzz

UPLOAD_LEAD = timedelta(hours=1)  # a scheduled time is at least this far ahead (the upload needs time)
DUPLICATE_SCORE = 88  # rapidfuzz token_set_ratio at or above which two topics are the same story


def main_market(brief_markets: list[dict], markets: list[dict], preferred: str | None = None) -> dict | None:
    """The market to schedule for: the SEO role's choice if valid, else the brief's heaviest market."""
    by_code = {m["code"]: m for m in markets}
    if preferred in by_code:
        return by_code[preferred]
    for market in sorted(brief_markets or [], key=lambda m: -(m.get("weight") or 0)):
        if market.get("code") in by_code:
            return by_code[market["code"]]
    return max(markets, key=lambda m: m["weight"]) if markets else None


def next_prime_time(market: dict, after: datetime, lead: timedelta = UPLOAD_LEAD) -> datetime:
    """The next prime time in the market's own time zone, at least `lead` after `after` (UTC)."""
    tz = ZoneInfo(market["tz"])
    hour, minute = (int(x) for x in market["prime_time"].split(":"))
    earliest = (after + lead).astimezone(tz)
    candidate = earliest.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if candidate < earliest:
        candidate += timedelta(days=1)  # same wall-clock time the next day, DST included
    return candidate.astimezone(UTC)


def schedule_time(strategy: str, market: dict | None, after: datetime) -> datetime | None:
    """None means publish at once."""
    if strategy != "market_prime_time" or market is None:
        return None
    return next_prime_time(market, after)


def duplicate_of(topic: str, others: list[str]) -> str | None:
    """The first of `others` that is the same story as `topic`, if any."""
    for other in others:
        if other and fuzz.token_set_ratio(topic.lower(), other.lower()) >= DUPLICATE_SCORE:
            return other
    return None
