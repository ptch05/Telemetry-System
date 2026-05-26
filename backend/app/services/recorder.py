from __future__ import annotations

import json
from collections.abc import AsyncIterator
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, TextIO
from uuid import uuid4

from app.db.repository import RunRepository
from app.schemas import (
    RecordingStartResponse,
    RecordingStatusResponse,
    RecordingStopResponse,
    RunDetail,
    RunSummary,
    TelemetryFrame,
)
from app.services.storage.base import RunStorageBackend
from app.utils.run_id import resolve_run_paths, validate_run_id

METADATA_FLUSH_INTERVAL = 50


class RunRecorder:
    """Records telemetry to local temp files, then finalizes to storage + PostgreSQL."""

    def __init__(
        self,
        active_dir: Path,
        sample_hz: float,
        storage: RunStorageBackend,
        repository: RunRepository,
        storage_backend_name: str = "local",
    ) -> None:
        self.active_dir = active_dir
        self.active_dir.mkdir(parents=True, exist_ok=True)
        self.sample_hz = sample_hz
        self.storage = storage
        self.repository = repository
        self.storage_backend_name = storage_backend_name
        self._file: TextIO | None = None
        self.run_id: str | None = None
        self.metadata: dict[str, Any] = {}
        self.frame_count = 0
        self._meta_path: Path | None = None
        self._jsonl_path: Path | None = None

    @property
    def is_recording(self) -> bool:
        return self._file is not None

    def _write_metadata(self, extra: dict[str, Any] | None = None) -> None:
        if not self._meta_path or not self.run_id:
            return
        payload = {
            "run_id": self.run_id,
            "driver": self.metadata.get("driver"),
            "event_type": self.metadata.get("event_type"),
            "notes": self.metadata.get("notes"),
            "started_at": self.metadata.get("started_at"),
            "ended_at": self.metadata.get("ended_at"),
            "sample_hz": self.sample_hz,
            "frame_count": self.frame_count,
            "format": "jsonl",
            "metadata": {k: v for k, v in self.metadata.items() if k not in {"started_at", "ended_at"}},
        }
        if extra:
            payload.update(extra)
        self._meta_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    async def start(
        self,
        run_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> RecordingStartResponse:
        if self.is_recording:
            return RecordingStartResponse(
                recording=True,
                run_id=self.run_id,
                message="Already recording",
            )

        proposed = run_id or f"RUN-{datetime.now(UTC).strftime('%Y%m%d-%H%M%S')}-{uuid4().hex[:6].upper()}"
        safe_id = validate_run_id(proposed)
        jsonl_path, meta_path = resolve_run_paths(self.active_dir, safe_id)

        self.run_id = safe_id
        self.metadata = metadata or {}
        started_at = datetime.now(UTC)
        self.metadata["started_at"] = started_at.isoformat()
        self.frame_count = 0
        self._meta_path = meta_path
        self._jsonl_path = jsonl_path
        self._write_metadata()
        self._file = jsonl_path.open("a", encoding="utf-8")

        extra = {k: v for k, v in self.metadata.items() if k not in {"started_at", "ended_at"}}
        await self.repository.upsert_recording(
            run_id=safe_id,
            driver=self.metadata.get("driver"),
            event_type=self.metadata.get("event_type"),
            notes=self.metadata.get("notes"),
            started_at=started_at,
            sample_hz=self.sample_hz,
            extra_metadata=extra,
        )

        return RecordingStartResponse(
            recording=True,
            run_id=self.run_id,
            path=str(jsonl_path),
        )

    async def stop(self) -> RecordingStopResponse:
        if not self.is_recording:
            return RecordingStopResponse(
                recording=False,
                run_id=self.run_id,
                message="Not recording",
                frame_count=0,
            )

        run_id = self.run_id
        assert run_id is not None
        assert self._jsonl_path is not None
        assert self._meta_path is not None

        ended_at = datetime.now(UTC)
        self.metadata["ended_at"] = ended_at.isoformat()
        self._write_metadata()
        if self._file is not None:
            self._file.close()
        self._file = None
        count = self.frame_count

        artifacts = await self.storage.save_completed_run(run_id, self._jsonl_path, self._meta_path)
        extra = {k: v for k, v in self.metadata.items() if k not in {"started_at", "ended_at"}}
        started_at_raw = self.metadata.get("started_at")
        started_at = datetime.fromisoformat(started_at_raw) if started_at_raw else None

        await self.repository.upsert_completed(
            run_id=run_id,
            driver=self.metadata.get("driver"),
            event_type=self.metadata.get("event_type"),
            notes=self.metadata.get("notes"),
            started_at=started_at,
            ended_at=ended_at,
            sample_hz=self.sample_hz,
            frame_count=count,
            size_bytes=artifacts.size_bytes,
            storage_backend=self.storage_backend_name,
            jsonl_uri=artifacts.jsonl_uri,
            metadata_uri=artifacts.metadata_uri,
            extra_metadata=extra,
        )

        self.frame_count = 0
        self.run_id = None
        self._meta_path = None
        self._jsonl_path = None
        return RecordingStopResponse(recording=False, run_id=run_id, frame_count=count)

    def write(self, frame: TelemetryFrame) -> None:
        if not self.is_recording or self._file is None:
            return
        self._file.write(frame.model_dump_json() + "\n")
        self._file.flush()
        self.frame_count += 1
        if self.frame_count % METADATA_FLUSH_INTERVAL == 0:
            self._write_metadata()

    def status(self) -> RecordingStatusResponse:
        return RecordingStatusResponse(
            recording=self.is_recording,
            run_id=self.run_id,
            frame_count=self.frame_count,
            sample_hz=self.sample_hz,
        )

    async def list_runs(self) -> list[RunSummary]:
        return await self.repository.list_runs()

    async def get_run(self, run_id: str) -> RunDetail | None:
        validate_run_id(run_id)
        return await self.repository.get_run(run_id)

    async def aiter_frames(self, run_id: str) -> AsyncIterator[TelemetryFrame]:
        validate_run_id(run_id)
        data = await self.storage.download_artifact(run_id, "jsonl")
        for line in data.decode().splitlines():
            line = line.strip()
            if line:
                yield TelemetryFrame.model_validate_json(line)

    async def download_artifact(self, run_id: str, artifact: str) -> bytes:
        validate_run_id(run_id)
        return await self.storage.download_artifact(run_id, artifact)
