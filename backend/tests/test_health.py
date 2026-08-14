"""
tests/test_health.py — Phase 0 Done-When: /health returns HTTP 200.

Happy path + one failure path (per Rules.md §5: "Write a test alongside any
new backend endpoint (happy path + one failure path minimum)").
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


# ── Happy path ────────────────────────────────────────────────────────────

def test_health_returns_200():
    """GET /health must return HTTP 200 — Phase 0 Done-When criterion."""
    response = client.get("/health")
    assert response.status_code == 200


def test_health_returns_ok_status():
    """GET /health must return {"status": "ok"} in the response body."""
    response = client.get("/health")
    data = response.json()
    assert data == {"status": "ok"}


# ── Failure path ──────────────────────────────────────────────────────────

def test_unknown_route_returns_404():
    """Any path not registered must return 404, not 200 or 500."""
    response = client.get("/this-route-does-not-exist")
    assert response.status_code == 404
