from __future__ import annotations

from dataclasses import dataclass

from app.core.config import Settings, settings
from app.services.recorder import RunRecorder
from app.services.telemetry import TelemetryManager


@dataclass(slots=True)
class AppState:
    recorder: RunRecorder
    telemetry: TelemetryManager


def build_app_state(cfg: Settings | None = None) -> AppState:
    cfg = cfg or settings
    run_dir = cfg.run_data_dir.resolve()
    run_dir.mkdir(parents=True, exist_ok=True)
    recorder = RunRecorder(run_dir, sample_hz=cfg.sample_hz)
    telemetry = TelemetryManager(recorder=recorder, sample_hz=cfg.sample_hz)
    return AppState(recorder=recorder, telemetry=telemetry)
