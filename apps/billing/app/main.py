from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException
from app.core.exceptions import AppError
from app.core.error_handlers import (
    app_error_handler,
    http_exception_handler,
    validation_exception_handler,
    unhandled_exception_handler,
)

from app.api.usage import router as usage_router
from app.api.extras import router as extras_router
from app.api.questions import router as questions_router
from app.api.files import router as files_router
from app.api.billing import router as billing_router
from app.api.admin_billing import router as admin_billing_router
from app.api.admin_org import router as admin_org_router

app = FastAPI(title="StarTheNode Billing Service", version="0.4.0")

app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(usage_router)
app.include_router(extras_router)
app.include_router(questions_router)
app.include_router(files_router)
app.include_router(billing_router)
app.include_router(admin_billing_router)
app.include_router(admin_org_router)


@app.get("/health")
def health():
    return {"status": "ok", "version": "0.4.0"}
