from __future__ import annotations

from app.core.state import AppState
from app.utils.run_id import validate_run_id
from fastapi import FastAPI, HTTPException, Request, WebSocket


def _state_from_app(app: FastAPI) -> AppState:
    state: AppState | None = getattr(app.state, "app_state", None)
    if state is None:
        raise HTTPException(status_code=503, detail="Application is starting")
    return state


def get_state(request: Request) -> AppState:
    return _state_from_app(request.app)


def get_ws_state(websocket: WebSocket) -> AppState:
    state: AppState | None = getattr(websocket.app.state, "app_state", None)
    if state is None:
        raise RuntimeError("Application is starting")
    return state


def require_run_id(run_id: str) -> str:
    try:
        return validate_run_id(run_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
