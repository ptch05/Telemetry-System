from __future__ import annotations

import zipfile
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, StreamingResponse

from app.core.config import settings
from app.core.dependencies import get_state, require_run_id
from app.core.state import AppState
from app.schemas import RunDetail, RunSummary
from app.utils.run_id import resolve_run_paths

router = APIRouter(prefix="/api/runs", tags=["runs"])


@router.get("", response_model=list[RunSummary])
def list_runs(state: AppState = Depends(get_state)) -> list[RunSummary]:
    return state.recorder.list_runs()


@router.get("/{run_id}", response_model=RunDetail)
def get_run(run_id: str, state: AppState = Depends(get_state)) -> RunDetail:
    require_run_id(run_id)
    detail = state.recorder.get_run(run_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return detail


@router.get("/{run_id}/download")
def download_run(run_id: str, state: AppState = Depends(get_state)) -> StreamingResponse:
    require_run_id(run_id)
    jsonl_path, meta_path = resolve_run_paths(settings.run_data_dir.resolve(), run_id)
    if not jsonl_path.exists():
        raise HTTPException(status_code=404, detail="Run not found")

    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.write(jsonl_path, arcname=jsonl_path.name)
        if meta_path.exists():
            archive.write(meta_path, arcname=meta_path.name)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{run_id}.zip"'},
    )


@router.get("/{run_id}/jsonl")
def download_jsonl(run_id: str, state: AppState = Depends(get_state)) -> FileResponse:
    require_run_id(run_id)
    jsonl_path, _ = resolve_run_paths(settings.run_data_dir.resolve(), run_id)
    if not jsonl_path.exists():
        raise HTTPException(status_code=404, detail="Run not found")
    return FileResponse(jsonl_path, media_type="application/x-ndjson", filename=jsonl_path.name)
