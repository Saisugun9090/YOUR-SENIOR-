from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.middleware.auth import APIKeyMiddleware
from app.routers import admin, health, ingest, query

settings = get_settings()

app = FastAPI(
    title="Your Senior",
    description=(
        "AI-powered RAG agent that reads your company's internal documents "
        "and answers questions like a trusted senior employee."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS must be registered before the auth middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(APIKeyMiddleware)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(health.router)
app.include_router(query.router)
app.include_router(ingest.router)
app.include_router(admin.router)


@app.get("/", include_in_schema=False)
async def root():
    return {
        "app": "Your Senior",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }
