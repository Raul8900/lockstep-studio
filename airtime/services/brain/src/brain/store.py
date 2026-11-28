"""SQLite under $AIRTIME_DATA_DIR/brain: runs (and the result cache), the usage ledger, and the
accounts' cooldowns. Never an e-mail address."""

import json
import sqlite3
import threading
from datetime import datetime
from pathlib import Path

from .util import iso, parse_iso, utcnow

_SCHEMA = """
CREATE TABLE IF NOT EXISTS runs (
  run_id TEXT PRIMARY KEY, role TEXT NOT NULL, state TEXT NOT NULL, input_hash TEXT,
  created_at TEXT NOT NULL, finished_at TEXT, data TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS runs_role ON runs(role, created_at);
CREATE INDEX IF NOT EXISTS runs_hash ON runs(input_hash, state);
CREATE TABLE IF NOT EXISTS usage (
  id INTEGER PRIMARY KEY, at TEXT NOT NULL, account_id TEXT, run_id TEXT, role TEXT, purpose TEXT,
  input_tokens INTEGER DEFAULT 0, output_tokens INTEGER DEFAULT 0,
  cache_read_input_tokens INTEGER DEFAULT 0, cache_creation_input_tokens INTEGER DEFAULT 0);
CREATE INDEX IF NOT EXISTS usage_at ON usage(at);
CREATE TABLE IF NOT EXISTS account_state (
  account_id TEXT PRIMARY KEY, cooling_down_until TEXT, last_error TEXT, last_used_at TEXT);
"""

USAGE_KEYS = (
    "input_tokens",
    "output_tokens",
    "cache_read_input_tokens",
    "cache_creation_input_tokens",
)


class Store:
    def __init__(self, path: Path):
        path.parent.mkdir(parents=True, exist_ok=True)
        self._db = sqlite3.connect(path, check_same_thread=False, isolation_level=None)
        self._db.row_factory = sqlite3.Row
        self._lock = threading.Lock()
        with self._lock:
            self._db.execute("PRAGMA journal_mode=WAL")
            self._db.executescript(_SCHEMA)

    def _q(self, sql: str, args=()) -> list[sqlite3.Row]:
        with self._lock:
            return self._db.execute(sql, args).fetchall()

    # --- runs ---------------------------------------------------------------------------------

    def save_run(self, run: dict, input_hash: str | None = None) -> None:
        self._q(
            "INSERT INTO runs(run_id, role, state, input_hash, created_at, finished_at, data)"
            " VALUES(?,?,?,?,?,?,?) ON CONFLICT(run_id) DO UPDATE SET state=excluded.state,"
            " finished_at=excluded.finished_at, data=excluded.data,"
            " input_hash=COALESCE(excluded.input_hash, runs.input_hash)",
            (
                run["run_id"],
                run["role"],
                run["state"],
                input_hash,
                run["created_at"],
                run.get("finished_at"),
                json.dumps(run, ensure_ascii=False),
            ),
        )

    def get_run(self, run_id: str) -> dict | None:
        rows = self._q("SELECT data FROM runs WHERE run_id=?", (run_id,))
        return json.loads(rows[0]["data"]) if rows else None

    def list_runs(self, role: str | None, limit: int) -> list[dict]:
        if role:
            rows = self._q(
                "SELECT data FROM runs WHERE role=? ORDER BY created_at DESC, run_id DESC LIMIT ?",
                (role, limit),
            )
        else:
            rows = self._q(
                "SELECT data FROM runs ORDER BY created_at DESC, run_id DESC LIMIT ?", (limit,)
            )
        return [json.loads(r["data"]) for r in rows]

    def cached_run(self, input_hash: str, not_before: datetime) -> dict | None:
        rows = self._q(
            "SELECT data FROM runs WHERE input_hash=? AND state='succeeded' AND finished_at>=?"
            " ORDER BY finished_at DESC LIMIT 1",
            (input_hash, iso(not_before)),
        )
        return json.loads(rows[0]["data"]) if rows else None

    def fail_interrupted(self) -> int:
        """Runs left queued or running by a previous process can never finish."""
        rows = self._q("SELECT data FROM runs WHERE state IN ('queued','running')")
        for row in rows:
            run = json.loads(row["data"])
            run.update(
                state="failed",
                finished_at=iso(utcnow()),
                error={"code": "interrupted", "message": "brain restarted during the run"},
            )
            self.save_run(run)
        return len(rows)

    # --- usage ledger -------------------------------------------------------------------------

    def add_usage(self, account_id, usage: dict | None, run_id=None, role=None, purpose=None):
        usage = usage or {}
        self._q(
            "INSERT INTO usage(at, account_id, run_id, role, purpose, input_tokens, output_tokens,"
            " cache_read_input_tokens, cache_creation_input_tokens) VALUES(?,?,?,?,?,?,?,?,?)",
            (iso(utcnow()), account_id, run_id, role, purpose)
            + tuple(int(usage.get(k) or 0) for k in USAGE_KEYS),
        )

    def account_tally(self, account_id: str, since: datetime) -> dict:
        """input_tokens counts every input token processed: fresh, cache writes and cache reads."""
        row = self._q(
            "SELECT COALESCE(SUM(input_tokens + cache_read_input_tokens"
            " + cache_creation_input_tokens),0) AS i, COALESCE(SUM(output_tokens),0) AS o,"
            " COUNT(*) AS n FROM usage WHERE account_id=? AND at>=?",
            (account_id, iso(since)),
        )[0]
        return {"input_tokens": row["i"], "output_tokens": row["o"], "runs": row["n"]}

    def usage_summary(self, since: datetime | None) -> dict:
        cols = ", ".join(f"COALESCE(SUM({k}),0) AS {k}" for k in USAGE_KEYS)
        where, args = ("WHERE at>=?", (iso(since),)) if since else ("", ())
        total = dict(self._q(f"SELECT {cols}, COUNT(*) AS runs FROM usage {where}", args)[0])
        out = {"since": iso(since), "total": total, "by_account": {}, "by_role": {}}
        for key, col in (("by_account", "account_id"), ("by_role", "role")):
            for row in self._q(
                f"SELECT {col} AS k, {cols}, COUNT(*) AS runs FROM usage {where} GROUP BY {col}",
                args,
            ):
                item = dict(row)
                out[key][item.pop("k") or "-"] = item
        return out

    # --- account state ------------------------------------------------------------------------

    def load_account_states(self) -> dict[str, dict]:
        out = {}
        for row in self._q("SELECT * FROM account_state"):
            out[row["account_id"]] = {
                "cooling_down_until": parse_iso(row["cooling_down_until"]),
                "last_error": row["last_error"],
                "last_used_at": parse_iso(row["last_used_at"]),
            }
        return out

    def save_account_state(self, account_id, cooling_down_until, last_error, last_used_at):
        self._q(
            "INSERT INTO account_state(account_id, cooling_down_until, last_error, last_used_at)"
            " VALUES(?,?,?,?) ON CONFLICT(account_id) DO UPDATE SET"
            " cooling_down_until=excluded.cooling_down_until, last_error=excluded.last_error,"
            " last_used_at=excluded.last_used_at",
            (account_id, iso(cooling_down_until), last_error, iso(last_used_at)),
        )
