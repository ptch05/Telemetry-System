from __future__ import annotations

import zipfile
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response, StreamingResponse

from app.core.dependencies import get_state, require_run_id
from app.core.state import AppState
from app.schemas import RunDetail, RunSummary

router = APIRouter(prefix="/api/runs", tags=["runs"])


@router.get("", response_model=list[RunSummary])
async def list_runs(state: AppState = Depends(get_state)) -> list[RunSummary]:
    return await state.recorder.list_runs()


@router.get("/{run_id}", response_model=RunDetail)
async def get_run(run_id: str, state: AppState = Depends(get_state)) -> RunDetail:
    require_run_id(run_id)
    detail = await state.recorder.get_run(run_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return detail


@router.get("/{run_id}/download")
async def download_run(run_id: str, state: AppState = Depends(get_state)) -> StreamingResponse:
    require_run_id(run_id)
    detail = await state.recorder.get_run(run_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Run not found")

    try:
        jsonl_bytes = await state.recorder.download_artifact(run_id, "jsonl")
        meta_bytes = await state.recorder.download_artifact(run_id, "meta")
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Run not found") from exc

    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(f"{run_id}.jsonl", jsonl_bytes)
        archive.writestr(f"{run_id}.meta.json", meta_bytes)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{run_id}.zip"'},
    )


@router.get("/{run_id}/jsonl")
async def download_jsonl(run_id: str, state: AppState = Depends(get_state)) -> Response:
    require_run_id(run_id)
    detail = await state.recorder.get_run(run_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Run not found")

    try:
        content = await state.recorder.download_artifact(run_id, "jsonl")
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Run not found") from exc

    return Response(
        content=content,
        media_type="application/x-ndjson",
        headers={"Content-Disposition": f'attachment; filename="{run_id}.jsonl"'},
    )
