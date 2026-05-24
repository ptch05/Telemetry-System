from __future__ import annotations

import random
from dataclasses import dataclass, field

from app.schemas.telemetry import PrechargeState

from .phases import DrivingPhase


@dataclass
class SimulatorState:
    t: int = 0
    run_id: str = "RUN-SIM-001"
    phase: DrivingPhase = "idle"
    phase_ticks: int = 0
    phase_duration: int = 80
    soc: float = 82.0
    ts_voltage: float = 396.0
    max_cell_temp: float = 28.5
    min_cell_temp: float = 26.0
    inverter_temp: float = 30.0
    motor_temp: float = 29.0
    speed: float = 0.0
    torque_actual: float = 0.0
    torque_request: float = 0.0
    apps: float = 0.0
    brake: float = 0.0
    steering: float = 0.0
    storage_gb_free: float = 118.4
    dropped_frames: int = 0
    can_errors: int = 0
    telemetry_rssi: float = -52.0
    packet_loss: float = 0.15
    recording: bool = False
    air_closed: bool = True
    precharge: PrechargeState = "COMPLETE"
    fault_active: bool = False
    torque_lag: float = 0.0
    phase_index: int = 0
    rng: random.Random = field(default_factory=random.Random)
