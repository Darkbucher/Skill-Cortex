"""
schemas/history.py — Pydantic schemas for gap snapshot history (Phase 4).

Skill Levels update (Option B):
  Added level_gap_skills so the ProgressTimeline can display level-gap
  evolution alongside fully-missing skill evolution over time.

Used by GET /students/{id}/gap/history to return chronological snapshot data
for the ProgressTimeline.jsx chart on the student dashboard.
"""

from datetime import datetime
from pydantic import BaseModel, Field


class LevelGapHistoryEntry(BaseModel):
    """A level-gap entry stored in a historical snapshot."""

    skill: str
    student_level: str
    required_level: str


class GapSnapshotHistoryRead(BaseModel):
    """A single point-in-time gap snapshot for the progress timeline."""

    id: int
    missing_skills: list[str]
    level_gap_skills: list[LevelGapHistoryEntry] = Field(
        default_factory=list,
        description="Skills the student had but below required level at this point in time",
    )
    computed_at: datetime

    model_config = {"from_attributes": True}
