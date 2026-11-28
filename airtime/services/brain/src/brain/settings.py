"""Environment settings (documented in README.md)."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# src/brain/settings.py → airtime/config when brain runs from the repository on the host.
_REPO_CONFIG = Path(__file__).resolve().parents[4] / "config"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore")

    airtime_data_dir: Path = Path.home() / ".local/share/airtime"
    airtime_config_dir: Path = _REPO_CONFIG
    airtime_fake: bool = False
    airtime_model: str | None = None  # overrides roles.yaml defaults.model when set
    airtime_effort: str | None = None  # overrides roles.yaml defaults.effort when set
    airtime_claude_bin: str = "claude"
    airtime_host: str = "127.0.0.1"
    brain_port: int = 8001
    brain_max_concurrency: int = 2
    brain_cache_ttl_h: float = 168.0
    brain_fake_delay_s: float = 0.05

    @property
    def brain_dir(self) -> Path:
        return self.airtime_data_dir / "brain"
