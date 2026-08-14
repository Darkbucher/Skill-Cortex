import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
from app.main import app
from app.core.db import get_db
from app.models.student import Student
from app.models.role_allowlist import RoleAllowlist
import app.core.security as security_module

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_user_cache():
    """
    security.py keeps a module-level _user_cache dict to avoid redundant
    Clerk API calls. This bleeds between tests, causing stale user info to
    bypass the patches. Clear it before (and after) every test.
    """
    security_module._user_cache.clear()
    yield
    security_module._user_cache.clear()


@pytest.fixture
def mock_clerk():
    """
    Patch both async helpers that get_current_user calls internally.
    We must use AsyncMock because both functions are defined as `async def`.
    """
    with patch("app.core.security.verify_clerk_token", new_callable=AsyncMock) as mock_verify:
        with patch("app.core.security.get_clerk_user_info", new_callable=AsyncMock) as mock_info:
            yield mock_verify, mock_info


@pytest.fixture
def db_session():
    mock_db = MagicMock()
    app.dependency_overrides[get_db] = lambda: mock_db
    yield mock_db
    app.dependency_overrides.pop(get_db, None)


def test_college_email_provisioned(mock_clerk, db_session):
    """A first-time college-domain login auto-provisions a Student row."""
    mock_verify, mock_info = mock_clerk
    mock_verify.return_value = {"sub": "user_123"}
    # Use the real college_domain (knit.ac.in) so the domain check passes
    mock_info.return_value = {"email": "student@knit.ac.in", "name": "Test Student"}

    def side_effect(model):
        if model == RoleAllowlist:
            m = MagicMock()
            m.filter.return_value.first.return_value = None  # not in allowlist → student role
            return m
        elif model == Student:
            m = MagicMock()
            m.filter.return_value.first.return_value = None  # not yet provisioned
            return m
        return MagicMock()

    db_session.query.side_effect = side_effect

    def mock_refresh(obj):
        if isinstance(obj, Student):
            obj.id = 1

    db_session.refresh.side_effect = mock_refresh

    response = client.get("/auth/me", headers={"Authorization": "Bearer fake_token"})
    assert response.status_code == 200

    data = response.json()
    assert data["email"] == "student@knit.ac.in"
    assert data["role"] == "student"
    assert data["student_id"] == 1

    # Verify auto-provisioning: a Student was added to the DB
    assert db_session.add.called
    added_student = db_session.add.call_args[0][0]
    assert added_student.email == "student@knit.ac.in"
    assert added_student.name == "Test Student"


def test_non_college_email_rejected(mock_clerk, db_session):
    """A Gmail (non-college) address must be rejected with 403."""
    mock_verify, mock_info = mock_clerk
    mock_verify.return_value = {"sub": "user_456"}
    mock_info.return_value = {"email": "personal@gmail.com", "name": "Personal"}

    # No DB side-effect needed — domain check fires before any DB query
    db_session.query.return_value.filter.return_value.first.return_value = None

    response = client.get("/auth/me", headers={"Authorization": "Bearer fake_token"})
    assert response.status_code == 403
    # Detail is a dict: {"error": "...", "code": "DOMAIN_RESTRICTED"}
    detail = response.json()["detail"]
    assert "knit.ac.in" in detail["error"]


def test_no_token_rejected():
    """Requests without a Bearer token must be rejected."""
    response = client.get("/auth/me")
    assert response.status_code == 403


def test_role_allowlist_respected(mock_clerk, db_session):
    """A college email that appears in the role_allowlist gets the allowlisted role."""
    mock_verify, mock_info = mock_clerk
    mock_verify.return_value = {"sub": "user_789"}
    mock_info.return_value = {"email": "admin@knit.ac.in", "name": "Admin User"}

    def side_effect(model):
        if model == RoleAllowlist:
            m = MagicMock()
            admin_role = MagicMock()
            admin_role.role = "admin"
            m.filter.return_value.first.return_value = admin_role
            return m
        elif model == Student:
            m = MagicMock()
            student_mock = MagicMock()
            student_mock.id = 2
            m.filter.return_value.first.return_value = student_mock
            return m
        return MagicMock()

    db_session.query.side_effect = side_effect

    response = client.get("/auth/me", headers={"Authorization": "Bearer fake_token"})
    assert response.status_code == 200
    assert response.json()["role"] == "admin"
