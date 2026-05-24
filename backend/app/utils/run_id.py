from __future__ import annotations

import re
from pathlib import Path

RUN_ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$")


def validate_run_id(run_id: str) -> str:
    """Reject run IDs that could escape the runs directory."""
    if not RUN_ID_PATTERN.fullmatch(run_id):
        raise ValueError("Invalid run ID")
    if ".." in run_id or "/" in run_id or "\\" in run_id:
        raise ValueError("Invalid run ID")
    return run_id


def resolve_run_paths(recording_dir: Path, run_id: str) -> tuple[Path, Path]:
    """Return (jsonl_path, meta_path) after validating run_id."""
    safe_id = validate_run_id(run_id)
    jsonl_path = (recording_dir / f"{safe_id}.jsonl").resolve()
    meta_path = (recording_dir / f"{safe_id}.meta.json").resolve()
    base = recording_dir.resolve()
    if not str(jsonl_path).startswith(str(base)) or not str(meta_path).startswith(str(base)):
        raise ValueError("Invalid run ID")
    return jsonl_path, meta_path
