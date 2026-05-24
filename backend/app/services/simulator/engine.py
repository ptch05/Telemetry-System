from __future__ import annotations

import math
from datetime import UTC, datetime
from typing import Literal

from app.schemas import (
    BatteryState,
    DrivetrainState,
    LoggerState,
    SafetyState,
    TelemetryFrame,
    VehicleState,
)
from app.utils.math import clamp, round_value

from .phases import PHASE_SEQUENCE, phase_duration_ticks
from .state import SimulatorState


class TelemetrySimulator:
    """Generates correlated mock EV telemetry using a simple driving-state model."""

    def __init__(self, seed: int | None = None) -> None:
        self.state = SimulatorState()
        if seed is not None:
            self.state.rng.seed(seed)

    def set_recording(self, recording: bool, run_id: str | None = None) -> None:
        self.state.recording = recording
        if run_id:
            self.state.run_id = run_id

    def _advance_phase(self) -> None:
        s = self.state
        s.phase_ticks += 1
        if s.phase == "fault":
            if s.phase_ticks > 25:
                s.fault_active = False
                s.phase = "cooldown"
                s.phase_ticks = 0
                s.phase_duration = 60
            return
        if s.phase_ticks < s.phase_duration:
            return
        s.phase_ticks = 0
        s.phase_index = (s.phase_index + 1) % len(PHASE_SEQUENCE)
        s.phase = PHASE_SEQUENCE[s.phase_index]
        s.phase_duration = phase_duration_ticks(s.phase, s.rng)

    def _resolve_car_state(self) -> str:
        """Map internal phase + precharge state to user-facing car state."""
        s = self.state
        if s.phase == "fault":
            return "FAULT"
        if s.precharge == "ACTIVE":
            return "PRECHARGING"
        if not s.air_closed:
            return "LV_ON"
        phase_map = {
            "idle": "READY_TO_DRIVE",
            "launch": "ACCELERATING",
            "acceleration": "ACCELERATING",
            "braking": "BRAKING",
            "cornering": "CORNERING",
            "cooldown": "COOLDOWN",
        }
        return phase_map.get(s.phase, "READY_TO_DRIVE")

    def _maybe_trigger_fault(self) -> None:
        s = self.state
        if s.phase == "fault" or s.fault_active:
            return
        if s.rng.random() < 0.0025:
            s.fault_active = True
            s.phase = "fault"
            s.phase_ticks = 0
            s.phase_duration = 30

    def _phase_targets(self) -> tuple[float, float, float, float]:
        """Return apps %, brake bar, steering deg, cornering intensity."""
        phase = self.state.phase
        rng = self.state.rng
        if phase == "idle":
            return 0.0, 0.0, rng.uniform(-2, 2), 0.0
        if phase == "launch":
            t = self.state.phase_ticks / max(self.state.phase_duration, 1)
            apps = clamp(t * 95 + rng.uniform(-3, 5), 0, 100)
            return apps, 0.0, rng.uniform(-4, 4), 0.0
        if phase == "acceleration":
            apps = clamp(55 + 35 * math.sin(self.state.phase_ticks / 12) + rng.uniform(-4, 6), 15, 100)
            return apps, 0.0, rng.uniform(-8, 8), 0.0
        if phase == "braking":
            t = self.state.phase_ticks / max(self.state.phase_duration, 1)
            brake = clamp(20 + t * 55 + rng.uniform(-4, 6), 0, 90)
            apps = clamp(max(0, 8 - t * 12), 0, 15)
            return apps, brake, rng.uniform(-5, 5), 0.0
        if phase == "cornering":
            steer = 28 * math.sin(self.state.phase_ticks / 8) + rng.uniform(-4, 4)
            apps = clamp(35 + rng.uniform(-8, 10), 10, 75)
            return apps, rng.uniform(0, 8), steer, clamp(abs(steer) / 35, 0.2, 1.2)
        if phase == "cooldown":
            return rng.uniform(0, 8), rng.uniform(0, 12), rng.uniform(-3, 3), 0.0
        # fault
        return rng.uniform(0, 20), rng.uniform(5, 25), rng.uniform(-10, 10), 0.0

    def next_frame(self) -> TelemetryFrame:
        s = self.state
        s.t += 1
        self._advance_phase()
        self._maybe_trigger_fault()

        target_apps, target_brake, target_steer, corner_intensity = self._phase_targets()
        s.apps = clamp(s.apps * 0.75 + target_apps * 0.25 + s.rng.uniform(-1.5, 1.5), 0, 100)
        s.brake = clamp(s.brake * 0.7 + target_brake * 0.3 + s.rng.uniform(-1, 1), 0, 95)
        s.steering = clamp(s.steering * 0.6 + target_steer * 0.4, -42, 42)

        s.torque_request = clamp(s.apps * 2.05 - s.brake * 0.35, 0, 210)
        lag = 0.18 if s.phase == "launch" else 0.28
        s.torque_lag = s.torque_lag * (1 - lag) + s.torque_request * lag
        s.torque_actual = clamp(s.torque_lag + s.rng.uniform(-3, 3), 0, 210)

        speed_delta = s.torque_actual * 0.028 - s.brake * 0.055
        if s.phase == "cornering":
            speed_delta *= 0.92
        s.speed = clamp(s.speed + speed_delta + s.rng.uniform(-0.8, 0.8), 0, 115)

        current = clamp(s.torque_actual * 1.22 - s.brake * 0.4 + s.rng.uniform(-6, 6), -20, 280)
        voltage_sag = max(0, current) * 0.032
        s.ts_voltage = clamp(396.0 - voltage_sag + s.rng.uniform(-0.6, 0.6), 355, 405)
        pack_power_kw = (s.ts_voltage * current) / 1000.0

        heat_in = max(0, pack_power_kw) * 0.004 + abs(current) * 0.0008
        cool = 0.04 if s.speed > 25 else 0.015
        s.max_cell_temp = clamp(s.max_cell_temp + heat_in - cool + s.rng.uniform(-0.06, 0.1), 24, 58)
        s.min_cell_temp = clamp(s.max_cell_temp - s.rng.uniform(2.0, 5.5), 22, s.max_cell_temp)
        s.inverter_temp = clamp(s.inverter_temp + heat_in * 1.6 - cool + s.rng.uniform(-0.1, 0.15), 25, 88)
        s.motor_temp = clamp(s.motor_temp + heat_in * 1.9 - cool + s.rng.uniform(-0.08, 0.12), 24, 98)

        derating = s.inverter_temp > 72 or s.motor_temp > 82 or s.max_cell_temp > 52
        if derating:
            s.torque_actual = clamp(s.torque_actual * 0.72, 0, 210)

        s.soc = clamp(s.soc - max(0, pack_power_kw) * 0.00018, 5, 100)

        activity = s.apps + s.brake * 0.5 + abs(s.steering) * 0.3
        s.telemetry_rssi = clamp(s.telemetry_rssi + s.rng.uniform(-1.5, 1.5), -88, -35)
        s.packet_loss = clamp(0.08 + activity * 0.004 + s.rng.uniform(-0.05, 0.06), 0, 6)
        can_load = clamp(18 + activity * 0.22 + s.rng.uniform(-1.5, 2), 8, 72)

        if s.rng.random() < 0.004 + activity * 0.00003:
            s.can_errors += 1
        if s.rng.random() < 0.006 + activity * 0.00004:
            s.dropped_frames += 1

        cell_delta_mv = clamp(38 + max(0, current) * 0.12 + s.rng.uniform(-6, 8), 15, 110)
        min_cell_v = clamp(3.78 - max(0, current) * 0.00055 + s.rng.uniform(-0.005, 0.004), 3.2, 4.2)
        max_cell_v = clamp(min_cell_v + cell_delta_mv / 1000, min_cell_v, 4.2)
        avg_cell_v = (min_cell_v + max_cell_v) / 2

        if s.phase == "idle" and s.t < 30:
            s.air_closed = False
            s.precharge = "ACTIVE"
        elif s.phase == "launch" and not s.air_closed:
            s.precharge = "COMPLETE"
            s.air_closed = s.rng.random() > 0.15
        elif s.fault_active and s.rng.random() < 0.08:
            s.air_closed = False
        else:
            s.precharge = "COMPLETE"
            if s.phase != "fault":
                s.air_closed = True

        ams: Literal["OK", "WARN", "FAULT"] = "OK"
        if s.max_cell_temp > 55 or min_cell_v < 3.22:
            ams = "FAULT"
        elif s.max_cell_temp > 50 or min_cell_v < 3.42 or s.fault_active:
            ams = "WARN"

        imd: Literal["OK", "WARN", "FAULT"] = "OK"
        if s.fault_active and s.rng.random() < 0.35:
            imd = "WARN"
        elif s.rng.random() < 0.0015:
            imd = "WARN"

        yaw = s.steering * 0.45 * corner_intensity + s.rng.uniform(-0.8, 0.8)
        lat_g = clamp(yaw / 22 * clamp(s.speed / 70, 0, 1.4), -1.6, 1.6)
        long_g = clamp(s.apps / 100 * 0.75 - s.brake / 100 * 1.1 + s.rng.uniform(-0.04, 0.04), -1.3, 1.0)

        ws_base = s.speed
        slip = 1.8 if s.apps > 60 and s.phase == "launch" else 0.4
        ws_fl = ws_base + s.rng.uniform(-0.5, 0.5)
        ws_fr = ws_base + s.rng.uniform(-0.5, 0.5)
        ws_rl = ws_base + s.rng.uniform(-slip, slip + 0.3)
        ws_rr = ws_base + s.rng.uniform(-slip, slip + 0.3)

        motor_rpm = s.speed * 78 + s.rng.uniform(-30, 30)
        inverter_state = "DERATING" if derating else "ENABLED" if s.apps > 5 else "READY"

        s.storage_gb_free = clamp(s.storage_gb_free - (0.003 if s.recording else 0.0005), 0, 512)

        car_state = self._resolve_car_state()

        return TelemetryFrame(
            t=s.t,
            timestamp=datetime.now(UTC).isoformat(),
            run_id=s.run_id,
            mode="MOCK",
            driving_state=car_state,
            battery=BatteryState(
                soc=round_value(s.soc, 1),
                ts_voltage=round_value(s.ts_voltage, 1),
                ts_current=round_value(current, 1),
                min_cell_voltage=round_value(min_cell_v, 3),
                max_cell_voltage=round_value(max_cell_v, 3),
                avg_cell_voltage=round_value(avg_cell_v, 3),
                max_cell_temp=round_value(s.max_cell_temp, 1),
                min_cell_temp=round_value(s.min_cell_temp, 1),
                temp_spread=round_value(s.max_cell_temp - s.min_cell_temp, 1),
                cell_delta_mv=round_value(cell_delta_mv, 0),
                pack_power_kw=round_value(pack_power_kw, 1),
            ),
            drivetrain=DrivetrainState(
                motor_rpm=round_value(motor_rpm, 0),
                torque_request=round_value(s.torque_request, 1),
                torque_actual=round_value(s.torque_actual, 1),
                inverter_temp=round_value(s.inverter_temp, 1),
                motor_temp=round_value(s.motor_temp, 1),
                dc_bus_voltage=round_value(s.ts_voltage, 1),
                derating=derating,
                inverter_state=inverter_state,
            ),
            vehicle=VehicleState(
                speed=round_value(s.speed, 1),
                apps=round_value(s.apps, 1),
                brake_front=round_value(s.brake * 1.12, 1),
                brake_rear=round_value(s.brake * 0.88, 1),
                steering_angle=round_value(s.steering, 1),
                yaw_rate=round_value(yaw, 1),
                lat_g=round_value(lat_g, 2),
                long_g=round_value(long_g, 2),
                wheel_speed_fl=round_value(ws_fl, 1),
                wheel_speed_fr=round_value(ws_fr, 1),
                wheel_speed_rl=round_value(ws_rl, 1),
                wheel_speed_rr=round_value(ws_rr, 1),
            ),
            safety=SafetyState(
                ams=ams,
                imd=imd,
                sdc="CLOSED" if s.air_closed else "OPEN",
                precharge=s.precharge,
                air_positive="CLOSED" if s.air_closed else "OPEN",
                air_negative="CLOSED" if s.air_closed else "OPEN",
                rtd="ON" if s.air_closed and s.precharge == "COMPLETE" else "OFF",
                active_faults=1 if ams == "FAULT" or not s.air_closed else 0,
            ),
            logger=LoggerState(
                recording=s.recording,
                storage_gb_free=round_value(s.storage_gb_free, 2),
                cpu_temp=round_value(clamp(42 + heat_in * 3 + s.rng.uniform(-2, 3), 30, 78), 1),
                dropped_frames=s.dropped_frames,
                can_bus_load=round_value(can_load, 1),
                can_errors=s.can_errors,
                telemetry_rssi=round_value(s.telemetry_rssi, 0),
                packet_loss=round_value(s.packet_loss, 2),
            ),
        )
