"""Local file storage utility. Swap for S3 in production."""

import os
import uuid
from typing import Optional

from app.core.config import settings


class FileStorage:
    """Handles saving and retrieving files from local storage."""

    @staticmethod
    def _base_upload_dir() -> str:
        """Resolve writable upload dir for current runtime."""
        # Vercel serverless filesystem is read-only except /tmp
        if os.getenv("VERCEL") == "1":
            return os.path.join("/tmp", settings.UPLOAD_DIR)
        return settings.UPLOAD_DIR

    @staticmethod
    def get_upload_dir(user_id: str) -> str:
        """Get the upload directory for a user, creating it if needed."""
        upload_dir = os.path.join(FileStorage._base_upload_dir(), user_id)
        os.makedirs(upload_dir, exist_ok=True)
        return upload_dir

    @staticmethod
    def save_file(content: bytes, user_id: str, filename: str) -> str:
        """Save a file and return its path."""
        upload_dir = FileStorage.get_upload_dir(user_id)
        ext = os.path.splitext(filename)[1].lower()
        stored_name = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(upload_dir, stored_name)

        with open(file_path, "wb") as f:
            f.write(content)

        return file_path

    @staticmethod
    def read_file(file_path: str) -> Optional[bytes]:
        """Read a file from storage."""
        if not os.path.exists(file_path):
            return None
        with open(file_path, "rb") as f:
            return f.read()

    @staticmethod
    def delete_file(file_path: str) -> bool:
        """Delete a file from storage."""
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
