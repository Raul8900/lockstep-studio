"""roles.yaml, claude.yaml, markets.yaml and rubric.yaml, read from AIRTIME_CONFIG_DIR."""

from dataclasses import dataclass, field
from pathlib import Path

import yaml

ROLE_NAMES = (
    "ideator",
    "strategist",
    "brief_writer",
    "critic",
    "seo",
    "translator",
    "analyst",
    "learner",
)


def _read(path: Path) -> dict:
    if not path.exists():
        return {}
    with path.open() as f:
        return yaml.safe_load(f) or {}


@dataclass(frozen=True)
class RoleConfig:
    name: str
    tools: tuple[str, ...]
    model: str
    effort: str
    max_turns: int
    timeout_s: int


def load_roles(config_dir: Path, model: str | None = None, effort: str | None = None):
    """Per-role settings. A role's own entry beats the AIRTIME_MODEL/EFFORT overrides, which beat
    the file's defaults."""
    data = _read(config_dir / "roles.yaml")
    defaults = data.get("defaults") or {}
    roles = data.get("roles") or {}
    out: dict[str, RoleConfig] = {}
    for name in ROLE_NAMES:
        r = roles.get(name) or {}
        out[name] = RoleConfig(
            name=name,
            tools=tuple(r.get("tools") or ()),
            model=r.get("model") or model or defaults.get("model") or "claude-opus-5-5",
            effort=r.get("effort") or effort or defaults.get("effort") or "max",
            max_turns=int(r.get("max_turns", defaults.get("max_turns", 30))),
            timeout_s=int(r.get("timeout_s", defaults.get("timeout_s", 1800))),
        )
    return out


@dataclass
class ClaudeConfig:
    strategy: str = "least_used"
    cooldown_default_min: float = 60.0
    status_ttl_s: float = 300.0
    discover: list[str] = field(default_factory=list)
    accounts: list[dict] = field(default_factory=list)


def load_claude(config_dir: Path) -> ClaudeConfig:
    data = _read(config_dir / "claude.yaml")
    strategy = data.get("strategy", "least_used")
    if strategy not in ("least_used", "ordered"):
        raise ValueError(f"claude.yaml: unknown strategy {strategy!r}")
    return ClaudeConfig(
        strategy=strategy,
        cooldown_default_min=float(data.get("cooldown_default_min", 60)),
        status_ttl_s=float(data.get("status_ttl_s", 300)),
        discover=list(data.get("discover") or []),
        accounts=list(data.get("accounts") or []),
    )


def load_markets(config_dir: Path) -> dict:
    """{markets: [{code, name, languages, weight, rpm_index}] (enabled only), translate_to}."""
    data = _read(config_dir / "markets.yaml")
    keys = ("code", "name", "languages", "weight", "rpm_index")
    markets = [
        {k: m.get(k) for k in keys} for m in data.get("markets") or [] if m.get("enabled", True)
    ]
    return {"markets": markets, "translate_to": list(data.get("translate_to") or [])}


def load_rubric(config_dir: Path) -> dict:
    """{threshold, dimensions: [{id, weight, what, deterministic?}]}."""
    data = _read(config_dir / "rubric.yaml")
    if not data:
        return {}
    return {"threshold": data.get("threshold", 90), "dimensions": data.get("dimensions") or []}
