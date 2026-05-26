from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.config import settings
from app.core.dependencies import get_state
from app.core.state import AppState
from app.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health(state: AppState = Depends(get_state)) -> HealthResponse:
    recording = state.recorder.status()
    return HealthResponse(
        status="ok",
        telemetry_mode=settings.telemetry_mode,
        sample_hz=settings.sample_hz,
        websocket_clients=len(state.telemetry.clients),
        recording=recording.recording,
        recording_run_id=recording.run_id,
        run_data_dir=str(settings.run_data_dir.resolve()),
        storage_backend=settings.storage_backend,
        uptime_seconds=round(state.telemetry.uptime_seconds, 2),
    )
