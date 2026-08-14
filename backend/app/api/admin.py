"""
api/admin.py — Admin-facing endpoints.

Phase 2: role-skill map CRUD
Phase 4: heatmap aggregate endpoint
Phase 5: mentor account management

See Architecture.md §5:
  GET    /admin/roles          → list all roles
  POST   /admin/roles          → create a role (with its required_skills)
  PUT    /admin/roles/{id}     → update a role's skills
  DELETE /admin/roles/{id}     → delete a role
  GET    /admin/heatmap        → aggregate gap data across a cohort (Phase 4)
  GET    /admin/mentors        → list all mentor accounts (Phase 5)
  POST   /admin/mentors        → grant mentor role to an email (Phase 5)
  DELETE /admin/mentors/{email} → revoke mentor role (Phase 5)
"""

from collections import Counter, defaultdict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from pydantic import BaseModel

from app.core.security import get_current_user, CurrentUser
from app.core.db import get_db
from app.models.gap_snapshot import GapSnapshot
from app.models.role_allowlist import RoleAllowlist
from app.models.student import Student
from app.models.role_skill_map import RoleSkillMap
from app.schemas.role_skill_map import RoleSkillMapRead, RoleSkillMapCreate, RoleSkillMapUpdate
from app.schemas.heatmap import HeatmapRoleAggregate, HeatmapSkill


# ── Phase 5 inline schemas for mentor management ─────────────────────────────

class MentorCreate(BaseModel):
    """Payload to add a mentor to the role_allowlist."""
    email: str
    display_name: str | None = None


class MentorRead(BaseModel):
    """A mentor row from the role_allowlist."""
    email: str
    added_by: str | None
    added_at: datetime

    model_config = {"from_attributes": True}


def require_admin(user: CurrentUser = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)


@router.get("/roles", response_model=list[RoleSkillMapRead])
async def list_roles(db: Session = Depends(get_db)):
    return db.query(RoleSkillMap).all()


@router.post("/roles", response_model=RoleSkillMapRead, status_code=status.HTTP_201_CREATED)
async def create_role(role_data: RoleSkillMapCreate, db: Session = Depends(get_db)):
    existing = db.query(RoleSkillMap).filter(RoleSkillMap.role_name == role_data.role_name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Role name already exists")

    role = RoleSkillMap(
        role_name=role_data.role_name,
        required_skills=role_data.required_skills,
        source=role_data.source,
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.put("/roles/{role_id}", response_model=RoleSkillMapRead)
async def update_role(role_id: int, role_data: RoleSkillMapUpdate, db: Session = Depends(get_db)):
    role = db.query(RoleSkillMap).filter(RoleSkillMap.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if role_data.role_name is not None and role_data.role_name != role.role_name:
        existing = db.query(RoleSkillMap).filter(RoleSkillMap.role_name == role_data.role_name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Role name already exists")
        role.role_name = role_data.role_name

    if role_data.required_skills is not None:
        role.required_skills = role_data.required_skills

    if "source" in role_data.model_fields_set:
        role.source = role_data.source

    role.last_updated = datetime.now(timezone.utc)
    db.commit()
    db.refresh(role)
    return role


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(role_id: int, db: Session = Depends(get_db)):
    role = db.query(RoleSkillMap).filter(RoleSkillMap.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    db.delete(role)
    db.commit()
    return None


@router.get("/heatmap", response_model=list[HeatmapRoleAggregate])
async def get_heatmap(cohort: str | None = None, db: Session = Depends(get_db)):
    """
    Aggregate missing-skill counts across a cohort.

    Algorithm:
      1. For each student, select only their most recent gap_snapshot.
      2. Optionally filter by year cohort (e.g. cohort="3" → year 3 students).
      3. Group snapshots by the student's target_role_id.
      4. For each role, count how many students are missing each skill and
         express it as a percentage of the students targeting that role.
      5. Sort skills within each role descending by missing_count.

    Returns [] if no snapshots exist yet.
    """

    # Subquery: most recent snapshot timestamp per student
    latest_ts = (
        db.query(
            GapSnapshot.student_id,
            func.max(GapSnapshot.computed_at).label("max_ts"),
        )
        .group_by(GapSnapshot.student_id)
        .subquery()
    )

    # Join to fetch only those latest snapshot rows
    latest_snapshots = (
        db.query(GapSnapshot)
        .join(
            latest_ts,
            (GapSnapshot.student_id == latest_ts.c.student_id)
            & (GapSnapshot.computed_at == latest_ts.c.max_ts),
        )
        .all()
    )

    if not latest_snapshots:
        return []

    # Build a map of student_id → Student for role + cohort lookups
    student_ids = [s.student_id for s in latest_snapshots]
    students = db.query(Student).filter(Student.id.in_(student_ids)).all()
    student_map = {s.id: s for s in students}

    # Optional cohort year filter
    if cohort is not None:
        try:
            cohort_year = int(cohort)
            filtered_ids = {
                sid for sid, s in student_map.items() if s.year == cohort_year
            }
            latest_snapshots = [
                snap for snap in latest_snapshots if snap.student_id in filtered_ids
            ]
        except ValueError:
            pass  # Invalid cohort string — ignore filter silently

    if not latest_snapshots:
        return []

    # Fetch all roles referenced
    role_ids = {
        student_map[snap.student_id].target_role_id
        for snap in latest_snapshots
        if snap.student_id in student_map
        and student_map[snap.student_id].target_role_id is not None
    }
    roles = db.query(RoleSkillMap).filter(RoleSkillMap.id.in_(role_ids)).all()
    role_map = {r.id: r for r in roles}

    # Group snapshots by role_id
    by_role: dict = defaultdict(list)
    for snap in latest_snapshots:
        student = student_map.get(snap.student_id)
        if student and student.target_role_id in role_map:
            by_role[student.target_role_id].append(snap)

    result = []
    for role_id, snaps in by_role.items():
        role = role_map[role_id]
        total = len(snaps)

        skill_counter: Counter = Counter()
        for snap in snaps:
            for skill in (snap.missing_skills or []):
                skill_counter[skill] += 1

        skills = [
            HeatmapSkill(
                skill=skill,
                missing_count=count,
                percentage=round(count / total * 100, 1),
            )
            for skill, count in skill_counter.most_common()
        ]

        result.append(
            HeatmapRoleAggregate(
                role_id=role_id,
                role_name=role.role_name,
                total_students=total,
                skills=skills,
            )
        )

    # Most-populated roles first
    result.sort(key=lambda r: r.total_students, reverse=True)
    return result


# ── Phase 5: Mentor account management ───────────────────────────────────────

@router.get("/mentors", response_model=list[MentorRead])
async def list_mentors(db: Session = Depends(get_db)):
    """
    List all users in the role_allowlist with role='mentor'.
    Admin-only (enforced by the router dependency).
    """
    return (
        db.query(RoleAllowlist)
        .filter(RoleAllowlist.role == "mentor")
        .order_by(RoleAllowlist.added_at.asc())
        .all()
    )


@router.post("/mentors", response_model=MentorRead, status_code=status.HTTP_201_CREATED)
async def add_mentor(
    payload: MentorCreate,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Grant mentor role to an email address.
    - Email must end with @knit.ac.in (server-side validation).
    - If the email already has a role in the allowlist, return 400.
    Admin-only (enforced by router dependency).
    """
    from app.core.config import settings

    email = payload.email.strip().lower()

    if not email.endswith(f"@{settings.college_domain}"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": f"Mentor email must end with @{settings.college_domain}",
                "code": "INVALID_DOMAIN",
            },
        )

    existing = db.query(RoleAllowlist).filter(RoleAllowlist.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Email already has an elevated role", "code": "ALREADY_EXISTS"},
        )

    row = RoleAllowlist(
        email=email,
        role="mentor",
        added_by=user.email,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/mentors/{mentor_email}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_mentor(mentor_email: str, db: Session = Depends(get_db)):
    """
    Remove a mentor from the role_allowlist, revoking their elevated access.
    Admin-only (enforced by router dependency).
    Next login the ex-mentor will be treated as a student.
    """
    row = (
        db.query(RoleAllowlist)
        .filter(RoleAllowlist.email == mentor_email, RoleAllowlist.role == "mentor")
        .first()
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Mentor not found", "code": "NOT_FOUND"},
        )
    db.delete(row)
    db.commit()
    return None
