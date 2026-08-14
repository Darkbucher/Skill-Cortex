"""
schemas/gap.py — Pydantic schemas for the gap engine (Phase 3+).

Skill Levels update (Option B):
  GapBreakdownRead now returns three buckets:
    missing_skills    — student doesn't have the skill at all
    level_gap_skills  — student has the skill but at a level below the required min
    acquired_skills   — student has the skill at or above the required level ✅

Phase 4 note: GapSnapshotHistoryRead lives in schemas/history.py;
HeatmapSkill / HeatmapRoleAggregate live in schemas/heatmap.py.
Both are re-exported here to avoid breaking existing imports.
"""

from datetime import datetime

from pydantic import BaseModel, Field

# Re-exports from their canonical modules (Phase 4 split)
from app.schemas.history import GapSnapshotHistoryRead  # noqa: F401
from app.schemas.heatmap import HeatmapSkill, HeatmapRoleAggregate  # noqa: F401


class LevelGapEntry(BaseModel):
    """A skill the student has, but not at the required minimum level."""

    skill: str
    student_level: str = Field(..., description="The level the student currently has")
    required_level: str = Field(..., description="The minimum level the role requires")


class GapBreakdownRead(BaseModel):
    """Response body for POST /students/{id}/gap."""

    student_id: int
    missing_skills: list[str] = Field(
        default_factory=list,
        description="Skills the student does not have at all",
    )
    level_gap_skills: list[LevelGapEntry] = Field(
        default_factory=list,
        description="Skills the student has but below the required level",
    )
    acquired_skills: list[str] = Field(
        default_factory=list,
        description="Skills the student has at or above the required level",
    )
    computed_at: datetime

    model_config = {"from_attributes": True}
