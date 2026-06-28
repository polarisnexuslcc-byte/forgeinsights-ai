from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.usage import router as usage_router
from app.api.extras import router as extras_router
from app.api.questions import router as questions_router
from app.api.files import router as files_router

app = FastAPI(
    title="StarTheNode Billing API",
    description="Usage limits, quota management, file handling and billing events.",
    version="0.1.0",
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(usage_router)
app.include_router(extras_router)
app.include_router(questions_router)
app.include_router(files_router)


# ---------------------------------------------------------------------------
# Global error handler — converts unhandled ValueError to 400
# ---------------------------------------------------------------------------
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"detail": str(exc)})


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok"}
