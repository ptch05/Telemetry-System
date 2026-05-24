from app.schemas import TelemetryFrame
from app.services.simulator import TelemetrySimulator


def test_simulator_emits_valid_frames():
    sim = TelemetrySimulator(seed=42)
    for _ in range(50):
        frame = sim.next_frame()
        assert isinstance(frame, TelemetryFrame)
        dumped = frame.model_dump()
        assert dumped["mode"] == "MOCK"
        assert 0 <= dumped["battery"]["soc"] <= 100
        assert dumped["battery"]["min_cell_voltage"] <= dumped["battery"]["max_cell_voltage"]
        assert dumped["drivetrain"]["torque_actual"] <= dumped["drivetrain"]["torque_request"] + 15


def test_correlated_torque_and_current():
    sim = TelemetrySimulator(seed=7)
    high_apps_current = []
    for _ in range(120):
        frame = sim.next_frame()
        if frame.vehicle.apps > 50:
            high_apps_current.append(frame.battery.ts_current)
    assert max(high_apps_current) > 30


VALID_CAR_STATES = {
    "LV_ON",
    "PRECHARGING",
    "READY_TO_DRIVE",
    "ACCELERATING",
    "BRAKING",
    "CORNERING",
    "COOLDOWN",
    "FAULT",
}


def test_driving_states_cycle():
    sim = TelemetrySimulator(seed=99)
    states = set()
    for _ in range(400):
        state = sim.next_frame().driving_state
        assert state in VALID_CAR_STATES, f"Unexpected driving_state: {state}"
        states.add(state)
    assert "READY_TO_DRIVE" in states or "ACCELERATING" in states
    assert len(states) >= 3


def test_all_signal_bounds():
    """Run 500 frames and verify every signal stays within realistic physical bounds."""
    sim = TelemetrySimulator(seed=12)
    for _ in range(500):
        f = sim.next_frame()
        b = f.battery
        assert 5.0 <= b.soc <= 100.0
        assert 355.0 <= b.ts_voltage <= 405.0
        assert -20.0 <= b.ts_current <= 280.0
        assert 3.2 <= b.min_cell_voltage <= 4.2
        assert 3.2 <= b.max_cell_voltage <= 4.2
        assert b.min_cell_voltage <= b.max_cell_voltage
        assert 22.0 <= b.min_cell_temp <= b.max_cell_temp
        assert 24.0 <= b.max_cell_temp <= 58.0
        assert 15.0 <= b.cell_delta_mv <= 110.0

        d = f.drivetrain
        assert 0.0 <= d.torque_request <= 210.0
        assert 0.0 <= d.torque_actual <= 210.0
        assert 25.0 <= d.inverter_temp <= 88.0
        assert 24.0 <= d.motor_temp <= 98.0

        v = f.vehicle
        assert 0.0 <= v.speed <= 115.0
        assert 0.0 <= v.apps <= 100.0
        assert -42.0 <= v.steering_angle <= 42.0
        assert -1.6 <= v.lat_g <= 1.6
        assert -1.3 <= v.long_g <= 1.0

        s = f.safety
        assert s.ams in ("OK", "WARN", "FAULT")
        assert s.imd in ("OK", "WARN", "FAULT")
        assert s.sdc in ("CLOSED", "OPEN")
        assert s.precharge in ("IDLE", "ACTIVE", "COMPLETE", "FAULT")
        assert s.rtd in ("ON", "OFF")

        assert f.driving_state in VALID_CAR_STATES

        lg = f.logger
        assert 0.0 <= lg.can_bus_load <= 72.0
        assert 0.0 <= lg.packet_loss <= 6.0
        assert -88.0 <= lg.telemetry_rssi <= -35.0
        assert lg.dropped_frames >= 0
        assert lg.can_errors >= 0


def test_soc_decreases_under_load():
    sim = TelemetrySimulator(seed=3)
    initial_soc = sim.next_frame().battery.soc
    for _ in range(300):
        sim.next_frame()
    final_soc = sim.next_frame().battery.soc
    assert final_soc < initial_soc


def test_set_recording_updates_state():
    sim = TelemetrySimulator(seed=1)
    sim.set_recording(True, "RUN-CUSTOM-001")
    frame = sim.next_frame()
    assert frame.logger.recording is True
    assert frame.run_id == "RUN-CUSTOM-001"
    sim.set_recording(False)
    frame = sim.next_frame()
    assert frame.logger.recording is False
