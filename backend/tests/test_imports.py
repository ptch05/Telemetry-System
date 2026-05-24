"""Verify that module imports resolve cleanly."""


def test_imports():
    from app.api import build_api_router  # noqa: F401
    from app.core.config import settings  # noqa: F401
    from app.core.dependencies import get_state, get_ws_state  # noqa: F401
    from app.core.state import AppState, build_app_state  # noqa: F401
    from app.schemas import HealthResponse, RecordingRequest, TelemetryFrame  # noqa: F401
    from app.services.recorder import RunRecorder  # noqa: F401
    from app.services.simulator import TelemetrySimulator  # noqa: F401
    from app.services.telemetry import TelemetryManager  # noqa: F401
    from app.utils.math import clamp, round_value  # noqa: F401
    from app.utils.run_id import resolve_run_paths, validate_run_id  # noqa: F401


def test_app_creates_without_error():
    from app.main import app

    assert app.title == "Formula Student EV Telemetry Backend"
