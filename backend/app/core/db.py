"""
core/db.py — Database engine, session factory, and FastAPI dependency.

Uses SQLAlchemy 2.x with a synchronous session (async can be added in a
future phase if performance requires it — flag before changing).
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


# ── Engine ────────────────────────────────────────────────────────────────
engine = create_engine(
    settings.database_url,
    # Echo SQL statements to stdout in development — set to False in prod
    echo=False,
    pool_pre_ping=True,  # Detect stale connections before using them
)

# ── Session factory ───────────────────────────────────────────────────────
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


# ── Declarative base for all SQLAlchemy models ───────────────────────────
class Base(DeclarativeBase):
    """All models inherit from this base. Imported in models/__init__.py."""
    pass


# ── FastAPI dependency ────────────────────────────────────────────────────
def get_db():
    """
    Yields a database session for the duration of a request, then closes it.

    Usage in route handlers:
        def my_route(db: Session = Depends(get_db)): ...
    """
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
