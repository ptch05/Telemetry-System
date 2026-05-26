from __future__ import annotations

import shutil
from pathlib import Path

from app.services.storage.base import StoredRunArtifacts
from app.utils.run_id import resolve_run_paths


class LocalRunStorageBackend:
    """Persist completed runs on the local filesystem."""

    def __init__(self, runs_dir: Path) -> None:
        self.runs_dir = runs_dir.resolve()
        self.runs_dir.mkdir(parents=True, exist_ok=True)

    async def save_completed_run(self, run_id: str, jsonl_path: Path, metadata_path: Path) -> StoredRunArtifacts:
        dest_jsonl, dest_meta = resolve_run_paths(self.runs_dir, run_id)
        dest_jsonl.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(jsonl_path), dest_jsonl)
        if metadata_path.exists():
            shutil.move(str(metadata_path), dest_meta)
        size_bytes = dest_jsonl.stat().st_size if dest_jsonl.exists() else 0
        return StoredRunArtifacts(
            run_id=run_id,
            jsonl_uri=str(dest_jsonl),
            metadata_uri=str(dest_meta),
            size_bytes=size_bytes,
        )

    async def get_download_url(self, run_id: str) -> str | None:
        jsonl_path, _ = resolve_run_paths(self.runs_dir, run_id)
        if jsonl_path.exists():
            return str(jsonl_path)
        return None

    async def download_artifact(self, run_id: str, artifact: str) -> bytes:
        jsonl_path, meta_path = resolve_run_paths(self.runs_dir, run_id)
        path = jsonl_path if artifact == "jsonl" else meta_path
        if not path.exists():
            raise FileNotFoundError(run_id)
        return path.read_bytes()

    async def delete_run(self, run_id: str) -> None:
        jsonl_path, meta_path = resolve_run_paths(self.runs_dir, run_id)
        if jsonl_path.exists():
            jsonl_path.unlink()
        if meta_path.exists():
            meta_path.unlink()
