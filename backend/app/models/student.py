"""
models/student.py — Student profile table.

Schema per Architecture.md §4:
  id, name, email, year, target_role_id, skills (JSONB), created_at

Note: skills is stored as JSONB (list of skill-name strings) for fast
set-difference queries in the gap engine. Do not change to a join table
without updating gap_engine.py and flagging in Memory.md + Architecture.md.
"""

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Populated from Google OAuth profile on first login — no manual signup form
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)

    # Academic year (1–4 for undergrad)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # FK to role_skill_map.id — the role the student is targeting
    target_role_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("role_skill_map.id", ondelete="SET NULL"), nullable=True
    )

    # List of skill-name strings the student currently has.
    # Example: ["Python", "SQL", "React"]
    # JSONB allows efficient overlap/containment queries for the gap engine.
    skills: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )

    def __repr__(self) -> str:
        return f"<Student id={self.id} email={self.email!r}>"
