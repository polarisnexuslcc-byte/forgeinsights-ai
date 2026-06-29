from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.sql import func
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, index=True)
    email = Column(String(256), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    full_name = Column(String(256), nullable=True)
    is_active = Column(Integer, nullable=False, default=1)
    is_superuser = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
