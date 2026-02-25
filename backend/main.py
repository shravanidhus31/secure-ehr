from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.routes import auth, records, access, audit, users

# Auto-create all DB tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Secure EHR API",
    description="Electronic Health Records with Hybrid Cryptography",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(records.router)
app.include_router(access.router)
app.include_router(audit.router)
app.include_router(users.router)


@app.get("/")
def root():
    return {"message": "Secure EHR API is running", "env": settings.APP_ENV}

@app.get("/health")
def health():
    return {"status": "ok"}