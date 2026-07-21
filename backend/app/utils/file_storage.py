"""File storage utility — local disk (dev) or Vercel Blob (prod, persistent across invocations)."""

import asyncio
import os
import uuid
from typing import Optional

import httpx

from app.core.config import settings


class FileStorage:
    """Handles saving, reading, and deleting uploaded files."""

    @staticmethod
    def _use_blob() -> bool:
        return settings.STORAGE_BACKEND == "vercel_blob"

    @staticmethod
    def is_remote_url(file_ref: str) -> bool:
        return file_ref.startswith("http://") or file_ref.startswith("https://")

    @staticmethod
    def _local_base_upload_dir() -> str:
        """Resolve writable upload dir for current runtime."""
        # Vercel serverless filesystem is read-only except /tmp
        if os.getenv("VERCEL") == "1":
            return os.path.join("/tmp", settings.UPLOAD_DIR)
        return settings.UPLOAD_DIR

    @staticmethod
    def _local_upload_dir(user_id: str) -> str:
        upload_dir = os.path.join(FileStorage._local_base_upload_dir(), user_id)
        os.makedirs(upload_dir, exist_ok=True)
        return upload_dir

    @staticmethod
    async def save_file(content: bytes, user_id: str, filename: str) -> str:
        """Save a file and return a reference to it (local path, or a Vercel Blob URL)."""
        ext = os.path.splitext(filename)[1].lower()
        stored_name = f"{user_id}/{uuid.uuid4()}{ext}"

        if FileStorage._use_blob():
            if not settings.BLOB_READ_WRITE_TOKEN:
                raise RuntimeError(
                    "BLOB_READ_WRITE_TOKEN is not configured but STORAGE_BACKEND=vercel_blob."
                )
            import vercel_blob

            def _put() -> dict:
                return vercel_blob.put(stored_name, content, {"addRandomSuffix": "false"})

            result = await asyncio.to_thread(_put)
            return result["url"]

        upload_dir = FileStorage._local_upload_dir(user_id)
        file_path = os.path.join(upload_dir, os.path.basename(stored_name))
        with open(file_path, "wb") as f:
            f.write(content)
        return file_path

    @staticmethod
    async def read_file(file_ref: str) -> Optional[bytes]:
        """Read a file's bytes from local storage or a Vercel Blob URL."""
        if FileStorage.is_remote_url(file_ref):
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.get(file_ref)
                if resp.status_code == 404:
                    return None
                resp.raise_for_status()
                return resp.content
        if not os.path.exists(file_ref):
            return None
        with open(file_ref, "rb") as f:
            return f.read()

    @staticmethod
    async def delete_file(file_ref: str) -> bool:
        """Delete a file from local storage or Vercel Blob."""
        if FileStorage.is_remote_url(file_ref):
            if not settings.BLOB_READ_WRITE_TOKEN:
                return False
            import vercel_blob

            await asyncio.to_thread(vercel_blob.delete, [file_ref])
            return True
        if os.path.exists(file_ref):
            os.remove(file_ref)
            return True
        return False
