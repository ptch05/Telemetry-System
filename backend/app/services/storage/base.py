from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Protocol


@dataclass(frozen=True, slots=True)
class StoredRunArtifacts:
    run_id: str
    jsonl_uri: str
    metadata_uri: str
    size_bytes: int


class RunStorageBackend(Protocol):
    async def save_completed_run(self, run_id: str, jsonl_path: Path, metadata_path: Path) -> StoredRunArtifacts: ...

    async def get_download_url(self, run_id: str) -> str | None: ...

    async def download_artifact(self, run_id: str, artifact: str) -> bytes: ...

    async def delete_run(self, run_id: str) -> None: ...
