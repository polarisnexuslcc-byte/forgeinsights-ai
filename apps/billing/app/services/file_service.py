import os
import re
import uuid
from pathlib import Path
from app.core.exceptions import InvalidFileError

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/markdown",
    "application/json",
}
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
UPLOAD_BASE_DIR = os.environ.get("UPLOAD_DIR", "/opt/stn/uploads")


class FileService:
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        name = re.sub(r"[^w-_.]", "_", filename)
        return name[:255]

    @staticmethod
    def validate_file(filename: str, size_bytes: int, mime_type: str = None) -> None:
        if size_bytes > MAX_FILE_SIZE_BYTES:
            raise InvalidFileError(f"File too large: {size_bytes} bytes (max {MAX_FILE_SIZE_BYTES})")
        if mime_type and mime_type not in ALLOWED_MIME_TYPES:
            raise InvalidFileError(f"File type not allowed: {mime_type}")

    @staticmethod
    def build_path(organization_id: str, filename: str) -> str:
        safe_name = FileService.sanitize_filename(filename)
        unique = str(uuid.uuid4())[:8]
        return os.path.join(UPLOAD_BASE_DIR, organization_id, f"{unique}_{safe_name}")

    @staticmethod
    def save_bytes(path: str, data: bytes) -> None:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as f:
            f.write(data)
