from __future__ import annotations

from dataclasses import dataclass

from app.core.config import Settings, settings
from app.db.repository import RunRepository
from app.db.session import create_engine, create_session_factory, init_db
from app.services.recorder import RunRecorder
from app.services.storage import build_storage_backend
from app.services.telemetry import TelemetryManager
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker


@dataclass(slots=True)
class AppState:
    engine: AsyncEngine
    session_factory: async_sessionmaker
    recorder: RunRecorder
    telemetry: TelemetryManager


async def build_app_state(cfg: Settings | None = None) -> AppState:
    cfg = cfg or settings
    cfg.active_recording_dir.mkdir(parents=True, exist_ok=True)
    cfg.run_data_dir.resolve().mkdir(parents=True, exist_ok=True)

    engine = create_engine(cfg.database_url)
    await init_db(engine)
    session_factory = create_session_factory(engine)
    repository = RunRepository(session_factory)
    storage = build_storage_backend(cfg)

    recorder = RunRecorder(
        active_dir=cfg.active_recording_dir,
        sample_hz=cfg.sample_hz,
        storage=storage,
        repository=repository,
        storage_backend_name=cfg.storage_backend,
    )
    telemetry = TelemetryManager(recorder=recorder, sample_hz=cfg.sample_hz)
    return AppState(
        engine=engine,
        session_factory=session_factory,
        recorder=recorder,
        telemetry=telemetry,
    )
