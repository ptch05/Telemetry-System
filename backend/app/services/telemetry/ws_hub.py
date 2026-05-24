from __future__ import annotations

import asyncio
import logging

from app.schemas import TelemetryFrame
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketHub:
    """Tracks live telemetry WebSocket clients and broadcasts JSON frames."""

    def __init__(self) -> None:
        self._clients: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    @property
    def client_count(self) -> int:
        return len(self._clients)

    async def connect(self, websocket: WebSocket, snapshot: TelemetryFrame) -> None:
        await websocket.accept()
        async with self._lock:
            self._clients.add(websocket)
        try:
            await websocket.send_text(snapshot.model_dump_json())
        except Exception:
            await self.disconnect(websocket)
            raise

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._clients.discard(websocket)
        try:
            await websocket.close()
        except Exception:
            pass

    async def broadcast(self, frame: TelemetryFrame) -> None:
        payload = frame.model_dump_json()
        async with self._lock:
            clients = list(self._clients)

        dead: list[WebSocket] = []
        for client in clients:
            try:
                await client.send_text(payload)
            except Exception:
                dead.append(client)

        if dead:
            async with self._lock:
                for client in dead:
                    self._clients.discard(client)
            logger.debug("Removed %d disconnected WebSocket client(s)", len(dead))
