# SkillCortex

> AI-Driven Placement & Mentorship Engine — a closed-loop, explainable diagnostic system for college placement cells.

See `docs/aboutproject.md` for the full vision and `docs/PRD.md` for the product requirements.

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker Desktop (for the Postgres container)

### 1. Start the database

```bash
docker-compose up -d
```

### 2. Set up the backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env        # then fill in real values
alembic upgrade head        # creates all tables
uvicorn app.main:app --reload --port 8000
```

Verify: `GET http://localhost:8000/health` → `{"status": "ok"}`

### 3. Set up the frontend

```bash
cd frontend
npm install
npm run dev
```

Verify: open `http://localhost:5173`

### 4. Run backend tests

```bash
cd backend
pytest tests/
```

---

## Architecture

See `docs/Architecture.md` for the full technical design and folder structure.

## Build Phases

See `docs/Phases.md` for the sequenced build plan. **Do not skip phases.**

## Rules

See `docs/Rules.md` before writing any code. Non-negotiable architectural and auth constraints are listed there.

## Progress Log

See `docs/Memory.md` for the living progress log — updated after each phase.

---

## Current Phase

**Phase 0 — Project Skeleton** (complete)

Next: Phase 1 — Google Auth (College Domain Only). See `docs/Phases.md`.
