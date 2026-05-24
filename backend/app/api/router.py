from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import (
    health_router,
    recording_router,
    runs_router,
    websocket_router,
)


def build_api_router() -> APIRouter:
    root = APIRouter()
    root.include_router(health_router)
    root.include_router(recording_router)
    root.include_router(runs_router)
    root.include_router(websocket_router)
    return root
