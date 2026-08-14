import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from app.main import app
from app.core.security import get_current_user, CurrentUser
from app.core.db import get_db

client = TestClient(app)

# ── Shared skill fixtures (new object format) ──────────────────────────────────

STUDENT_SKILLS = [
    {"skill": "Python", "level": "intermediate"},
    {"skill": "React",  "level": "beginner"},
]

ROLE_REQUIRED_SKILLS = [
    {"skill": "Python", "min_level": "intermediate"},
    {"skill": "SQL",    "min_level": "beginner"},
    {"skill": "Docker", "min_level": "beginner"},
]


@pytest.fixture
def override_dependencies():
    # Mock CurrentUser
    mock_user = CurrentUser(
        email="student@knit.ac.in",
        name="Test Student",
        role="student",
        student_id=1
    )
    
    # Mock DB Session
    mock_db = MagicMock()
    
    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_db] = lambda: mock_db
    
    yield mock_db, mock_user
    
    app.dependency_overrides.clear()


def test_get_my_profile(override_dependencies):
    mock_db, mock_user = override_dependencies
    
    # Mock the query result
    mock_student = MagicMock()
    mock_student.id = 1
    mock_student.name = "Test Student"
    mock_student.email = "student@knit.ac.in"
    mock_student.year = 3
    mock_student.target_role_id = 1
    mock_student.skills = STUDENT_SKILLS
    from datetime import datetime, timezone
    mock_student.created_at = datetime.now(timezone.utc)
    
    # db.query(Student).filter(...).first()
    mock_db.query.return_value.filter.return_value.first.return_value = mock_student
    
    response = client.get("/students/me")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 1
    assert data["name"] == "Test Student"
    assert data["year"] == 3
    # Skills are now objects
    assert len(data["skills"]) == 2
    assert data["skills"][0]["skill"] == "Python"
    assert data["skills"][0]["level"] == "intermediate"
    assert data["skills"][1]["skill"] == "React"
    assert data["skills"][1]["level"] == "beginner"


def test_update_my_profile(override_dependencies):
    mock_db, mock_user = override_dependencies
    
    # Mock the student query result
    mock_student = MagicMock()
    mock_student.id = 1
    mock_student.name = "Test Student"
    mock_student.email = "student@knit.ac.in"
    from datetime import datetime, timezone
    mock_student.created_at = datetime.now(timezone.utc)
    
    # Mock the role query result
    mock_role = MagicMock()
    mock_role.id = 2
    
    def side_effect(model):
        from app.models.student import Student
        from app.models.role_skill_map import RoleSkillMap
        m = MagicMock()
        if model == Student:
            m.filter.return_value.first.return_value = mock_student
        elif model == RoleSkillMap:
            m.filter.return_value.first.return_value = mock_role
        return m
        
    mock_db.query.side_effect = side_effect
    
    # Payload now uses the new skill object format
    update_payload = {
        "year": 4,
        "target_role_id": 2,
        "skills": [
            {"skill": "Python", "level": "intermediate"},
            {"skill": "Docker", "level": "beginner"},
        ]
    }
    
    response = client.put("/students/me", json=update_payload)
    assert response.status_code == 200
    
    # Verify the object was updated
    assert mock_student.year == 4
    assert mock_student.target_role_id == 2
    # Skills should be stored as plain dicts (model_dump called in API)
    assert mock_student.skills == [
        {"skill": "Python", "level": "intermediate"},
        {"skill": "Docker", "level": "beginner"},
    ]
    assert mock_db.commit.called


def test_compute_gap(override_dependencies):
    mock_db, mock_user = override_dependencies
    
    mock_student = MagicMock()
    mock_student.id = 1
    mock_student.target_role_id = 1
    mock_student.skills = STUDENT_SKILLS  # Python/intermediate, React/beginner
    
    mock_role = MagicMock()
    mock_role.id = 1
    mock_role.required_skills = ROLE_REQUIRED_SKILLS  # Python/intermediate, SQL/beginner, Docker/beginner
    
    def side_effect(model):
        from app.models.student import Student
        from app.models.role_skill_map import RoleSkillMap
        m = MagicMock()
        if model == Student:
            m.filter.return_value.first.return_value = mock_student
        elif model == RoleSkillMap:
            m.filter.return_value.first.return_value = mock_role
        return m
        
    mock_db.query.side_effect = side_effect
    
    def mock_refresh(obj):
        from datetime import datetime, timezone
        obj.computed_at = datetime.now(timezone.utc)
        
    mock_db.refresh.side_effect = mock_refresh
    
    response = client.post("/students/1/gap")
    assert response.status_code == 200
    data = response.json()
    assert data["student_id"] == 1
    
    # Python is at or above intermediate → acquired
    # SQL and Docker are absent → missing
    assert "SQL" in data["missing_skills"]
    assert "Docker" in data["missing_skills"]
    assert "Python" not in data["missing_skills"]
    assert "Python" in data["acquired_skills"]
    # No level gaps in this scenario (React not required, Python exactly meets requirement)
    assert data["level_gap_skills"] == []
    assert mock_db.add.called
    assert mock_db.commit.called


def test_compute_gap_level_gap(override_dependencies):
    """Student has Python at beginner, role requires intermediate → level_gap_skills."""
    mock_db, mock_user = override_dependencies

    mock_student = MagicMock()
    mock_student.id = 1
    mock_student.target_role_id = 1
    mock_student.skills = [
        {"skill": "Python", "level": "beginner"},   # has it, but too low
        {"skill": "SQL",    "level": "intermediate"},  # meets requirement
    ]

    mock_role = MagicMock()
    mock_role.id = 1
    mock_role.required_skills = [
        {"skill": "Python", "min_level": "intermediate"},  # student is below
        {"skill": "SQL",    "min_level": "beginner"},      # student meets
        {"skill": "Docker", "min_level": "beginner"},      # student doesn't have
    ]

    def side_effect(model):
        from app.models.student import Student
        from app.models.role_skill_map import RoleSkillMap
        m = MagicMock()
        if model == Student:
            m.filter.return_value.first.return_value = mock_student
        elif model == RoleSkillMap:
            m.filter.return_value.first.return_value = mock_role
        return m

    mock_db.query.side_effect = side_effect

    def mock_refresh(obj):
        from datetime import datetime, timezone
        obj.computed_at = datetime.now(timezone.utc)

    mock_db.refresh.side_effect = mock_refresh

    response = client.post("/students/1/gap")
    assert response.status_code == 200
    data = response.json()

    # Python → level gap (beginner, needs intermediate)
    assert len(data["level_gap_skills"]) == 1
    level_gap = data["level_gap_skills"][0]
    assert level_gap["skill"] == "Python"
    assert level_gap["student_level"] == "beginner"
    assert level_gap["required_level"] == "intermediate"

    # Docker → completely missing
    assert "Docker" in data["missing_skills"]
    assert "Python" not in data["missing_skills"]

    # SQL → acquired
    assert "SQL" in data["acquired_skills"]


def test_compute_gap_unauthorized(override_dependencies):
    # Student ID is 1, trying to compute gap for Student ID 2
    response = client.post("/students/2/gap")
    assert response.status_code == 403
    assert response.json()["detail"] == "Not authorized to compute gap for this student"

def test_compute_gap_no_role(override_dependencies):
    mock_db, mock_user = override_dependencies
    
    mock_student = MagicMock()
    mock_student.id = 1
    mock_student.target_role_id = None
    
    def side_effect(model):
        from app.models.student import Student
        m = MagicMock()
        if model == Student:
            m.filter.return_value.first.return_value = mock_student
        return m
        
    mock_db.query.side_effect = side_effect
    
    response = client.post("/students/1/gap")
    assert response.status_code == 400
    assert response.json()["detail"] == "Student has no target role set"


# ── Phase 4 — GET /students/{id}/gap/history ────────────────────────────────────────────

def test_get_gap_history_own(override_dependencies):
    """A student can fetch their own gap history in chronological order."""
    mock_db, _ = override_dependencies  # student_id=1

    from datetime import datetime, timezone

    snap1 = MagicMock()
    snap1.id = 10
    snap1.missing_skills = ["Docker", "SQL"]
    snap1.level_gap_skills = []
    snap1.computed_at = datetime(2025, 1, 1, tzinfo=timezone.utc)

    snap2 = MagicMock()
    snap2.id = 11
    snap2.missing_skills = ["SQL"]
    snap2.level_gap_skills = [
        {"skill": "Python", "student_level": "beginner", "required_level": "intermediate"}
    ]
    snap2.computed_at = datetime(2025, 2, 1, tzinfo=timezone.utc)

    # db.query(GapSnapshot).filter(...).order_by(...).all()
    mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [
        snap1,
        snap2,
    ]

    response = client.get("/students/1/gap/history")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["id"] == 10
    assert "Docker" in data[0]["missing_skills"]
    assert data[0]["level_gap_skills"] == []
    assert data[1]["id"] == 11
    assert data[1]["missing_skills"] == ["SQL"]
    assert len(data[1]["level_gap_skills"]) == 1
    assert data[1]["level_gap_skills"][0]["skill"] == "Python"


def test_get_gap_history_unauthorized(override_dependencies):
    """A student cannot fetch another student's gap history."""
    # mock_user is student_id=1; requesting student_id=2 → 403
    response = client.get("/students/2/gap/history")
    assert response.status_code == 403
    assert response.json()["detail"] == "Not authorized to view history for this student"


def test_get_gap_history_empty(override_dependencies):
    """History endpoint returns an empty list when no snapshots exist yet."""
    mock_db, _ = override_dependencies

    mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = []

    response = client.get("/students/1/gap/history")
    assert response.status_code == 200
    assert response.json() == []
