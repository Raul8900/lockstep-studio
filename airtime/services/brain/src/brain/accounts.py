"""The Claude account pool (plan addendum B and B2).

Accounts are the explicit `accounts` of claude.yaml plus every folder matching `discover` that
holds a login, found again at every status refresh. `claude auth status` (run with the account's
environment) says whether each is signed in; only loggedIn, subscriptionType and orgName are kept,
never the e-mail. A run or a lease takes a candidate (enabled, signed in, not cooling down), by
`least_used` (fewest tokens in the last 5 hours) or `ordered`.
"""

import asyncio
import glob
import json
import logging
import os
import tempfile
import time
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path

from . import limits
from .config import ClaudeConfig, load_claude
from .util import iso, new_id, parse_iso, utcnow

log = logging.getLogger("brain.accounts")

STRIP_PREFIXES = ("ANTHROPIC_", "CLAUDE_CODE_", "CLAUDE_AGENT_")
STRIP_NAMES = ("CLAUDECODE", "CLAUDE_CONFIG_DIR")
# What a lease tells engine-bridge to remove; a trailing * means every variable with that prefix.
UNSET_ENV = [
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_AUTH_TOKEN",
    "ANTHROPIC_BASE_URL",
    "CLAUDECODE",
    "CLAUDE_CONFIG_DIR",
    "ANTHROPIC_*",
    "CLAUDE_CODE_*",
    "CLAUDE_AGENT_*",
]


def default_dir() -> Path:
    return Path.home() / ".claude"


def child_env(config_dir: Path | None, base: dict | None = None) -> dict[str, str]:
    """The environment for a `claude` child: no API keys, nothing inherited from a parent Claude
    session; CLAUDE_CONFIG_DIR only for a non-default account."""
    base = dict(os.environ if base is None else base)
    env = {k: v for k, v in base.items() if not (k.startswith(STRIP_PREFIXES) or k in STRIP_NAMES)}
    if config_dir is not None and Path(config_dir) != default_dir():
        env["CLAUDE_CONFIG_DIR"] = str(config_dir)
    return env


class Unavailable(Exception):
    def __init__(self, retry_at: datetime | None, reason: str):
        super().__init__(reason)
        self.retry_at = retry_at
        self.reason = reason

    def error(self) -> dict:
        return {
            "code": "claude_unavailable",
            "message": f"no Claude account is available: {self.reason}",
            "details": {"retry_at": iso(self.retry_at), "reason": self.reason},
        }


@dataclass
class Account:
    id: str
    config_dir: str  # as configured, e.g. ~/.claude-third
    path: Path  # absolute
    enabled: bool = True
    discovered: bool = False
    logged_in: bool | None = None
    subscription_type: str | None = None
    org_name: str | None = None
    checked_at: float = 0.0  # time.monotonic() of the last status check
    cooling_down_until: datetime | None = None
    last_error: str | None = None
    last_used_at: datetime | None = None


def _display(path: Path) -> str:
    try:
        return "~/" + str(path.relative_to(Path.home()))
    except ValueError:
        return str(path)


def _has_login(path: Path) -> bool:
    if (path / ".credentials.json").exists() or (path / ".claude.json").exists():
        return True
    return path == default_dir() and (Path.home() / ".claude.json").exists()


def _expand(value: str) -> Path:
    return Path(os.path.normpath(os.path.expanduser(value)))


def discover_accounts(cfg: ClaudeConfig) -> list[Account]:
    """Explicit entries first (config order), then discovered folders by name."""
    accounts: list[Account] = []
    seen: set[Path] = set()
    for entry in cfg.accounts:
        path = _expand(str(entry["config_dir"]))
        accounts.append(
            Account(
                id=str(entry.get("id") or path.name),
                config_dir=str(entry["config_dir"]),
                path=path,
                enabled=bool(entry.get("enabled", True)),
            )
        )
        seen.add(path.resolve())
    ids = {a.id for a in accounts}
    found: list[Account] = []
    for pattern in cfg.discover:
        for match in glob.glob(os.path.expanduser(pattern)):
            path = _expand(match)
            if path.resolve() in seen or not path.is_dir() or not _has_login(path):
                continue
            seen.add(path.resolve())
            name = path.name
            base = "main" if name == ".claude" else name.removeprefix(".claude-").lstrip(".") or name
            acc_id, n = base, 2
            while acc_id in ids:
                acc_id, n = f"{base}-{n}", n + 1
            ids.add(acc_id)
            found.append(Account(id=acc_id, config_dir=_display(path), path=path, discovered=True))
    return accounts + sorted(found, key=lambda a: a.path.name)


async def auth_status(claude_bin: str, account: Account, timeout_s: float = 30) -> dict:
    """`claude auth status` with the account's environment. It prints JSON even when signed out
    (and then exits 1). Only three fields are kept: never the e-mail."""
    proc = await asyncio.create_subprocess_exec(
        claude_bin,
        "auth",
        "status",
        "--json",
        env=child_env(account.path),
        cwd=tempfile.gettempdir(),
        stdin=asyncio.subprocess.DEVNULL,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        out, _ = await asyncio.wait_for(proc.communicate(), timeout_s)
    except TimeoutError:
        proc.kill()
        await proc.wait()
        raise
    data = json.loads(out.decode("utf-8", "replace") or "{}")
    return {
        "logged_in": bool(data.get("loggedIn")),
        "subscription_type": data.get("subscriptionType"),
        "org_name": data.get("orgName"),
    }


class Pool:
    def __init__(self, settings, store, status_fn=None):
        self.settings = settings
        self.store = store
        self.fake = settings.airtime_fake
        self.cfg = load_claude(settings.airtime_config_dir)
        self.status_fn = status_fn or (lambda a: auth_status(settings.airtime_claude_bin, a))
        self.accounts: list[Account] = []
        self.leases: dict[str, dict] = {}
        self._saved = store.load_account_states()
        self._lock = asyncio.Lock()
        self._rescan()

    # --- discovery and status -----------------------------------------------------------------

    def _rescan(self) -> None:
        if self.fake:
            found = [Account("fake", "~/.claude-fake", Path.home() / ".claude-fake")]
        else:
            try:
                self.cfg = load_claude(self.settings.airtime_config_dir)
            except Exception as exc:  # keep the last good config
                log.warning("claude.yaml not reloaded: %s", exc)
            found = discover_accounts(self.cfg)
        old = {a.id: a for a in self.accounts}
        for a in found:
            prev = old.get(a.id)
            if prev is not None and prev.path == a.path:
                for f in ("logged_in", "subscription_type", "org_name", "checked_at",
                          "cooling_down_until", "last_error", "last_used_at"):
                    setattr(a, f, getattr(prev, f))
            elif a.id in self._saved:
                for f, v in self._saved[a.id].items():
                    setattr(a, f, v)
        self.accounts = found

    async def refresh(self, force: bool = False, account_id: str | None = None) -> None:
        """Discover again, then re-check every status older than status_ttl_s (or all, forced)."""
        async with self._lock:
            self._rescan()
            now = time.monotonic()
            todo = [
                a
                for a in self.accounts
                if (account_id is None or a.id == account_id)
                and (force or not a.checked_at or now - a.checked_at > self.cfg.status_ttl_s)
            ]
            await asyncio.gather(*(self._check(a) for a in todo))

    async def _check(self, a: Account) -> None:
        if self.fake:
            st = {"logged_in": True, "subscription_type": "max", "org_name": "Fake"}
        elif not a.path.is_dir():
            st = {"logged_in": False, "error": "folder not found"}
        else:
            try:
                st = await self.status_fn(a)
            except Exception as exc:
                st = {"logged_in": None, "error": f"status check failed: {type(exc).__name__}"}
        a.logged_in = st.get("logged_in")
        a.subscription_type = st.get("subscription_type")
        a.org_name = st.get("org_name")
        a.checked_at = time.monotonic()
        if a.logged_in is False:
            a.last_error = st.get("error") or "not signed in"
        elif a.logged_in and (a.last_error or "").startswith(("not signed in", "sign-in failed")):
            a.last_error = None
        elif st.get("error"):
            a.last_error = st["error"]

    def get(self, account_id: str) -> Account | None:
        return next((a for a in self.accounts if a.id == account_id), None)

    # --- choice -------------------------------------------------------------------------------

    def _used_5h(self, a: Account) -> int:
        t = self.store.account_tally(a.id, utcnow() - timedelta(hours=5))
        return t["input_tokens"] + t["output_tokens"]

    async def choose(self, exclude: set[str]) -> Account:
        await self.refresh()
        now = utcnow()
        order = {a.id: i for i, a in enumerate(self.accounts)}
        cands = [
            a
            for a in self.accounts
            if a.enabled
            and a.id not in exclude
            and a.logged_in is not False
            and not (a.cooling_down_until and a.cooling_down_until > now)
        ]
        if not cands:
            raise self._unavailable(now)
        if self.cfg.strategy == "least_used":
            cands.sort(key=lambda a: (a.logged_in is not True, self._used_5h(a), order[a.id]))
        else:
            cands.sort(key=lambda a: (a.logged_in is not True, order[a.id]))
        chosen = cands[0]
        chosen.last_used_at = now
        self._save(chosen)
        return chosen

    def _unavailable(self, now: datetime) -> Unavailable:
        cooling = [
            a.cooling_down_until
            for a in self.accounts
            if a.enabled and a.logged_in is not False
            and a.cooling_down_until and a.cooling_down_until > now
        ]
        if cooling:
            return Unavailable(min(cooling), "every signed-in account is cooling down")
        if any(a.enabled and a.logged_in is not False for a in self.accounts):
            return Unavailable(now + timedelta(minutes=5), "every account was tried for this run")
        retry = now + timedelta(seconds=self.cfg.status_ttl_s)
        return Unavailable(retry, "no enabled account is signed in")

    # --- outcomes -----------------------------------------------------------------------------

    def _save(self, a: Account) -> None:
        self.store.save_account_state(a.id, a.cooling_down_until, a.last_error, a.last_used_at)

    def mark_limited(self, a: Account, resets_at: datetime | None, message: str) -> None:
        now = utcnow()
        if resets_at is None or resets_at <= now or resets_at > now + timedelta(days=8):
            resets_at = now + timedelta(minutes=self.cfg.cooldown_default_min)
        a.cooling_down_until = resets_at
        a.last_error = f"usage limit: {message}"[:300]
        self._save(a)
        log.warning("account %s cooling down until %s", a.id, iso(resets_at))

    def mark_auth_failed(self, a: Account, message: str) -> None:
        a.logged_in = False  # until its next status check
        a.last_error = f"sign-in failed: {message}"[:300]
        self._save(a)
        log.warning("account %s failed to sign in", a.id)

    def mark_error(self, a: Account, message: str) -> None:
        a.last_error = message[:300]
        self._save(a)

    # --- leases (engine-bridge) ---------------------------------------------------------------

    async def lease(self, purpose: str, exclude: list[str]) -> dict:
        a = await self.choose(set(exclude))
        lease_id = new_id("lease")
        self.leases[lease_id] = {"account_id": a.id, "purpose": purpose, "at": iso(utcnow())}
        set_env = {} if a.path == default_dir() else {"CLAUDE_CONFIG_DIR": str(a.path)}
        return {
            "lease_id": lease_id,
            "account_id": a.id,
            "config_dir": str(a.path),
            "set_env": set_env,
            "unset_env": list(UNSET_ENV),
        }

    def release(self, lease_id: str, outcome: str, resets_at: str | None = None,
                message: str | None = None, usage: dict | None = None) -> dict:
        lease = self.leases.pop(lease_id, None)
        if lease is None:
            raise KeyError(lease_id)
        self.store.add_usage(lease["account_id"], usage, purpose=lease["purpose"])
        a = self.get(lease["account_id"])
        if a is not None:
            msg = (message or "").strip()
            if outcome == "rate_limited":
                when = parse_iso(resets_at) or (limits.parse_reset(msg) if msg else None)
                self.mark_limited(a, when, msg or "reported by " + lease["purpose"])
            elif outcome == "auth_failed":
                self.mark_auth_failed(a, msg or "reported by " + lease["purpose"])
            elif outcome == "error" and msg:
                self.mark_error(a, msg)
        return {"released": True, "lease_id": lease_id, "account_id": lease["account_id"]}

    # --- GET /v1/accounts ---------------------------------------------------------------------

    def describe(self) -> dict:
        now = utcnow()
        return {"strategy": self.cfg.strategy, "accounts": [self._describe(a, now) for a in self.accounts]}

    def _describe(self, a: Account, now: datetime) -> dict:
        cooling = a.cooling_down_until if a.cooling_down_until and a.cooling_down_until > now else None
        return {
            "id": a.id,
            "config_dir": a.config_dir,
            "enabled": a.enabled,
            "discovered": a.discovered,
            "logged_in": a.logged_in,
            "subscription_type": a.subscription_type,
            "org_name": a.org_name,
            "cooling_down_until": iso(cooling),
            "last_error": a.last_error,
            "last_used_at": iso(a.last_used_at),
            "usage_5h": self.store.account_tally(a.id, now - timedelta(hours=5)),
            "usage_7d": self.store.account_tally(a.id, now - timedelta(days=7)),
        }
