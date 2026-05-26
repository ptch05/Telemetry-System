from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.dependencies import get_state, require_run_id
from app.core.state import AppState
from app.schemas import (
    RecordingRequest,
    RecordingStartResponse,
    RecordingStatusResponse,
    RecordingStopResponse,
)

router = APIRouter(prefix="/api/recording", tags=["recording"])


@router.get("/status", response_model=RecordingStatusResponse)
def recording_status(state: AppState = Depends(get_state)) -> RecordingStatusResponse:
    return state.recorder.status()


@router.post("/start", response_model=RecordingStartResponse)
async def start_recording(
    request: RecordingRequest,
    state: AppState = Depends(get_state),
) -> RecordingStartResponse:
    if request.run_id:
        require_run_id(request.run_id)
    metadata = request.model_dump(exclude={"run_id"}, exclude_none=True)
    return await state.telemetry.start_recording_async(run_id=request.run_id, metadata=metadata)


@router.post("/stop", response_model=RecordingStopResponse)
async def stop_recording(state: AppState = Depends(get_state)) -> RecordingStopResponse:
    return await state.telemetry.stop_recording_async()
