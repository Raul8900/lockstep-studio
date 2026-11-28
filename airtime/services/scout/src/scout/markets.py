"""The markets scout collects for, read from $AIRTIME_CONFIG_DIR/markets.yaml."""

from dataclasses import dataclass
from pathlib import Path

import yaml


@dataclass(frozen=True)
class Market:
    code: str
    name: str
    languages: tuple[str, ...]
    enabled: bool = True

    @property
    def language(self) -> str:
        """The market's first language: the default for probes."""
        return self.languages[0]


def load_markets(path: Path) -> dict[str, Market]:
    """All markets in the file, by code, in file order. Raises ValueError when it is unusable."""
    try:
        data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    except (OSError, yaml.YAMLError) as exc:
        raise ValueError(f"cannot read {path}: {exc}") from exc
    markets: dict[str, Market] = {}
    for row in data.get("markets") or []:
        code = str(row.get("code", "")).upper()
        languages = tuple(str(lang).lower() for lang in row.get("languages") or [])
        if len(code) != 2 or not languages:
            raise ValueError(f"{path}: every market needs a two-letter code and languages: {row}")
        markets[code] = Market(
            code, str(row.get("name", code)), languages, bool(row.get("enabled", True))
        )
    if not markets:
        raise ValueError(f"{path} lists no markets")
    return markets
