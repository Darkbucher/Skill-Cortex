"""
models/roadmap.py — Roadmap draft/approval table.

Schema per Architecture.md §4:
  id, student_id, mentor_id, draft_text, status, created_at, approved_at

Rules.md §1 non-negotiables:
  - status starts as 'draft' always.
  - Only POST /mentors/roadmaps/{id}/approve (mentor-only) may flip status to 'approved'.
  - No LLM output may reach a student directly — that gate is enforced in Phase 7.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Roadmap(Base):
    __tablename__ = "roadmaps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # The student this roadmap is written for
    student_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # The mentor (stored as their student row id) who created/approved this roadmap.
    # Nullable: a roadmap may be created by an admin with no student row.
    mentor_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("students.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Free-text roadmap content written by the mentor.
    draft_text: Mapped[str] = mapped_column(Text, nullable=False)

    # Lifecycle status:
    #   draft    — written, not yet reviewed after creation
    #   edited   — mentor has updated the text at least once since creation
    #   approved — mentor has approved; student may now see it
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="draft", server_default="draft"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )

    # Set when status is flipped to 'approved'
    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    def __repr__(self) -> str:
        return (
            f"<Roadmap id={self.id} student_id={self.student_id} "
            f"status={self.status!r}>"
        )
