from __future__ import annotations

import logging
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_SUPPORTED_MODES = frozenset({"mock"})
_SUPPORTED_STORAGE = frozenset({"local", "s3"})
_ROOT_DIR = Path(__file__).resolve().parents[3]
_ENV_FILE = _ROOT_DIR / ".env"


class Settings(BaseSettings):
    """Backend configuration via environment variables (e.g. TELEMETRY_MODE=mock)."""

    telemetry_mode: str = "mock"
    sample_hz: float = Field(default=10.0, gt=0.1, le=100.0)
    run_data_dir: Path = Path("./data/runs")
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/fs_ev"
    storage_backend: Literal["local", "s3"] = "local"
    s3_bucket: str | None = None
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None
    aws_region: str = "eu-west-2"

    model_config = SettingsConfigDict(env_file=_ENV_FILE, env_file_encoding="utf-8", extra="ignore")

    @field_validator("telemetry_mode")
    @classmethod
    def normalize_mode(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in _SUPPORTED_MODES:
            logging.getLogger(__name__).warning(
                "TELEMETRY_MODE=%r is not implemented; falling back to 'mock'",
                normalized,
            )
            return "mock"
        return normalized

    @field_validator("storage_backend")
    @classmethod
    def normalize_storage_backend(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in _SUPPORTED_STORAGE:
            raise ValueError(f"STORAGE_BACKEND must be one of {sorted(_SUPPORTED_STORAGE)}")
        return normalized

    @property
    def active_recording_dir(self) -> Path:
        return self.run_data_dir.resolve() / "active"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
