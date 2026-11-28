"""Process environment (pydantic-settings). Every variable is documented in README.md."""

from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Env(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore")

    database_url: str = "postgresql+psycopg://airtime:airtime@127.0.0.1:5433/airtime"
    airtime_data_dir: Path = Path.home() / ".local/share/airtime"
    airtime_config_dir: Path = Path("/config")
    airtime_fake: bool = False
    airtime_host: str = "127.0.0.1"
    control_port: int = 8000

    brain_url: str = "http://127.0.0.1:8001"
    scout_url: str = "http://127.0.0.1:8002"
    youtube_url: str = "http://127.0.0.1:8003"
    engine_url: str = "http://127.0.0.1:8004"

    # How often the worker advances productions and tasks, and polls brain runs.
    control_tick_s: float = 5.0
    control_brain_poll_s: float = 3.0
    # Pause between a failed upload attempt and the next one.
    control_upload_retry_s: float = 30.0
    # Run the worker and the crons in this process (tests drive the worker themselves).
    control_worker: bool = True
    control_log_level: str = "info"
    # The engine's PROMPTING.md; its template block goes to brief_writer. A bundled copy is used
    # when this is unset or unreadable.
    engine_prompting_md: Path | None = None
