from pathlib import Path

import pytest
from app.services.recorder import RunRecorder
from app.services.simulator import TelemetrySimulator


def test_recording_creates_jsonl_and_metadata(tmp_path: Path) -> None:
    recorder = RunRecorder(tmp_path, sample_hz=10)
    sim = TelemetrySimulator(seed=1)

    started = recorder.start(
        run_id="RUN-TEST-001",
        metadata={"driver": "A. Driver", "event_type": "test", "notes": "unit test"},
    )
    assert started.recording is True
    assert started.run_id == "RUN-TEST-001"

    for _ in range(5):
        recorder.write(sim.next_frame())

    stopped = recorder.stop()
    assert stopped.recording is False
    assert stopped.frame_count == 5

    jsonl = tmp_path / "RUN-TEST-001.jsonl"
    meta = tmp_path / "RUN-TEST-001.meta.json"
    assert jsonl.exists()
    assert meta.exists()
    assert len(jsonl.read_text(encoding="utf-8").strip().splitlines()) == 5

    detail = recorder.get_run("RUN-TEST-001")
    assert detail is not None
    assert detail.frame_count == 5


def test_invalid_run_id_raises(tmp_path: Path) -> None:
    recorder = RunRecorder(tmp_path)
    with pytest.raises(ValueError):
        recorder.get_run("../../etc/passwd")
