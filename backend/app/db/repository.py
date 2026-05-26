from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.models import RunIndex
from app.schemas import RunDetail, RunSummary


class RunRepository:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._session_factory = session_factory

    async def upsert_recording(
        self,
        *,
        run_id: str,
        driver: str | None,
        event_type: str | None,
        notes: str | None,
        started_at: datetime,
        sample_hz: float,
        extra_metadata: dict[str, Any],
    ) -> None:
        async with self._session_factory() as session:
            row = await session.get(RunIndex, run_id)
            if row is None:
                row = RunIndex(
                    run_id=run_id,
                    driver=driver,
                    event_type=event_type,
                    notes=notes,
                    started_at=started_at,
                    sample_hz=sample_hz,
                    extra_metadata=extra_metadata,
                    status="recording",
                )
                session.add(row)
            else:
                row.driver = driver
                row.event_type = event_type
                row.notes = notes
                row.started_at = started_at
                row.sample_hz = sample_hz
                row.extra_metadata = extra_metadata
                row.status = "recording"
            await session.commit()

    async def upsert_completed(
        self,
        *,
        run_id: str,
        driver: str | None,
        event_type: str | None,
        notes: str | None,
        started_at: datetime | None,
        ended_at: datetime | None,
        sample_hz: float,
        frame_count: int,
        size_bytes: int,
        storage_backend: str,
        jsonl_uri: str,
        metadata_uri: str,
        extra_metadata: dict[str, Any],
    ) -> None:
        async with self._session_factory() as session:
            row = await session.get(RunIndex, run_id)
            if row is None:
                row = RunIndex(run_id=run_id)
                session.add(row)
            row.driver = driver
            row.event_type = event_type
            row.notes = notes
            row.started_at = started_at
            row.ended_at = ended_at
            row.sample_hz = sample_hz
            row.frame_count = frame_count
            row.format = "jsonl"
            row.size_bytes = size_bytes
            row.storage_backend = storage_backend
            row.jsonl_uri = jsonl_uri
            row.metadata_uri = metadata_uri
            row.status = "completed"
            row.extra_metadata = extra_metadata
            await session.commit()

    async def list_runs(self) -> list[RunSummary]:
        async with self._session_factory() as session:
            result = await session.execute(
                select(RunIndex).where(RunIndex.status == "completed").order_by(RunIndex.started_at.desc())
            )
            rows = result.scalars().all()
            return [self._to_summary(row) for row in rows]

    async def get_run(self, run_id: str) -> RunDetail | None:
        async with self._session_factory() as session:
            row = await session.get(RunIndex, run_id)
            if row is None or row.status != "completed":
                return None
            return self._to_detail(row)

    async def delete_run(self, run_id: str) -> bool:
        async with self._session_factory() as session:
            row = await session.get(RunIndex, run_id)
            if row is None:
                return False
            await session.delete(row)
            await session.commit()
            return True

    @staticmethod
    def _metadata_dict(row: RunIndex) -> dict[str, Any]:
        payload = {
            "run_id": row.run_id,
            "driver": row.driver,
            "event_type": row.event_type,
            "notes": row.notes,
            "started_at": row.started_at.isoformat() if row.started_at else None,
            "ended_at": row.ended_at.isoformat() if row.ended_at else None,
            "sample_hz": row.sample_hz,
            "frame_count": row.frame_count,
            "format": row.format,
            "metadata": row.extra_metadata or {},
        }
        return {k: v for k, v in payload.items() if v is not None}

    def _to_summary(self, row: RunIndex) -> RunSummary:
        return RunSummary(
            run_id=row.run_id,
            file=row.jsonl_uri,
            size_bytes=row.size_bytes,
            metadata=self._metadata_dict(row),
        )

    def _to_detail(self, row: RunIndex) -> RunDetail:
        return RunDetail(
            run_id=row.run_id,
            file=row.jsonl_uri,
            size_bytes=row.size_bytes,
            frame_count=row.frame_count,
            metadata=self._metadata_dict(row),
        )
