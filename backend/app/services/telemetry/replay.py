from __future__ import annotations

import asyncio
import logging

from app.services.recorder import RunRecorder
from fastapi import WebSocket

logger = logging.getLogger(__name__)

REPLAY_COMPLETE_CODE = 4200
RUN_NOT_FOUND_CODE = 4404


async def stream_run_replay(
    websocket: WebSocket,
    recorder: RunRecorder,
    run_id: str,
    default_hz: float,
) -> None:
    await websocket.accept()
    detail = recorder.get_run(run_id)
    if detail is None:
        await websocket.close(code=RUN_NOT_FOUND_CODE, reason="Run not found")
        return

    replay_hz = detail.metadata.get("sample_hz", default_hz)
    interval = 1.0 / max(float(replay_hz), 0.1)

    try:
        for frame in recorder.iter_frames(run_id):
            await websocket.send_text(frame.model_dump_json())
            await asyncio.sleep(interval)
        await websocket.close(code=REPLAY_COMPLETE_CODE, reason="Replay complete")
    except Exception:
        logger.debug("Replay interrupted for run %s", run_id)
        try:
            await websocket.close()
        except Exception:
            pass
