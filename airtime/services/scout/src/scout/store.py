"""scout's SQLite cache ($AIRTIME_DATA_DIR/scout/cache.db): the last good answer per source and
key, the health of every key, and when each signal title was first seen."""

import json
import sqlite3
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path

from scout.timeutil import from_iso, to_iso

SCHEMA = """
CREATE TABLE IF NOT EXISTS cache (
    source TEXT NOT NULL, key TEXT NOT NULL, fetched_at TEXT NOT NULL, data_date TEXT,
    payload TEXT NOT NULL, PRIMARY KEY (source, key));
CREATE TABLE IF NOT EXISTS health (
    source TEXT NOT NULL, key TEXT NOT NULL, attempted_at TEXT NOT NULL, ok INTEGER NOT NULL,
    last_success_at TEXT, consecutive_failures INTEGER NOT NULL, item_count INTEGER,
    latency_ms INTEGER, error_code TEXT, error TEXT, PRIMARY KEY (source, key));
CREATE TABLE IF NOT EXISTS seen (
    source TEXT NOT NULL, key TEXT NOT NULL, title TEXT NOT NULL, first_seen TEXT NOT NULL,
    last_seen TEXT NOT NULL, PRIMARY KEY (source, key, title));
"""


@dataclass
class Entry:
    fetched_at: datetime
    data_date: date | None
    payload: object

    def age_s(self, now: datetime) -> float:
        return (now - self.fetched_at).total_seconds()


@dataclass
class Health:
    source: str
    key: str
    attempted_at: datetime
    ok: bool
    last_success_at: datetime | None
    consecutive_failures: int
    item_count: int | None
    latency_ms: int | None
    error_code: str | None
    error: str | None


class Store:
    def __init__(self, path: Path):
        path.parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(path, check_same_thread=False)
        self.db.row_factory = sqlite3.Row
        self.db.execute("PRAGMA journal_mode=WAL")
        self.db.execute("PRAGMA busy_timeout=5000")
        self.db.executescript(SCHEMA)

    def close(self) -> None:
        self.db.close()

    def ping(self) -> None:
        self.db.execute("SELECT 1").fetchone()

    def get(self, source: str, key: str) -> Entry | None:
        row = self.db.execute(
            "SELECT fetched_at, data_date, payload FROM cache WHERE source = ? AND key = ?",
            (source, key),
        ).fetchone()
        if row is None:
            return None
        data_date = date.fromisoformat(row["data_date"]) if row["data_date"] else None
        return Entry(from_iso(row["fetched_at"]), data_date, json.loads(row["payload"]))

    def put(
        self,
        source: str,
        key: str,
        fetched_at: datetime,
        payload: object,
        data_date: date | None = None,
    ) -> None:
        with self.db:
            self.db.execute(
                "INSERT OR REPLACE INTO cache VALUES (?, ?, ?, ?, ?)",
                (source, key, to_iso(fetched_at), data_date.isoformat() if data_date else None,
                 json.dumps(payload, ensure_ascii=False)),
            )  # fmt: skip

    def record(
        self,
        source: str,
        key: str,
        at: datetime,
        *,
        ok: bool,
        item_count: int | None = None,
        latency_ms: int | None = None,
        error_code: str | None = None,
        error: str | None = None,
    ) -> None:
        """One attempt to read a source for a key, successful or not."""
        with self.db:
            self.db.execute(
                """INSERT INTO health VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (source, key) DO UPDATE SET
                    attempted_at = excluded.attempted_at, ok = excluded.ok,
                    last_success_at = COALESCE(excluded.last_success_at, health.last_success_at),
                    consecutive_failures = CASE WHEN excluded.ok THEN 0
                                           ELSE health.consecutive_failures + 1 END,
                    item_count = excluded.item_count, latency_ms = excluded.latency_ms,
                    error_code = excluded.error_code, error = excluded.error""",
                (source, key, to_iso(at), int(ok), to_iso(at) if ok else None, 0 if ok else 1,
                 item_count, latency_ms, error_code, error),
            )  # fmt: skip

    def health(self, source: str | None = None, key: str | None = None) -> list[Health]:
        sql, args = "SELECT * FROM health", []
        if source is not None:
            sql, args = sql + " WHERE source = ?", [source]
            if key is not None:
                sql, args = sql + " AND key = ?", [source, key]
        rows = self.db.execute(sql + " ORDER BY source, key", args).fetchall()
        return [
            Health(
                source=row["source"],
                key=row["key"],
                attempted_at=from_iso(row["attempted_at"]),
                ok=bool(row["ok"]),
                last_success_at=from_iso(row["last_success_at"])
                if row["last_success_at"]
                else None,
                consecutive_failures=row["consecutive_failures"],
                item_count=row["item_count"],
                latency_ms=row["latency_ms"],
                error_code=row["error_code"],
                error=row["error"],
            )
            for row in rows
        ]

    def first_seen(
        self, source: str, key: str, titles: list[tuple[str, datetime]], now: datetime
    ) -> dict[str, datetime]:
        """Remember each title; return when it was first seen (the earliest of scout's first
        sighting and the date the source itself gives)."""
        with self.db:
            self.db.executemany(
                """INSERT INTO seen VALUES (?, ?, ?, ?, ?)
                ON CONFLICT (source, key, title) DO UPDATE SET last_seen = excluded.last_seen,
                    first_seen = MIN(seen.first_seen, excluded.first_seen)""",
                [(source, key, title, to_iso(min(at, now)), to_iso(now)) for title, at in titles],
            )
        rows = self.db.execute(
            "SELECT title, first_seen FROM seen WHERE source = ? AND key = ?", (source, key)
        ).fetchall()
        return {row["title"]: from_iso(row["first_seen"]) for row in rows}

    def prune(self, before: datetime) -> None:
        """Forget titles not seen, and cached answers not refreshed, since `before`."""
        with self.db:
            self.db.execute("DELETE FROM seen WHERE last_seen < ?", (to_iso(before),))
            self.db.execute("DELETE FROM cache WHERE fetched_at < ?", (to_iso(before),))
