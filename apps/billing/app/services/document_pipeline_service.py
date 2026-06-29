import logging
from sqlalchemy.orm import Session
from app.models.file import File

logger = logging.getLogger(__name__)


class DocumentPipelineService:
    @staticmethod
    def process_uploaded_file(db: Session, file: File) -> None:
        """Stub: Send file to document processing pipeline."""
        logger.info("Processing file %s for org %s", file.id, file.organization_id)
        # TODO: integrate with actual pipeline
        file.status = "processed"
        db.commit()

    @staticmethod
    def mark_processing_failed(db: Session, file: File, reason: str = None) -> None:
        """Mark a file as failed in the pipeline."""
        logger.error("File %s processing failed: %s", file.id, reason)
        file.status = "failed"
        db.commit()
