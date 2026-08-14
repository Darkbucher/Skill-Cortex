"""
api/mentors.py — Mentor roadmap queue and CRUD endpoints (Phase 5).

Phase 5 endpoints (all require 'mentor' or 'admin' role):
  GET  /mentors/queue                              → student queue with gap data + roadmap status
  POST /mentors/students/{student_id}/roadmap      → create a new roadmap (status=draft)
  GET  /mentors/students/{student_id}/roadmap      → get latest roadmap for a student
  PUT  /mentors/roadmaps/{roadmap_id}              → edit draft_text (status → edited)
  POST /mentors/roadmaps/{roadmap_id}/approve      → approve roadmap (status → approved)

Rules.md §1 non-negotiables enforced here:
  - status always starts as 'draft' on creation.
  - Only the /approve endpoint may flip status to 'approved'.
  - No LLM output reaches a student — that gate is enforced in Phase 7.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import CurrentUser, require_role
from app.models.gap_snapshot import GapSnapshot
from app.models.roadmap import Roadmap
from app.models.role_skill_map import RoleSkillMap
from app.models.student import Student
from app.schemas.roadmap import RoadmapCreate, RoadmapRead, RoadmapUpdate

router = APIRouter(
    prefix="/mentors",
    tags=["mentors"],
    # Both mentors and admins may access all endpoints in this router.
    dependencies=[Depends(require_role("mentor", "admin"))],
)


# ── GET /mentors/queue ────────────────────────────────────────────────────────

class QueueEntry:
    """Internal struct; not a Pydantic model — built and serialised manually."""
    pass


@router.get("/queue")
async def get_roadmap_queue(
    user: CurrentUser = Depends(require_role("mentor", "admin")),
    db: Session = Depends(get_db),
):
    """
    All students who have at least one gap snapshot.
    Returns latest gap data + roadmap status for each.

    Response shape per student:
    {
      "student_id": int,
      "name": str,
      "email": str,
      "year": int | null,
      "target_role": str | null,
      "gap_count": int,             # missing skills in latest snapshot
      "level_gap_count": int,       # level-gap skills in latest snapshot
      "snapshot_at": str (ISO),
      "roadmap_status": str | null  # latest roadmap status, or null
    }
    """
    # Subquery: latest snapshot per student
    latest_ts_sq = (
        db.query(
            GapSnapshot.student_id,
            func.max(GapSnapshot.computed_at).label("max_ts"),
        )
        .group_by(GapSnapshot.student_id)
        .subquery()
    )

    latest_snapshots = (
        db.query(GapSnapshot)
        .join(
            latest_ts_sq,
            (GapSnapshot.student_id == latest_ts_sq.c.student_id)
            & (GapSnapshot.computed_at == latest_ts_sq.c.max_ts),
        )
        .all()
    )

    if not latest_snapshots:
        return []

    student_ids = [s.student_id for s in latest_snapshots]

    # Fetch students
    students = db.query(Student).filter(Student.id.in_(student_ids)).all()
    student_map = {s.id: s for s in students}

    # Fetch all role names in one query
    role_ids = {s.target_role_id for s in students if s.target_role_id}
    roles = db.query(RoleSkillMap).filter(RoleSkillMap.id.in_(role_ids)).all()
    role_map = {r.id: r.role_name for r in roles}

    # Latest roadmap per student (we only need the most recent)
    latest_roadmap_sq = (
        db.query(
            Roadmap.student_id,
            func.max(Roadmap.id).label("max_id"),
        )
        .group_by(Roadmap.student_id)
        .subquery()
    )
    roadmap_rows = (
        db.query(Roadmap)
        .join(latest_roadmap_sq, Roadmap.id == latest_roadmap_sq.c.max_id)
        .filter(Roadmap.student_id.in_(student_ids))
        .all()
    )
    roadmap_status_map = {r.student_id: r.status for r in roadmap_rows}

    result = []
    for snap in latest_snapshots:
        student = student_map.get(snap.student_id)
        if not student:
            continue
        result.append(
            {
                "student_id": student.id,
                "name": student.name,
                "email": student.email,
                "year": student.year,
                "target_role": role_map.get(student.target_role_id),
                "gap_count": len(snap.missing_skills or []),
                "level_gap_count": len(getattr(snap, "level_gap_skills", None) or []),
                "missing_skills": snap.missing_skills or [],
                "level_gap_skills": getattr(snap, "level_gap_skills", None) or [],
                "snapshot_at": snap.computed_at.isoformat(),
                "roadmap_status": roadmap_status_map.get(student.id),
            }
        )

    # Sort: students with no roadmap first, then by gap_count desc
    result.sort(key=lambda x: (x["roadmap_status"] is not None, -x["gap_count"]))
    return result


# ── POST /mentors/students/{student_id}/roadmap ───────────────────────────────

@router.post(
    "/students/{student_id}/roadmap",
    response_model=RoadmapRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_roadmap(
    student_id: int,
    payload: RoadmapCreate,
    user: CurrentUser = Depends(require_role("mentor", "admin")),
    db: Session = Depends(get_db),
):
    """
    Create a new roadmap draft for a student.
    Status always starts as 'draft' — no shortcut to 'approved'.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Student not found", "code": "NOT_FOUND"},
        )

    roadmap = Roadmap(
        student_id=student_id,
        mentor_id=user.student_id,
        draft_text=payload.draft_text,
        status="draft",
    )
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)
    return roadmap


# ── GET /mentors/students/{student_id}/roadmap ────────────────────────────────

@router.get("/students/{student_id}/roadmap", response_model=RoadmapRead)
async def get_student_roadmap(
    student_id: int,
    db: Session = Depends(get_db),
):
    """
    Get the latest roadmap for a student (any status — mentor sees drafts too).
    """
    roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.student_id == student_id)
        .order_by(Roadmap.id.desc())
        .first()
    )
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "No roadmap found for this student", "code": "NOT_FOUND"},
        )
    return roadmap


# ── PUT /mentors/roadmaps/{roadmap_id} ────────────────────────────────────────

@router.put("/roadmaps/{roadmap_id}", response_model=RoadmapRead)
async def update_roadmap(
    roadmap_id: int,
    payload: RoadmapUpdate,
    db: Session = Depends(get_db),
):
    """
    Edit the draft_text of a roadmap.
    Status transitions: draft → edited, edited → edited (idempotent).
    An approved roadmap cannot be re-edited — return 400.
    """
    roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Roadmap not found", "code": "NOT_FOUND"},
        )

    if roadmap.status == "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Cannot edit an approved roadmap", "code": "ALREADY_APPROVED"},
        )

    roadmap.draft_text = payload.draft_text
    roadmap.status = "edited"
    db.commit()
    db.refresh(roadmap)
    return roadmap


# ── POST /mentors/roadmaps/{roadmap_id}/approve ───────────────────────────────

@router.post("/roadmaps/{roadmap_id}/approve", response_model=RoadmapRead)
async def approve_roadmap(
    roadmap_id: int,
    user: CurrentUser = Depends(require_role("mentor", "admin")),
    db: Session = Depends(get_db),
):
    """
    Approve a roadmap, making it visible to the student.
    Status transitions: draft | edited → approved.
    Sets approved_at to now (UTC).
    Rules.md: only this endpoint may flip status to 'approved'.
    """
    roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Roadmap not found", "code": "NOT_FOUND"},
        )

    if roadmap.status == "approved":
        # Idempotent — return current state without re-committing
        return roadmap

    roadmap.status = "approved"
    roadmap.approved_at = datetime.now(timezone.utc)
    # Record who approved (update mentor_id if it was null, e.g. admin approving)
    if roadmap.mentor_id is None and user.student_id:
        roadmap.mentor_id = user.student_id

    db.commit()
    db.refresh(roadmap)
    return roadmap
