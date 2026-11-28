"""Configuration from environment variables (documented in README.md)."""

from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Wikimedia asks for a descriptive User-Agent. It names the software only: never the owner's name,
# e-mail address or repository.
DEFAULT_USER_AGENT = "Airtime/0.1 (self-hosted trend research)"

# Prefixes typed into YouTube's search box per language. Their completions are what people in a
# market are searching for right now; the "how does … work" family surfaces explainer demand.
DEFAULT_SEEDS: dict[str, list[str]] = {
    "en": ["how does", "what happened to", "why is"],
    "hi": ["कैसे काम करता है", "कैसे बनता है", "क्यों होता है"],
    "de": ["wie funktioniert", "warum ist", "was passiert"],
    "fr": ["comment fonctionne", "pourquoi", "c'est quoi"],
    "pt": ["como funciona", "por que", "o que é"],
    "es": ["cómo funciona", "por qué", "qué es"],
    "ja": ["仕組み 解説", "仕組み", "なぜ"],
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="SCOUT_", extra="ignore", populate_by_name=True, env_ignore_empty=True
    )

    # Shared Airtime variables.
    data_dir: Path = Field(
        default_factory=lambda: Path.home() / ".local" / "share" / "airtime",
        validation_alias="AIRTIME_DATA_DIR",
    )
    config_dir: Path = Field(default=Path("/config"), validation_alias="AIRTIME_CONFIG_DIR")
    fake: bool = Field(default=False, validation_alias="AIRTIME_FAKE")
    youtube_url: str = Field(default="http://127.0.0.1:8003", validation_alias="YOUTUBE_URL")
    host: str = Field(default="127.0.0.1", validation_alias=AliasChoices("SCOUT_HOST", "AIRTIME_HOST"))

    # Scout's own (SCOUT_*).
    port: int = 8002
    user_agent: str = DEFAULT_USER_AGENT
    http_timeout_s: float = 15.0
    http_retries: int = Field(default=2, ge=0, le=5)
    default_max_age_h: float = Field(default=24.0, gt=0)
    items_per_source: int = Field(default=20, ge=1, le=200)
    min_refetch_s: int = Field(default=300, ge=0)
    refresh_interval_min: int = Field(default=0, ge=0)
    retention_days: int = Field(default=30, ge=1)

    ttl_google_trends_s: int = Field(default=3600, ge=60)
    ttl_wikimedia_s: int = Field(default=21600, ge=60)
    ttl_youtube_autocomplete_s: int = Field(default=10800, ge=60)
    ttl_hacker_news_s: int = Field(default=1800, ge=60)
    ttl_suggestions_s: int = Field(default=21600, ge=0)
    ttl_youtube_search_s: int = Field(default=43200, ge=0)

    wikimedia_max_lag_days: int = Field(default=3, ge=1, le=14)
    hn_max_items: int = Field(default=30, ge=1, le=100)
    autocomplete_seeds: dict[str, list[str]] = Field(default_factory=dict)

    youtube_timeout_s: float = Field(default=90.0, gt=0)
    youtube_concurrency: int = Field(default=1, ge=1, le=8)
    probe_max_queries: int = Field(default=50, ge=1, le=500)
    breakout_max_age_days: float = Field(default=30.0, gt=0)
    breakout_min_views: int = Field(default=50_000, ge=0)

    @property
    def cache_path(self) -> Path:
        return self.data_dir / "scout" / "cache.db"

    @property
    def markets_path(self) -> Path:
        return self.config_dir / "markets.yaml"

    def seeds_for(self, language: str) -> list[str]:
        """Seeds for a language: SCOUT_AUTOCOMPLETE_SEEDS overrides the defaults per language."""
        if language in self.autocomplete_seeds:
            return list(self.autocomplete_seeds[language])
        return list(DEFAULT_SEEDS.get(language, []))
