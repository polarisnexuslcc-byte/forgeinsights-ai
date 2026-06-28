import uuid
from sqlalchemy import String, Integer, BigInteger, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class UsageMonthly(Base):
    __tablename__ = "usage_monthly"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "period_key",
            name="uq_usage_monthly_org_period",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Format: "YYYY-MM"
    period_key: Mapped[str] = mapped_column(String(7), nullable=False)

    base_questions_used: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    extra_questions_used: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    files_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    storage_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)

    created_at: Mapped = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<UsageMonthly org={self.organization_id} period={self.period_key}>"
