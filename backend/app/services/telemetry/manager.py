from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

from app.schemas import RecordingStartResponse, RecordingStopResponse, TelemetryFrame
from app.services.recorder import RunRecorder
from app.services.simulator import TelemetrySimulator
from app.services.telemetry.replay import stream_run_replay
from app.services.telemetry.ws_hub import WebSocketHub

logger = logging.getLogger(__name__)


class TelemetryManager:
    """Owns mock frame generation, WebSocket fan-out, and recording coordination."""

    def __init__(self, recorder: RunRecorder, sample_hz: float = 10.0) -> None:
        self.recorder = recorder
        self.sample_hz = sample_hz
        self.simulator = TelemetrySimulator()
        self.ws_hub = WebSocketHub()
        self.current_frame: TelemetryFrame = self.simulator.next_frame()
        self._task: asyncio.Task[None] | None = None
        self._started_at = time.monotonic()

    @property
    def clients(self) -> set:
        """Backward-compatible access to connected WebSockets."""
        return self.ws_hub._clients

    @property
    def uptime_seconds(self) -> float:
        return time.monotonic() - self._started_at

    @property
    def _interval_seconds(self) -> float:
        return 1.0 / self.sample_hz

    async def start(self) -> None:
        if self._task is None:
            self._task = asyncio.create_task(self._broadcast_loop(), name="telemetry-broadcast")

    async def stop(self) -> None:
        if self._task is None:
            return
        self._task.cancel()
        try:
            await self._task
        except asyncio.CancelledError:
            pass
        self._task = None

    async def connect(self, websocket) -> None:
        await self.ws_hub.connect(websocket, self.current_frame)

    async def disconnect(self, websocket) -> None:
        await self.ws_hub.disconnect(websocket)

    async def _broadcast_loop(self) -> None:
        while True:
            self.current_frame = self.simulator.next_frame()
            self.recorder.write(self.current_frame)
            await self.ws_hub.broadcast(self.current_frame)
            await asyncio.sleep(self._interval_seconds)

    async def start_recording_async(
        self,
        run_id: str | None,
        metadata: dict[str, Any] | None = None,
    ) -> RecordingStartResponse:
        result = await self.recorder.start(run_id=run_id, metadata=metadata)
        if result.run_id:
            self.simulator.set_recording(True, result.run_id)
            self.current_frame = self.simulator.next_frame()
        return result

    async def stop_recording_async(self) -> RecordingStopResponse:
        result = await self.recorder.stop()
        self.simulator.set_recording(False)
        return result

    async def replay_run(self, websocket, run_id: str) -> None:
        await stream_run_replay(websocket, self.recorder, run_id, self.sample_hz)
