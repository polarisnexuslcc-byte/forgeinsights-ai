import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class UsageMonthly(Base):
    """Monthly usage tracking per organization (SQLite-compatible, no PostgreSQL UUID)."""
    __tablename__ = "usage_monthly"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    # No ForeignKey constraint - SQLite compatibility
    organization_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    questions_used: Mapped[int] = mapped_column(Integer, default=0)
    files_count: Mapped[int] = mapped_column(Integer, default=0)
    storage_bytes: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
