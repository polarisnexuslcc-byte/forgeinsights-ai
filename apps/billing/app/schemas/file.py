from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class FileUploadResponse(BaseModel):
    id: str
    filename: str
    size_bytes: int
    mime_type: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class FileListItem(BaseModel):
    id: str
    filename: str
    size_bytes: int
    mime_type: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class FileListResponse(BaseModel):
    items: List[FileListItem]
    total: int


class FileDeleteResponse(BaseModel):
    success: bool
    file_id: str
