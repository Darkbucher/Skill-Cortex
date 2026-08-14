"""
models/role_skill_map.py — Target skill list per placement role.

Schema per Architecture.md §4:
  id, role_name, required_skills (JSONB array), source, last_updated

This table is admin-maintained — see PRD §8 / Architecture.md §4.
The gap engine does: required_skills − student.skills (set difference in SQL).
"""

from datetime import datetime

from sqlalchemy import DateTime, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class RoleSkillMap(Base):
    __tablename__ = "role_skill_map"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Human-readable role name, e.g. "SDE", "Data Analyst", "Product Manager"
    role_name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)

    # List of skill-name strings required for this role.
    # Example: ["Python", "SQL", "React", "Docker", "Git"]
    required_skills: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

    # Where this skill list came from (e.g., "recruiter JD 2024", "industry template")
    source: Mapped[str | None] = mapped_column(Text, nullable=True)

    last_updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
        onupdate=datetime.utcnow,
    )

    def __repr__(self) -> str:
        return f"<RoleSkillMap id={self.id} role={self.role_name!r}>"
