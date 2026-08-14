"""
alembic/env.py — Alembic migration environment.

Configured to:
  1. Load DATABASE_URL from .env via app/core/config.py (no hardcoded connection string)
  2. Import all SQLAlchemy models via app/models/__init__.py so autogenerate can detect them
  3. Use the same Base.metadata as the application models

When adding a new model:
  - Create the model file under app/models/
  - Add it to app/models/__init__.py
  - Run: alembic revision --autogenerate -m "describe what changed"
  - Review the generated migration before running: alembic upgrade head
"""

import sys
from pathlib import Path

# Add the backend/ directory to sys.path so `app.*` imports work
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# Load settings (reads .env)
from app.core.config import settings

# Import all models — this registers them on Base.metadata for autogenerate
import app.models  # noqa: F401

# Import Base so we can pass its metadata to Alembic
from app.core.db import Base

# Alembic Config object for .ini file values
config = context.config

# Set the DB URL from our settings (overrides anything in alembic.ini)
config.set_main_option("sqlalchemy.url", settings.database_url)

# Interpret the config file for Python logging if present
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata for autogenerate support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (no live DB connection needed)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (requires a live DB connection)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
