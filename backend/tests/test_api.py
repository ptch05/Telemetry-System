import json

import pytest
from app.main import app
from fastapi.testclient import TestClient


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c


def test_health_endpoint(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["telemetry_mode"] == "mock"
    assert body["sample_hz"] > 0
    assert isinstance(body["websocket_clients"], int)
    assert isinstance(body["recording"], bool)
    assert isinstance(body["uptime_seconds"], float)


def test_list_runs_endpoint(client: TestClient):
    response = client.get("/api/runs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_invalid_run_id_returns_400(client: TestClient):
    response = client.get("/api/runs/not%20valid!")
    assert response.status_code == 400


def test_missing_run_returns_404(client: TestClient):
    response = client.get("/api/runs/RUN-DOES-NOT-EXIST-999")
    assert response.status_code == 404


def test_recording_status(client: TestClient):
    response = client.get("/api/recording/status")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body["recording"], bool)
    assert "sample_hz" in body


def test_recording_start_stop_cycle(client: TestClient):
    start_resp = client.post(
        "/api/recording/start",
        json={"driver": "Test Driver", "event_type": "test", "notes": "ci"},
    )
    assert start_resp.status_code == 200
    start_body = start_resp.json()
    assert start_body["recording"] is True
    assert start_body["run_id"] is not None
    run_id = start_body["run_id"]

    status_resp = client.get("/api/recording/status")
    assert status_resp.json()["recording"] is True

    stop_resp = client.post("/api/recording/stop")
    assert stop_resp.status_code == 200
    stop_body = stop_resp.json()
    assert stop_body["recording"] is False
    assert stop_body["run_id"] == run_id


def test_double_start_returns_already_recording(client: TestClient):
    client.post("/api/recording/start", json={})
    second = client.post("/api/recording/start", json={})
    assert second.status_code == 200
    assert second.json()["message"] == "Already recording"
    client.post("/api/recording/stop")


def test_stop_when_not_recording(client: TestClient):
    resp = client.post("/api/recording/stop")
    assert resp.status_code == 200
    assert resp.json()["message"] == "Not recording"


def test_websocket_receives_telemetry_frame(client: TestClient):
    with client.websocket_connect("/ws/telemetry") as ws:
        data = ws.receive_text()
        frame = json.loads(data)
        assert "t" in frame
        assert "battery" in frame
        assert "drivetrain" in frame
        assert "vehicle" in frame
        assert "safety" in frame
        assert "logger" in frame
        assert frame["mode"] == "MOCK"


def test_replay_invalid_run_id(client: TestClient):
    with pytest.raises(Exception):
        with client.websocket_connect("/ws/replay/INVALID%20ID!") as ws:
            ws.receive_text()
