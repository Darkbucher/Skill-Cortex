"""
models/gap_snapshot.py — Point-in-time record of a student's skill gap.

Skill Levels update (Option B):
  Added level_gap_skills JSONB column to store skills where the student has
  the skill but at a level below the role's required minimum.

Schema:
  id, student_id, computed_at,
  missing_skills (JSONB array of skill-name strings),
  level_gap_skills (JSONB array of {skill, student_level, required_level} objects)

A new snapshot is written every time POST /students/{id}/gap is called.
Snapshots are append-only — never update an existing row, always insert a new
one. This preserves the full history needed for ProgressTimeline.jsx (Phase 4).
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class GapSnapshot(Base):
    __tablename__ = "gap_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # FK to the student this snapshot belongs to
    student_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # When the gap was calculated — used for the progress timeline x-axis
    computed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )

    # Skills the student doesn't have at all.
    # Example: ["React", "Docker"]
    missing_skills: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

    # Skills the student has but below the role's required minimum level.
    # Example: [{"skill": "Python", "student_level": "beginner", "required_level": "intermediate"}]
    level_gap_skills: Mapped[list] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
        server_default=text("'[]'::jsonb"),
    )

    def __repr__(self) -> str:
        return (
            f"<GapSnapshot id={self.id} student_id={self.student_id} "
            f"missing={len(self.missing_skills or [])} "
            f"level_gap={len(self.level_gap_skills or [])}>"
        )
