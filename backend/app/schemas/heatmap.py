"""
schemas/heatmap.py — Pydantic schemas for the admin cohort heatmap (Phase 4).

Used by GET /admin/heatmap to return aggregated missing-skill counts
across all students targeting a given role.

Response structure:
  [
    {
      "role_id": 1,
      "role_name": "SDE",
      "total_students": 12,
      "skills": [
        {"skill": "Docker", "missing_count": 9, "percentage": 75.0},
        ...
      ]
    },
    ...
  ]

Skills within each role are sorted descending by missing_count so the
worst gaps appear first in Heatmap.jsx.
"""

from pydantic import BaseModel


class HeatmapSkill(BaseModel):
    """One skill's aggregate gap data for a specific role."""

    skill: str
    missing_count: int
    percentage: float


class HeatmapRoleAggregate(BaseModel):
    """Aggregated gap data for all students targeting one role."""

    role_id: int
    role_name: str
    total_students: int
    skills: list[HeatmapSkill]
