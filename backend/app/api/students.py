"""
api/students.py — Student profile and gap endpoints. STUB for Phase 0.

Implement in Phase 2 (profile CRUD) and Phase 3 (gap engine endpoint).
See Architecture.md §5 for the API contract:
  GET  /students/me       → current student's profile
  PUT  /students/me       → update profile (skills, year, target_role_id)
  POST /students/{id}/gap → run gap engine, write gap_snapshot, return breakdown
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import get_current_user, CurrentUser
from app.core.db import get_db
from app.models.student import Student
from app.models.role_skill_map import RoleSkillMap
from app.schemas.student import StudentRead, StudentUpdate
from app.schemas.role_skill_map import RoleSkillMapRead
from app.schemas.gap import GapBreakdownRead
from app.schemas.history import GapSnapshotHistoryRead

router = APIRouter(
    prefix="/students", 
    tags=["students"],
    dependencies=[Depends(get_current_user)]
)


# ── Phase 2 endpoints ────────────────────────────────────────────────────────

@router.get("/roles", response_model=list[RoleSkillMapRead])
async def list_available_roles(db: Session = Depends(get_db)):
    return db.query(RoleSkillMap).all()

@router.get("/me", response_model=StudentRead)
async def get_my_profile(
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == user.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student


@router.put("/me", response_model=StudentRead)
async def update_my_profile(
    update_data: StudentUpdate,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == user.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
        
    if update_data.target_role_id is not None:
        role = db.query(RoleSkillMap).filter(RoleSkillMap.id == update_data.target_role_id).first()
        if not role:
            raise HTTPException(status_code=400, detail="Invalid target role ID")
            
    # Update fields
    if update_data.name is not None:
        student.name = update_data.name
    if update_data.year is not None:
        student.year = update_data.year
    # Explicitly check if it's passed, since None might mean clear target role?
    # According to StudentUpdate: target_role_id: int | None = None
    # Let's check update_data.model_fields_set to differentiate explicitly set None vs omission
    if "target_role_id" in update_data.model_fields_set:
        student.target_role_id = update_data.target_role_id
    if "skills" in update_data.model_fields_set:
        # Serialize SkillEntry Pydantic objects → plain dicts for JSONB storage
        student.skills = (
            [s.model_dump() for s in update_data.skills]
            if update_data.skills is not None
            else []
        )
        
    db.commit()
    db.refresh(student)
    return student


# ── Phase 3 endpoint (not implemented yet) ───────────────────────────────

@router.post("/{student_id}/gap", response_model=GapBreakdownRead)
async def compute_gap(
    student_id: int,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes the skill gap for the student, writes a snapshot, and returns the breakdown.
    Only the student themselves (or an admin) can compute their gap.
    """
    if user.role != "admin" and user.student_id != student_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to compute gap for this student")
        
    try:
        from app.services.gap_engine import compute_skill_gap
        result = compute_skill_gap(student_id, db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to compute gap")

@router.get("/{student_id}/gap/history", response_model=list[GapSnapshotHistoryRead])
async def get_gap_history(
    student_id: int,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the historical gap snapshots for a student, ordered chronologically.
    Only the student themselves (or an admin) can access this.
    """
    if user.role != "admin" and user.student_id != student_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view history for this student")
        
    from app.models.gap_snapshot import GapSnapshot
    snapshots = db.query(GapSnapshot).filter(
        GapSnapshot.student_id == student_id
    ).order_by(GapSnapshot.computed_at.asc()).all()
    
    return snapshots


# ── Phase 5: Student reads their approved roadmap ────────────────────────────

@router.get("/{student_id}/roadmap")
async def get_my_roadmap(
    student_id: int,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns the student's latest **approved** roadmap.
    Students can only fetch their own (403 otherwise).
    Mentors and admins may fetch any student's roadmap.

    Returns 404 if no approved roadmap exists yet.
    """
    from app.models.roadmap import Roadmap
    from app.schemas.roadmap import RoadmapRead

    if user.role == "student" and user.student_id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "Not authorized to view this roadmap", "code": "FORBIDDEN"},
        )

    roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.student_id == student_id, Roadmap.status == "approved")
        .order_by(Roadmap.approved_at.desc())
        .first()
    )
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "No approved roadmap yet", "code": "NOT_FOUND"},
        )
    return RoadmapRead.model_validate(roadmap)

