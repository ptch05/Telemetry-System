from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from app.core.dependencies import get_ws_state
from app.core.state import AppState
from app.utils.run_id import validate_run_id

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/telemetry")
async def telemetry_ws(
    websocket: WebSocket,
    state: AppState = Depends(get_ws_state),
) -> None:
    await state.telemetry.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        logger.debug("Telemetry client disconnected")
    except Exception:
        logger.debug("Telemetry client connection error")
    finally:
        await state.telemetry.disconnect(websocket)


@router.websocket("/ws/replay/{run_id}")
async def replay_ws(
    websocket: WebSocket,
    run_id: str,
    state: AppState = Depends(get_ws_state),
) -> None:
    try:
        validate_run_id(run_id)
    except ValueError:
        await websocket.close(code=4400, reason="Invalid run ID")
        return
    await state.telemetry.replay_run(websocket, run_id)
