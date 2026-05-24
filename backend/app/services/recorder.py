from __future__ import annotations

import json
from collections.abc import Iterator
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, TextIO
from uuid import uuid4

from app.schemas import (
    RecordingStartResponse,
    RecordingStatusResponse,
    RecordingStopResponse,
    RunDetail,
    RunSummary,
    TelemetryFrame,
)
from app.utils.run_id import resolve_run_paths, validate_run_id

METADATA_FLUSH_INTERVAL = 50


class RunRecorder:
    """JSONL run recorder with per-run metadata files."""

    def __init__(self, recording_dir: Path, sample_hz: float = 10.0) -> None:
        self.recording_dir = recording_dir
        self.recording_dir.mkdir(parents=True, exist_ok=True)
        self.sample_hz = sample_hz
        self._file: TextIO | None = None
        self.run_id: str | None = None
        self.metadata: dict[str, Any] = {}
        self.frame_count = 0
        self._meta_path: Path | None = None

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

    def start(
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
        jsonl_path, meta_path = resolve_run_paths(self.recording_dir, safe_id)

        self.run_id = safe_id
        self.metadata = metadata or {}
        self.metadata["started_at"] = datetime.now(UTC).isoformat()
        self.frame_count = 0
        self._meta_path = meta_path
        self._write_metadata()
        self._file = jsonl_path.open("a", encoding="utf-8")
        return RecordingStartResponse(
            recording=True,
            run_id=self.run_id,
            path=str(jsonl_path),
        )

    def stop(self) -> RecordingStopResponse:
        if not self.is_recording:
            return RecordingStopResponse(
                recording=False,
                run_id=self.run_id,
                message="Not recording",
                frame_count=0,
            )

        run_id = self.run_id
        self.metadata["ended_at"] = datetime.now(UTC).isoformat()
        self._write_metadata()
        if self._file is not None:
            self._file.close()
        self._file = None
        count = self.frame_count
        self.frame_count = 0
        self.run_id = None
        self._meta_path = None
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

    def list_runs(self) -> list[RunSummary]:
        runs: list[RunSummary] = []
        for path in sorted(self.recording_dir.glob("*.jsonl"), reverse=True):
            try:
                validate_run_id(path.stem)
            except ValueError:
                continue
            meta_path = path.with_suffix(".meta.json")
            meta = self._read_json(meta_path)
            runs.append(
                RunSummary(
                    run_id=path.stem,
                    file=str(path),
                    size_bytes=path.stat().st_size,
                    metadata=meta,
                )
            )
        return runs

    def get_run(self, run_id: str) -> RunDetail | None:
        jsonl_path, meta_path = resolve_run_paths(self.recording_dir, run_id)
        if not jsonl_path.exists():
            return None
        meta = self._read_json(meta_path)
        frame_count = meta.get("frame_count")
        if frame_count is None:
            frame_count = sum(1 for line in jsonl_path.open(encoding="utf-8") if line.strip())
        return RunDetail(
            run_id=run_id,
            file=str(jsonl_path),
            size_bytes=jsonl_path.stat().st_size,
            frame_count=int(frame_count),
            metadata=meta,
        )

    def iter_frames(self, run_id: str) -> Iterator[TelemetryFrame]:
        jsonl_path, _ = resolve_run_paths(self.recording_dir, run_id)
        if not jsonl_path.exists():
            raise FileNotFoundError(run_id)
        with jsonl_path.open(encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if line:
                    yield TelemetryFrame.model_validate_json(line)

    @staticmethod
    def _read_json(path: Path) -> dict[str, Any]:
        if not path.exists():
            return {}
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {}
