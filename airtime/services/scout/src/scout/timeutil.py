"""UTC time helpers. Every time scout stores or returns is UTC, ISO-8601, whole seconds, with Z."""

from datetime import UTC, datetime


def utcnow() -> datetime:
    return datetime.now(UTC).replace(microsecond=0)


def to_iso(dt: datetime) -> str:
    return dt.astimezone(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def from_iso(text: str) -> datetime:
    dt = datetime.fromisoformat(text.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)
