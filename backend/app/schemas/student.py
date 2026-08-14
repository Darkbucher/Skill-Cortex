"""
schemas/student.py — Pydantic request/response models for the Student resource.

Skill levels update (Option B):
  skills is now list[SkillEntry] where each entry carries a level.
  Level ordering: beginner < intermediate < advanced
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


SKILL_LEVELS = Literal["beginner", "intermediate", "advanced"]


class SkillEntry(BaseModel):
    """A skill the student currently has, annotated with their self-assessed level."""

    skill: str = Field(..., description="Skill name, e.g. 'Python'")
    level: SKILL_LEVELS = Field("beginner", description="Student's current level for this skill")


class StudentBase(BaseModel):
    name: str = Field(..., max_length=255)
    year: int | None = Field(None, ge=1, le=4, description="Academic year (1–4)")
    target_role_id: int | None = None
    skills: list[SkillEntry] = Field(
        default_factory=list,
        description="Skills the student currently has, each with a level",
    )


class StudentCreate(StudentBase):
    """Used internally at first-login provisioning — email comes from Google profile."""

    email: EmailStr


class StudentUpdate(BaseModel):
    """Partial update — all fields optional."""

    name: str | None = Field(None, max_length=255)
    year: int | None = Field(None, ge=1, le=4)
    target_role_id: int | None = None
    skills: list[SkillEntry] | None = None


class StudentRead(StudentBase):
    """Response model — includes server-assigned fields."""

    id: int
    email: EmailStr
    created_at: datetime

    model_config = {"from_attributes": True}
