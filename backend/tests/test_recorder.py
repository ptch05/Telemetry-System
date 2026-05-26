import pytest
from app.core.config import Settings
from app.core.state import build_app_state
from app.services.recorder import RunRecorder
from app.services.simulator import TelemetrySimulator


@pytest.fixture()
async def recorder(tmp_run_dir):
    cfg = Settings(
        run_data_dir=tmp_run_dir,
        database_url=f"sqlite+aiosqlite:///{tmp_run_dir.parent / 'recorder.db'}",
        storage_backend="local",
    )
    state = await build_app_state(cfg)
    yield state.recorder
    await state.engine.dispose()


@pytest.mark.asyncio
async def test_recording_creates_jsonl_and_metadata(recorder: RunRecorder, tmp_run_dir) -> None:
    sim = TelemetrySimulator(seed=1)
    active_dir = recorder.active_dir

    started = await recorder.start(
        run_id="RUN-TEST-001",
        metadata={"driver": "A. Driver", "event_type": "test", "notes": "unit test"},
    )
    assert started.recording is True
    assert started.run_id == "RUN-TEST-001"

    for _ in range(5):
        recorder.write(sim.next_frame())

    stopped = await recorder.stop()
    assert stopped.recording is False
    assert stopped.frame_count == 5

    jsonl = active_dir / "RUN-TEST-001.jsonl"
    meta = active_dir / "RUN-TEST-001.meta.json"
    assert not jsonl.exists()
    assert not meta.exists()

    completed_jsonl = tmp_run_dir / "RUN-TEST-001.jsonl"
    completed_meta = tmp_run_dir / "RUN-TEST-001.meta.json"
    assert completed_jsonl.exists()
    assert completed_meta.exists()
    assert len(completed_jsonl.read_text(encoding="utf-8").strip().splitlines()) == 5

    detail = await recorder.get_run("RUN-TEST-001")
    assert detail is not None
    assert detail.frame_count == 5


@pytest.mark.asyncio
async def test_invalid_run_id_raises(recorder: RunRecorder) -> None:
    with pytest.raises(ValueError):
        await recorder.get_run("../../etc/passwd")
