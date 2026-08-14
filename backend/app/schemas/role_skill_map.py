"""
schemas/role_skill_map.py — Pydantic request/response models for RoleSkillMap.

Skill Levels update (Option B):
  required_skills is now list[RoleSkillEntry] where each entry carries
  the minimum proficiency level a student must have for that skill.
  Level ordering: beginner < intermediate < advanced
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


SKILL_MIN_LEVELS = Literal["beginner", "intermediate", "advanced"]


class RoleSkillEntry(BaseModel):
    """A skill required for a role, annotated with the minimum acceptable level."""

    skill: str = Field(..., description="Skill name, e.g. 'Python'")
    min_level: SKILL_MIN_LEVELS = Field(
        "intermediate",
        description="Minimum level the student must have for this skill",
    )


class RoleSkillMapBase(BaseModel):
    role_name: str = Field(..., max_length=255, description="e.g. 'SDE', 'Data Analyst'")
    required_skills: list[RoleSkillEntry] = Field(
        default_factory=list,
        description="Skills required for this role, each with a minimum level",
    )
    source: str | None = Field(None, description="Where this skill list came from, e.g. 'recruiter JD 2024'")


class RoleSkillMapCreate(RoleSkillMapBase):
    pass


class RoleSkillMapUpdate(BaseModel):
    """Partial update — all fields optional."""
    role_name: str | None = Field(None, max_length=255)
    required_skills: list[RoleSkillEntry] | None = None
    source: str | None = None


class RoleSkillMapRead(RoleSkillMapBase):
    """Response model — includes server-assigned fields."""
    id: int
    last_updated: datetime

    model_config = {"from_attributes": True}
