"""
main.py — FastAPI application entrypoint.

Responsibilities:
  - Create the FastAPI app instance
  - Configure CORS (restricted to FRONTEND_ORIGIN from .env)
  - Register all API routers
  - Expose the /health endpoint

To run:
  cd backend
  uvicorn app.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api import students, admin, mentors, roadmaps, auth

# ── App instance ──────────────────────────────────────────────────────────
app = FastAPI(
    title="SkillCortex API",
    description=(
        "AI-Driven Placement & Mentorship Engine — "
        "deterministic skill-gap diagnosis for college placement cells."
    ),
    version="0.1.0",
    # Disable default /docs and /redoc in production (add env flag later)
)

# ── CORS ──────────────────────────────────────────────────────────────────
# Build the allowed origins list. In dev we accept both localhost and
# 127.0.0.1 variants so Vite / browser fetch never hits a CORS block.
_primary = settings.frontend_origin.rstrip("/")
_dev_origins: list[str] = list({
    _primary,
    _primary.replace("localhost", "127.0.0.1"),
    _primary.replace("127.0.0.1", "localhost"),
})

app.add_middleware(
    CORSMiddleware,
    allow_origins=_dev_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(admin.router)
app.include_router(mentors.router)
app.include_router(roadmaps.router)


# ── Health check ─────────────────────────────────────────────────────────
@app.get("/health", tags=["meta"])
async def health_check():
    """
    Phase 0 Done-When criterion: this endpoint must return HTTP 200.
    Used by tests and future deployment health checks.
    """
    return {"status": "ok"}
