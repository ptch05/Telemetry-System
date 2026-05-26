from __future__ import annotations

from app.core.config import Settings
from app.services.storage.base import RunStorageBackend, StoredRunArtifacts
from app.services.storage.local import LocalRunStorageBackend
from app.services.storage.s3 import S3RunStorageBackend

__all__ = [
    "LocalRunStorageBackend",
    "RunStorageBackend",
    "S3RunStorageBackend",
    "StoredRunArtifacts",
    "build_storage_backend",
]


def build_storage_backend(cfg: Settings) -> RunStorageBackend:
    if cfg.storage_backend == "s3":
        if not cfg.s3_bucket:
            raise ValueError("S3_BUCKET is required when STORAGE_BACKEND=s3")
        return S3RunStorageBackend(
            bucket=cfg.s3_bucket,
            region=cfg.aws_region,
            access_key_id=cfg.aws_access_key_id,
            secret_access_key=cfg.aws_secret_access_key,
        )
    return LocalRunStorageBackend(cfg.run_data_dir.resolve())
