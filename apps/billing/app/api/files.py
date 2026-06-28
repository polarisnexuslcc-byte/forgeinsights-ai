import uuid
from pathlib import Path
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File as FastAPIFile,
    BackgroundTasks,
)
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.core.database import get_db
from app.deps.auth import get_current_context, CurrentContext
from app.models.file import File
from app.schemas.file import FileUploadResponse, FileDeleteResponse, FileListItem
from app.services.usage_service import UsageService

router = APIRouter(prefix="/api/org/me/files", tags=["files"])

UPLOAD_ROOT = Path("storage/uploads")
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB


def process_file_background(file_id: str) -> None:
    """
    Placeholder for async file processing (extraction, chunking, embedding).
    Replace with a Celery task or direct AI pipeline call.
    """
    pass


@router.get("", response_model=list[FileListItem])
def list_files(
    ctx: CurrentContext = Depends(get_current_context),
    db: Session = Depends(get_db),
):
    """Lists all files belonging to the organization, newest first."""
    stmt = (
        select(File)
        .where(File.organization_id == ctx.organization_id)
        .order_by(File.created_at.desc())
    )
    return list(db.execute(stmt).scalars().all())


@router.post("/upload", response_model=FileUploadResponse, status_code=201)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = FastAPIFile(...),
    ctx: CurrentContext = Depends(get_current_context),
    db: Session = Depends(get_db),
):
    """
    Upload a single file for the authenticated organization.

    Validates:
    - File name present
    - MIME type is in the allow-list
    - File is not empty
    - File does not exceed 25 MB
    - Organization is within plan file-count and storage limits

    After saving, triggers background processing and recalculates usage counters.
    """
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="Missing file name")

        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type. Allowed: PDF, TXT, CSV, DOCX",
            )

        content = await file.read()
        size_bytes = len(content)

        if size_bytes <= 0:
            raise HTTPException(status_code=400, detail="Empty file")

        if size_bytes > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail="File too large (max 25 MB)",
            )

        # Check quota before touching disk
        UsageService.ensure_can_upload(
            db, ctx.organization_id, incoming_size_bytes=size_bytes
        )

        # Write to disk
        suffix = Path(file.filename).suffix
        disk_name = str(uuid.uuid4()) + suffix
        org_dir = UPLOAD_ROOT / str(ctx.organization_id)
        org_dir.mkdir(parents=True, exist_ok=True)
        storage_path = org_dir / disk_name

        with open(storage_path, "wb") as f:
            f.write(content)

        # Persist DB record
        db_file = File(
            organization_id=ctx.organization_id,
            uploaded_by_user_id=ctx.user_id,
            filename=file.filename,
            mime_type=file.content_type or "application/octet-stream",
            size_bytes=size_bytes,
            storage_path=str(storage_path),
            processing_status="pending",
        )
        db.add(db_file)
        db.flush()

        # Recalculate usage from source of truth (avoids counter drift)
        UsageService.recalc_file_usage(db, ctx.organization_id)
        db.commit()
        db.refresh(db_file)

        background_tasks.add_task(process_file_background, str(db_file.id))

        return FileUploadResponse(
            id=db_file.id,
            filename=db_file.filename,
            mime_type=db_file.mime_type,
            size_bytes=db_file.size_bytes,
            storage_path=db_file.storage_path,
            processing_status=db_file.processing_status,
            created_at=db_file.created_at,
        )

    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


@router.delete("/{file_id}", response_model=FileDeleteResponse)
def delete_file(
    file_id: uuid.UUID,
    ctx: CurrentContext = Depends(get_current_context),
    db: Session = Depends(get_db),
):
    """
    Permanently deletes a file and its on-disk data.
    Recalculates usage counters from source of truth after deletion.
    Only the owning organization can delete its files.
    """
    try:
        stmt = select(File).where(
            File.id == file_id,
            File.organization_id == ctx.organization_id,
        )
        db_file = db.execute(stmt).scalar_one_or_none()

        if not db_file:
            raise HTTPException(status_code=404, detail="File not found")

        # Remove from disk
        path = Path(db_file.storage_path)
        if path.exists():
            path.unlink()

        db.delete(db_file)
        db.flush()

        UsageService.recalc_file_usage(db, ctx.organization_id)
        db.commit()

        return FileDeleteResponse(success=True, file_id=file_id)

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise
