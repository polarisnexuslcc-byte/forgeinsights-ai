import os
from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:////opt/stn/apps/billing/billing.db"
    WEBHOOK_SECRET: str = "change-this-secret"
    DEBUG: bool = False
    APP_NAME: str = "StarTheNode Billing"
    APP_VERSION: str = "0.4.0"

    # Plan limits
    BASIC_FILE_LIMIT: int = 10
    BASIC_STORAGE_MB: int = 100
    BASIC_QUESTIONS_MONTH: int = 500
    MEDIUM_FILE_LIMIT: int = 50
    MEDIUM_STORAGE_MB: int = 500
    MEDIUM_QUESTIONS_MONTH: int = 2000
    ENTERPRISE_FILE_LIMIT: int = 500
    ENTERPRISE_STORAGE_MB: int = 5000
    ENTERPRISE_QUESTIONS_MONTH: int = 20000

    class Config:
        env_file = ".env"
        extra = "ignore"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
