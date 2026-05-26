from __future__ import annotations

import asyncio
import logging
from pathlib import Path

import boto3
from app.services.storage.base import StoredRunArtifacts
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


class S3RunStorageBackend:
    """Upload completed run artifacts to S3-compatible object storage."""

    def __init__(
        self,
        *,
        bucket: str,
        region: str = "us-east-1",
        access_key_id: str | None = None,
        secret_access_key: str | None = None,
    ) -> None:
        self.bucket = bucket
        self._prefix = "runs"
        session_kwargs: dict[str, str] = {"region_name": region}
        if access_key_id and secret_access_key:
            session_kwargs["aws_access_key_id"] = access_key_id
            session_kwargs["aws_secret_access_key"] = secret_access_key
        self._session = boto3.Session(**session_kwargs)

    def _client(self):
        return self._session.client("s3")

    def _object_key(self, run_id: str, artifact: str) -> str:
        suffix = "jsonl" if artifact == "jsonl" else "meta.json"
        return f"{self._prefix}/{run_id}/{run_id}.{suffix}"

    async def save_completed_run(self, run_id: str, jsonl_path: Path, metadata_path: Path) -> StoredRunArtifacts:
        jsonl_key = self._object_key(run_id, "jsonl")
        meta_key = self._object_key(run_id, "meta")

        def _upload() -> int:
            client = self._client()
            client.upload_file(str(jsonl_path), self.bucket, jsonl_key)
            if metadata_path.exists():
                client.upload_file(str(metadata_path), self.bucket, meta_key)
            head = client.head_object(Bucket=self.bucket, Key=jsonl_key)
            return int(head["ContentLength"])

        size_bytes = await asyncio.to_thread(_upload)
        jsonl_path.unlink(missing_ok=True)
        metadata_path.unlink(missing_ok=True)

        jsonl_uri = f"s3://{self.bucket}/{jsonl_key}"
        meta_uri = f"s3://{self.bucket}/{meta_key}"
        return StoredRunArtifacts(
            run_id=run_id,
            jsonl_uri=jsonl_uri,
            metadata_uri=meta_uri,
            size_bytes=size_bytes,
        )

    async def get_download_url(self, run_id: str) -> str | None:
        jsonl_key = self._object_key(run_id, "jsonl")

        def _presign() -> str | None:
            try:
                client = self._client()
                client.head_object(Bucket=self.bucket, Key=jsonl_key)
            except ClientError:
                return None
            return client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": jsonl_key},
                ExpiresIn=3600,
            )

        return await asyncio.to_thread(_presign)

    async def download_artifact(self, run_id: str, artifact: str) -> bytes:
        key = self._object_key(run_id, artifact)

        def _download() -> bytes:
            client = self._client()
            try:
                response = client.get_object(Bucket=self.bucket, Key=key)
            except ClientError as exc:
                raise FileNotFoundError(run_id) from exc
            return response["Body"].read()

        return await asyncio.to_thread(_download)

    async def delete_run(self, run_id: str) -> None:
        keys = [self._object_key(run_id, "jsonl"), self._object_key(run_id, "meta")]

        def _delete() -> None:
            client = self._client()
            for key in keys:
                try:
                    client.delete_object(Bucket=self.bucket, Key=key)
                except ClientError:
                    logger.debug("Failed to delete s3://%s/%s", self.bucket, key)

        await asyncio.to_thread(_delete)
