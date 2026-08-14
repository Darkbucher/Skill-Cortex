"""
services/gap_engine.py — Level-aware skill-gap calculation (Option B).

RULES.md §1 non-negotiable:
  "The core skill-gap calculation must remain plain SQL set-difference.
   Never replace it with an ML model, embedding similarity, or 'smart' scoring."

This implementation extends the set-difference logic to a 3-way categorisation
using a deterministic level comparison — no ML, no embeddings.

Level ordering (lower index = lower level):
  beginner (0) < intermediate (1) < advanced (2)

For each required {skill, min_level}, look up the student's entry:
  - Not found at all          → missing_skills
  - Found but level < min     → level_gap_skills  (has skill, needs to level up)
  - Found and level >= min    → acquired_skills   ✅

Algorithm is O(n) per student — a simple dict lookup.
"""

from sqlalchemy.orm import Session
from app.models.student import Student
from app.models.role_skill_map import RoleSkillMap
from app.models.gap_snapshot import GapSnapshot


# Canonical level ordering — do not change without updating the migration comment
LEVEL_ORDER: dict[str, int] = {
    "beginner": 0,
    "intermediate": 1,
    "advanced": 2,
}


def compute_skill_gap(student_id: int, db: Session) -> dict:
    """
    Computes the 3-way skill gap for a student, writes a GapSnapshot to the
    database, and returns the categorised breakdown.

    Returns a dict with keys:
      student_id, missing_skills, level_gap_skills, acquired_skills, computed_at
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise ValueError("Student not found")

    if not student.target_role_id:
        raise ValueError("Student has no target role set")

    role = db.query(RoleSkillMap).filter(RoleSkillMap.id == student.target_role_id).first()
    if not role:
        raise ValueError("Target role not found")

    # Build a lookup: lowercase skill name → student level index
    # Each entry in student.skills is {"skill": str, "level": str}
    student_skills_raw = student.skills or []
    student_level_map: dict[str, int] = {}
    for entry in student_skills_raw:
        if isinstance(entry, dict):
            skill_name = entry.get("skill", "").lower().strip()
            level_str = entry.get("level", "beginner")
            student_level_map[skill_name] = LEVEL_ORDER.get(level_str, 0)
        else:
            # Graceful fallback for any legacy plain-string entries
            student_level_map[str(entry).lower().strip()] = 0

    # 3-way categorisation
    missing_skills: list[str] = []
    level_gap_skills: list[dict] = []
    acquired_skills: list[str] = []

    required_skills_raw = role.required_skills or []
    for req in required_skills_raw:
        if isinstance(req, dict):
            skill_name = req.get("skill", "")
            min_level_str = req.get("min_level", "beginner")
        else:
            # Graceful fallback for any legacy plain-string entries
            skill_name = str(req)
            min_level_str = "beginner"

        lookup_key = skill_name.lower().strip()
        min_level_idx = LEVEL_ORDER.get(min_level_str, 0)

        if lookup_key not in student_level_map:
            # Student doesn't have this skill at all
            missing_skills.append(skill_name)
        elif student_level_map[lookup_key] < min_level_idx:
            # Student has the skill but below the required level
            student_level_str = next(
                k for k, v in LEVEL_ORDER.items()
                if v == student_level_map[lookup_key]
            )
            level_gap_skills.append({
                "skill": skill_name,
                "student_level": student_level_str,
                "required_level": min_level_str,
            })
        else:
            # Student meets or exceeds the required level
            acquired_skills.append(skill_name)

    # Insert new gap snapshot (append-only — never UPDATE)
    snapshot = GapSnapshot(
        student_id=student.id,
        missing_skills=missing_skills,
        level_gap_skills=level_gap_skills,
    )
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)

    return {
        "student_id": snapshot.student_id,
        "missing_skills": snapshot.missing_skills,
        "level_gap_skills": snapshot.level_gap_skills,
        "acquired_skills": acquired_skills,
        "computed_at": snapshot.computed_at,
    }
