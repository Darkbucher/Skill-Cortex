"""
models/__init__.py — Import all models here so Alembic's env.py can
discover them via a single import of this package.

Add every new model to this file when you create it.
"""

from app.models.student import Student  # noqa: F401
from app.models.role_skill_map import RoleSkillMap  # noqa: F401
from app.models.gap_snapshot import GapSnapshot  # noqa: F401
from app.models.role_allowlist import RoleAllowlist  # noqa: F401
from app.models.roadmap import Roadmap  # noqa: F401
