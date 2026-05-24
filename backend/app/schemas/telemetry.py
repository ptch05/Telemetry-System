from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

PrechargeState = Literal["IDLE", "ACTIVE", "COMPLETE", "FAULT"]
SafetyStatus = Literal["OK", "WARN", "FAULT"]
OpenClosed = Literal["CLOSED", "OPEN"]
RtdState = Literal["ON", "OFF"]


class BatteryState(BaseModel):
    soc: float
    ts_voltage: float
    ts_current: float
    min_cell_voltage: float
    max_cell_voltage: float
    avg_cell_voltage: float
    max_cell_temp: float
    min_cell_temp: float
    temp_spread: float
    cell_delta_mv: float
    pack_power_kw: float


class DrivetrainState(BaseModel):
    motor_rpm: float
    torque_request: float
    torque_actual: float
    inverter_temp: float
    motor_temp: float
    dc_bus_voltage: float
    derating: bool
    inverter_state: str


class VehicleState(BaseModel):
    speed: float
    apps: float
    brake_front: float
    brake_rear: float
    steering_angle: float
    yaw_rate: float
    lat_g: float
    long_g: float
    wheel_speed_fl: float
    wheel_speed_fr: float
    wheel_speed_rl: float
    wheel_speed_rr: float


class SafetyState(BaseModel):
    ams: SafetyStatus
    imd: SafetyStatus
    sdc: OpenClosed
    precharge: PrechargeState
    air_positive: OpenClosed
    air_negative: OpenClosed
    rtd: RtdState
    active_faults: int


class LoggerState(BaseModel):
    recording: bool
    storage_gb_free: float
    cpu_temp: float
    dropped_frames: int
    can_bus_load: float
    can_errors: int
    telemetry_rssi: float
    packet_loss: float


class TelemetryFrame(BaseModel):
    t: int
    timestamp: str
    run_id: str
    mode: str = "MOCK"
    driving_state: str = "idle"
    battery: BatteryState
    drivetrain: DrivetrainState
    vehicle: VehicleState
    safety: SafetyState
    logger: LoggerState
