"""File storage utility — Vercel Blob when configured, local disk otherwise.

Local disk is ephemeral on Vercel (only /tmp is writable, and it is not shared
across serverless instances), so BLOB_READ_WRITE_TOKEN must be set in any
deployed environment. The local-disk path only exists for running the backend
outside Vercel without provisioning a Blob store.
"""

import logging
import mimetypes
import os
import uuid
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

BLOB_API_URL = "https://blob.vercel-storage.com"
BLOB_API_VERSION = "7"


class FileStorage:
    """Handles saving, reading, and deleting uploaded document files."""

    @staticmethod
    def _use_blob() -> bool:
        return bool(settings.BLOB_READ_WRITE_TOKEN)

    @staticmethod
    def _base_upload_dir() -> str:
        """Resolve writable upload dir for current runtime (local-disk fallback only)."""
        if os.getenv("VERCEL") == "1":
            return os.path.join("/tmp", settings.UPLOAD_DIR)
        return settings.UPLOAD_DIR

    @staticmethod
    def get_upload_dir(user_id: str) -> str:
        """Get the local upload directory for a user, creating it if needed."""
        upload_dir = os.path.join(FileStorage._base_upload_dir(), user_id)
        os.makedirs(upload_dir, exist_ok=True)
        return upload_dir

    @staticmethod
    async def save_file(content: bytes, user_id: str, filename: str) -> str:
        """Save a file and return a reference to it (a Blob URL, or a local path)."""
        ext = os.path.splitext(filename)[1].lower()
        stored_name = f"{uuid.uuid4()}{ext}"

        if FileStorage._use_blob():
            pathname = f"{user_id}/{stored_name}"
            content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.put(
                    f"{BLOB_API_URL}/{pathname}",
                    content=content,
                    headers={
                        "authorization": f"Bearer {settings.BLOB_READ_WRITE_TOKEN}",
                        "x-api-version": BLOB_API_VERSION,
                        "x-content-type": content_type,
                    },
                )
                response.raise_for_status()
                return response.json()["url"]

        upload_dir = FileStorage.get_upload_dir(user_id)
        file_path = os.path.join(upload_dir, stored_name)
        with open(file_path, "wb") as f:
            f.write(content)
        return file_path

    @staticmethod
    async def read_file(file_ref: str) -> Optional[bytes]:
        """Read a file's bytes given its stored reference (Blob URL or local path)."""
        if file_ref.startswith("http://") or file_ref.startswith("https://"):
            async with httpx.AsyncClient(timeout=60.0) as client:
                try:
                    response = await client.get(file_ref)
                    response.raise_for_status()
                    return response.content
                except httpx.HTTPError as e:
                    logger.warning(f"Failed to fetch blob {file_ref}: {e}")
                    return None

        if not os.path.exists(file_ref):
            return None
        with open(file_ref, "rb") as f:
            return f.read()

    @staticmethod
    async def delete_file(file_ref: str) -> bool:
        """Delete a file given its stored reference (Blob URL or local path)."""
        if file_ref.startswith("http://") or file_ref.startswith("https://"):
            if not FileStorage._use_blob():
                return False
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{BLOB_API_URL}/delete",
                    json={"urls": [file_ref]},
                    headers={
                        "authorization": f"Bearer {settings.BLOB_READ_WRITE_TOKEN}",
                        "x-api-version": BLOB_API_VERSION,
                    },
                )
                response.raise_for_status()
                return True

        if os.path.exists(file_ref):
            os.remove(file_ref)
            return True
        return False
