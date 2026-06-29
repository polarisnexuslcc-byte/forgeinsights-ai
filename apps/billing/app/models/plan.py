import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    max_users: Mapped[int] = mapped_column(Integer, default=5)
    max_files: Mapped[int] = mapped_column(Integer, default=10)
    max_storage_bytes: Mapped[int] = mapped_column(Integer, default=104857600)
    max_storage_mb: Mapped[int] = mapped_column(Integer, default=100)
    base_questions_per_month: Mapped[int] = mapped_column(Integer, default=500)
    max_questions_month: Mapped[int] = mapped_column(Integer, default=500)
    extra_questions_pack: Mapped[int] = mapped_column(Integer, default=0)
    is_extra_pack: Mapped[bool] = mapped_column(Boolean, default=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
