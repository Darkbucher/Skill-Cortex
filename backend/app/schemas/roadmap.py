"""
schemas/roadmap.py — Pydantic schemas for the Roadmap resource.

Used by:
  POST /mentors/students/{student_id}/roadmap  → RoadmapCreate in, RoadmapRead out
  GET  /mentors/students/{student_id}/roadmap  → RoadmapRead out
  PUT  /mentors/roadmaps/{roadmap_id}          → RoadmapUpdate in, RoadmapRead out
  POST /mentors/roadmaps/{roadmap_id}/approve  → RoadmapRead out
  GET  /students/{student_id}/roadmap          → RoadmapRead out (approved only)
"""

from datetime import datetime

from pydantic import BaseModel, Field


class RoadmapCreate(BaseModel):
    """Payload to create a new roadmap draft (mentor → student)."""

    draft_text: str = Field(..., min_length=1, description="Roadmap content written by the mentor.")


class RoadmapUpdate(BaseModel):
    """Payload to update the draft text of an existing roadmap."""

    draft_text: str = Field(..., min_length=1, description="Updated roadmap content.")


class RoadmapRead(BaseModel):
    """Full roadmap representation returned by the API."""

    id: int
    student_id: int
    mentor_id: int | None
    draft_text: str
    status: str  # "draft" | "edited" | "approved"
    created_at: datetime
    approved_at: datetime | None

    model_config = {"from_attributes": True}
