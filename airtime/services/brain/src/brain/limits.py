"""Recognise usage-limit and sign-in failures in Claude Code output, and parse reset times.

Examples it understands:
    You've hit your 5-hour limit · resets 3:40am (Asia/Kolkata)
    You've hit your weekly limit · resets Dec 2, 5pm (Asia/Kolkata)
    Claude AI usage limit reached|1764369600
    API Error: 429 {"type":"error","error":{"type":"rate_limit_error",...}}
    Please run /login · OAuth token has expired · Invalid API key · 401
"""

import re
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

_EPOCH = re.compile(r"usage limit reached\|(\d{10,13})", re.I)
_LIMIT = re.compile(
    r"usage limit|rate[ _-]?limit|limit reached|hit your [\w -]*limit|too many requests"
    r"|(?:error|status|code)\W{0,3}429\b|\b429 too many|limit will reset",
    re.I,
)
_AUTH = re.compile(
    r"please run /login|invalid api key|oauth token has expired|token (?:has )?expired"
    r"|authentication_error|not logged in|(?:error|status|code)\W{0,3}401\b|invalid bearer token",
    re.I,
)
_RESET = re.compile(r"\breset(?:s)?\b(?:\s+at)?\s+(?P<rest>[^\n|]{0,80})", re.I)
_TIME = re.compile(r"\b(?P<h>\d{1,2})(?::(?P<m>\d{2}))?\s*(?P<ap>[ap])\.?\s?m\b\.?|\b(?P<H>\d{1,2}):(?P<M>\d{2})\b", re.I)
_TZ = re.compile(r"\((?P<tz>UTC|GMT|[A-Za-z_]+(?:/[A-Za-z0-9_+\-]+)+)\)")
_MONTHS = "jan feb mar apr may jun jul aug sep oct nov dec".split()
_MONTH_DAY = re.compile(r"\b(?P<mon>jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(?P<day>\d{1,2})\b", re.I)
_WEEKDAYS = "mon tue wed thu fri sat sun".split()
_WEEKDAY = re.compile(r"\b(?P<wd>mon|tue|wed|thu|fri|sat|sun)[a-z]*\b", re.I)


@dataclass
class Failure:
    kind: str  # "rate_limited" | "auth_failed"
    message: str
    resets_at: datetime | None = None


def _excerpt(text: str, match: re.Match) -> str:
    start = text.rfind("\n", 0, match.start()) + 1
    end = text.find("\n", match.end())
    return text[start : end if end != -1 else None].strip()[:300]


def classify(text: str, now: datetime | None = None) -> Failure | None:
    """Look at the text of a FAILED run (result, assistant text, stderr) for a limit or sign-in
    problem. Only call it for runs that did not succeed: a topic about rate limits is not one."""
    if not text:
        return None
    now = now or datetime.now(UTC)
    m = _EPOCH.search(text)
    if m:
        value = int(m.group(1))
        when = datetime.fromtimestamp(value / 1000 if value > 1e12 else value, UTC)
        return Failure("rate_limited", _excerpt(text, m), when)
    m = _LIMIT.search(text)
    if m:
        return Failure("rate_limited", _excerpt(text, m), parse_reset(text, now))
    m = _AUTH.search(text)
    if m:
        return Failure("auth_failed", _excerpt(text, m))
    return None


def parse_reset(text: str, now: datetime | None = None, local_tz=None) -> datetime | None:
    """The next moment matching "resets 3:40am (Asia/Kolkata)", "resets Dec 2, 5pm", "resets Mon
    9am" or "resets 15:40". None when nothing parses."""
    now = now or datetime.now(UTC)
    m = _RESET.search(text)
    if not m:
        return None
    rest = m.group("rest")
    t = _TIME.search(rest)
    if not t:
        return None
    if t.group("h"):
        hour, minute = int(t.group("h")) % 12, int(t.group("m") or 0)
        if t.group("ap").lower() == "p":
            hour += 12
    else:
        hour, minute = int(t.group("H")), int(t.group("M"))
    if hour > 23 or minute > 59:
        return None
    tz = local_tz or datetime.now().astimezone().tzinfo
    z = _TZ.search(rest)
    if z:
        try:
            tz = ZoneInfo("UTC" if z.group("tz") in ("UTC", "GMT") else z.group("tz"))
        except (ZoneInfoNotFoundError, ValueError):
            pass
    local_now = now.astimezone(tz)
    md = _MONTH_DAY.search(rest)
    wd = _WEEKDAY.search(rest)
    if md:
        month = _MONTHS.index(md.group("mon").lower()[:3]) + 1
        day = int(md.group("day"))
        try:
            when = local_now.replace(month=month, day=day, hour=hour, minute=minute, second=0, microsecond=0)
            if when <= local_now - timedelta(days=1):
                when = when.replace(year=when.year + 1)
        except ValueError:
            return None
    else:
        when = local_now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if wd:
            ahead = (_WEEKDAYS.index(wd.group("wd").lower()[:3]) - local_now.weekday()) % 7
            when += timedelta(days=ahead)
        if when <= local_now:
            when += timedelta(days=7 if wd else 1)
    return when.astimezone(UTC)
