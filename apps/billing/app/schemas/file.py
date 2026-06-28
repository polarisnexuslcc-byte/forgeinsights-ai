from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class FileUploadResponse(BaseModel):
    id: UUID
    filename: str
    mime_type: str
    size_bytes: int
    storage_path: str
    processing_status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class FileDeleteResponse(BaseModel):
    success: bool
    file_id: UUID


class FileListItem(BaseModel):
    id: UUID
    filename: str
    mime_type: str
    size_bytes: int
    processing_status: str
    created_at: datetime

    model_config = {"from_attributes": True}
