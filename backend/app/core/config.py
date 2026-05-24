from __future__ import annotations

import logging
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_SUPPORTED_MODES = frozenset({"mock"})


class Settings(BaseSettings):
    """Backend configuration via environment variables (e.g. TELEMETRY_MODE=mock)."""

    telemetry_mode: str = "mock"
    sample_hz: float = Field(default=10.0, gt=0.1, le=100.0)
    run_data_dir: Path = Path("./data/runs")
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

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

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
