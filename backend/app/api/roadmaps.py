"""
api/roadmaps.py — LLM roadmap generation and approval endpoints. STUB — Phase 6/7.

IMPORTANT — Rules.md §1 non-negotiables that govern this file:
  1. "No LLM output reaches a student directly."
  2. Every roadmap must be written with status='draft'.
  3. Only POST /roadmaps/{id}/approve (mentor-only) can flip status to 'approved'.
  4. Phases 6 and 7 must ship together — never deploy generate without approve.

Do not implement until Phase 6. LLM calls must live in services/roadmap_generator.py,
never directly in this route handler.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/roadmaps", tags=["roadmaps"])


@router.post("/generate")
async def generate_roadmap():
    """STUB — implement in Phase 6. Calls services/roadmap_generator.py."""
    return {"detail": "Not implemented yet — Phase 6", "code": "STUB"}


@router.post("/{roadmap_id}/approve")
async def approve_roadmap(roadmap_id: int):
    """STUB — implement in Phase 7. Mentor-only. Flips status to 'approved'."""
    return {"detail": "Not implemented yet — Phase 7", "code": "STUB"}
