from fastapi import HTTPException
from starlette.status import (
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
    HTTP_409_CONFLICT,
    HTTP_422_UNPROCESSABLE_ENTITY,
    HTTP_429_TOO_MANY_REQUESTS,
)


class AppError(Exception):
    """Base application error."""
    def __init__(self, message: str, status_code: int = HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, HTTP_404_NOT_FOUND)


class PermissionDeniedError(AppError):
    def __init__(self, message: str = "Permission denied"):
        super().__init__(message, HTTP_403_FORBIDDEN)


class QuotaExceededError(AppError):
    def __init__(self, message: str = "Quota exceeded"):
        super().__init__(message, HTTP_429_TOO_MANY_REQUESTS)


class InvalidFileError(AppError):
    def __init__(self, message: str = "Invalid file"):
        super().__init__(message, HTTP_422_UNPROCESSABLE_ENTITY)


class ConflictError(AppError):
    def __init__(self, message: str = "Conflict"):
        super().__init__(message, HTTP_409_CONFLICT)
