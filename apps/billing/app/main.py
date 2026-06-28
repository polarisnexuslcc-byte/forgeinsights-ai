from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.usage import router as usage_router
from app.api.extras import router as extras_router
from app.api.questions import router as questions_router
from app.api.files import router as files_router
from app.api.billing import router as billing_router
from app.api.admin_billing import router as admin_billing_router
from app.api.admin_org import router as admin_org_router

app = FastAPI(title="StarTheNode Billing Service", version="0.3.0")


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


app.include_router(usage_router)
app.include_router(extras_router)
app.include_router(questions_router)
app.include_router(files_router)
app.include_router(billing_router)
app.include_router(admin_billing_router)
app.include_router(admin_org_router)


@app.get("/health")
def health():
    return {"status": "ok", "version": "0.3.0"}
