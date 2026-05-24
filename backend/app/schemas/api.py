from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class RecordingRequest(BaseModel):
    run_id: str | None = Field(default=None, description="Optional run identifier. Generated if omitted.")
    driver: str | None = None
    event_type: str | None = None
    notes: str | None = None


class RecordingStatusResponse(BaseModel):
    recording: bool
    run_id: str | None = None
    frame_count: int = 0
    sample_hz: float = 10.0


class RecordingStartResponse(BaseModel):
    recording: bool
    run_id: str | None = None
    path: str | None = None
    message: str | None = None


class RecordingStopResponse(BaseModel):
    recording: bool
    run_id: str | None = None
    frame_count: int = 0
    message: str | None = None


class RunSummary(BaseModel):
    run_id: str
    file: str
    size_bytes: int
    metadata: dict[str, Any] = Field(default_factory=dict)


class RunDetail(BaseModel):
    run_id: str
    file: str
    size_bytes: int
    frame_count: int
    metadata: dict[str, Any] = Field(default_factory=dict)


class HealthResponse(BaseModel):
    status: str
    telemetry_mode: str
    sample_hz: float
    websocket_clients: int
    recording: bool
    recording_run_id: str | None = None
    run_data_dir: str
    uptime_seconds: float
