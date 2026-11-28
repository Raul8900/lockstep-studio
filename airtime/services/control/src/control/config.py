"""The config YAMLs (AIRTIME_CONFIG_DIR) and what the database lays over them.

The YAMLs are the defaults. The owner's edits from the dashboard are kept in the `settings` table
and merged over them key by key, so a later change to a YAML still applies to every key the owner
has not edited. Calibrated rubric weights and re-fitted market weights are stored there too.
"""

from __future__ import annotations

import copy
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml
from sqlalchemy.orm import Session

from .models import Setting


@dataclass(frozen=True)
class Files:
    autopilot: dict
    rubric: dict
    markets: list[dict]
    translate_to: list[str]


def load_files(config_dir: Path) -> Files:
    def read(name: str) -> dict:
        return yaml.safe_load((Path(config_dir) / name).read_text(encoding="utf-8")) or {}

    markets = read("markets.yaml")
    return Files(read("autopilot.yaml"), read("rubric.yaml"), markets.get("markets", []),
                 list(markets.get("translate_to", [])))


def deep_merge(base: Any, over: Any) -> Any:
    if isinstance(base, dict) and isinstance(over, dict):
        out = dict(base)
        for key, value in over.items():
            out[key] = deep_merge(base.get(key), value)
        return out
    return copy.deepcopy(over if over is not None else base)


def get_setting(s: Session, key: str, default: Any = None) -> Any:
    row = s.get(Setting, key)
    return copy.deepcopy(row.value) if row is not None else default


def put_setting(s: Session, key: str, value: dict) -> None:
    row = s.get(Setting, key)
    if row is None:
        s.add(Setting(key=key, value=value))
    else:
        row.value = value


def autopilot(s: Session, files: Files) -> dict:
    return deep_merge(files.autopilot, get_setting(s, "autopilot", {}))


def markets(s: Session, files: Files, *, enabled_only: bool = False) -> list[dict]:
    """Markets with their effective weight: the owner's override, else the re-fit, else the default."""
    overrides = get_setting(s, "markets", {})
    refit = get_setting(s, "market_refit", {}) or {}
    fitted = refit.get("weights", {}) if refit.get("active") else {}
    out = []
    for market in files.markets:
        code = market["code"]
        override = overrides.get(code, {})
        row = {**market, "default_weight": market["weight"], "refit_weight": fitted.get(code),
               "override_weight": override.get("weight")}
        if override.get("weight") is not None:
            row["weight"] = override["weight"]
        elif code in fitted:
            row["weight"] = fitted[code]
        if "enabled" in override:
            row["enabled"] = bool(override["enabled"])
        if row["enabled"] or not enabled_only:
            out.append(row)
    return out


def rubric(s: Session, files: Files) -> dict:
    """The rubric with calibrated weights once calibration is active."""
    calibration = get_setting(s, "calibration", {}) or {}
    weights = calibration.get("weights", {}) if calibration.get("active") else {}
    dims = [{**d, "default_weight": d["weight"], "weight": weights.get(d["id"], d["weight"])}
            for d in files.rubric["dimensions"]]
    return {**files.rubric, "dimensions": dims}
