"""UTC time helpers. `now()` is the only clock control reads, so tests can move it."""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta

_offset = timedelta(0)


def now() -> datetime:
    return datetime.now(UTC) + _offset


def travel(delta: timedelta) -> None:
    """Move the clock (tests only)."""
    global _offset
    _offset += delta


def reset_clock() -> None:
    global _offset
    _offset = timedelta(0)


def iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    return value.astimezone(UTC).isoformat().replace("+00:00", "Z")


def parse_dt(value: object) -> datetime | None:
    """Parse an ISO-8601 time (or date, or epoch seconds); naive values are taken as UTC."""
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        result = value
    elif isinstance(value, date):
        result = datetime(value.year, value.month, value.day)
    elif isinstance(value, int | float):
        result = datetime.fromtimestamp(value, UTC)
    else:
        text = str(value).strip()
        try:
            result = datetime.fromisoformat(text.replace("Z", "+00:00"))
        except ValueError:
            return None
    return result.replace(tzinfo=UTC) if result.tzinfo is None else result.astimezone(UTC)


def age_days(since: datetime | None, at: datetime | None = None) -> float | None:
    if since is None:
        return None
    return ((at or now()) - since).total_seconds() / 86400
