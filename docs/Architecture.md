# Architecture.md — SkillCortex Technical Architecture

## 1. High-Level Flow

```
[Student fills profile] 
        │
        ▼
[FastAPI: Gap Engine] ──(SQL set-difference)──▶ [Student Dashboard: gap breakdown]
        │
        ▼
[Aggregated across cohort] ──▶ [Admin Dashboard: heatmap]
        │
        ▼ (Phase 2)
[LLM drafts roadmap from gap] ──▶ [Mentor Dashboard: review/edit/approve]
        │
        ▼
[Approved roadmap] ──▶ [Student Dashboard: roadmap]
        │
        ▼
[Admin schedules workshop targeting the gap] ──▶ [Cohort tracked next cycle]
```

Phase 1 uses only the top loop (profile → gap engine → dashboards). Phase 2 adds the mentor/LLM loop and the intervention-tracking loop.

## 2. Tech Stack

| Layer | Technology | Notes |
| :--- | :--- | :--- |
| Frontend | React.js + Recharts | Dashboards for all three personas |
| Backend API | Python (FastAPI) | REST API, gap computation, orchestration |
| Database | PostgreSQL | Core relational store |
| Phase 2 vector search | PostgreSQL `pgvector` | Alumni similarity only — not used in Phase 1 |
| Auth | Google OAuth (via Auth0 or Clerk's Google connection) | Sign-in restricted to the college's Google Workspace domain only |
| LLM | Anthropic Claude API | Roadmap drafting only, Phase 2 |

## 3. Folder Structure

```
skillcortex/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI entrypoint
│   │   ├── api/
│   │   │   ├── students.py         # student profile + gap endpoints
│   │   │   ├── admin.py            # heatmap/aggregate endpoints
│   │   │   ├── mentors.py          # Phase 2: roadmap review endpoints
│   │   │   └── roadmaps.py         # Phase 2: LLM draft + approval
│   │   ├── core/
│   │   │   ├── config.py           # env vars, settings
│   │   │   ├── security.py         # auth/RBAC helpers
│   │   │   └── db.py               # DB session/connection
│   │   ├── models/                 # SQLAlchemy models
│   │   │   ├── student.py
│   │   │   ├── role_skill_map.py
│   │   │   ├── alumni.py           # Phase 2
│   │   │   └── roadmap.py          # Phase 2
│   │   ├── services/
│   │   │   ├── gap_engine.py       # deterministic set-difference logic
│   │   │   ├── similarity_engine.py # Phase 2: pgvector matching
│   │   │   └── roadmap_generator.py # Phase 2: LLM calls
│   │   └── schemas/                # Pydantic request/response models
│   ├── tests/
│   ├── alembic/                    # DB migrations
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── MentorDashboard.jsx  # Phase 2
│   │   ├── components/
│   │   │   ├── GapBreakdown.jsx
│   │   │   ├── ProgressTimeline.jsx
│   │   │   ├── Heatmap.jsx
│   │   │   └── RoadmapCard.jsx      # Phase 2
│   │   ├── api/                    # API client functions
│   │   ├── hooks/
│   │   └── App.jsx
│   └── package.json
├── docs/
│   ├── PRD.md
│   ├── Architecture.md
│   ├── Rules.md
│   ├── Phases.md
│   ├── Design.md
│   └── Memory.md
└── README.md
```

## 4. Data Model (core tables)

- **students**: id, name, year, target_role_id, skills (array/jsonb)
- **role_skill_map**: id, role_name, required_skills (array), source, last_updated
- **gap_snapshots**: id, student_id, computed_at, missing_skills (array) — enables the progress timeline
- **alumni** (Phase 2): id, anonymized_id, skills, placed_role, embedding
- **roadmaps** (Phase 2): id, student_id, draft_text, status (draft/approved/edited), mentor_id, approved_at

## 4a. Authentication — Google Sign-In, College Domain Only
- **Sign-in method:** Google OAuth only. There is no email/password signup and no other social login — "Sign in with Google" is the single entry point.
- **Domain restriction:** Only Google accounts on the college's domain (e.g., `@college.edu.in`) are allowed to authenticate. This is enforced two ways, not just one:
  1. **At the Google OAuth layer:** pass the `hd` (hosted domain) parameter set to the college's domain when initiating the OAuth request, so Google's account picker itself is scoped to that domain.
  2. **At the backend layer (mandatory, do not skip):** after the token comes back, verify the `hd` claim (or the email suffix) on the server before creating a session. The `hd` parameter is a UI hint only — a personal Gmail account can still complete the flow and return a token unless the backend independently rejects any email not ending in the college's domain.
- **First login = auto-provisioning:** the first time a valid college email logs in, a `students` (or `mentors`/`admins`, depending on domain sub-pattern or an admin-maintained allowlist) row is created automatically from the Google profile (name, email). No separate registration form.
- **Role assignment:** default role on first login is Student. Mentor and Admin roles are not self-assignable — they're granted via an admin-maintained allowlist (email → role mapping table), checked at login time.
- **Session handling:** standard OAuth session/JWT via Auth0/Clerk; no separate password reset flow needed since there's no password.

## 5. API Boundaries
- `POST /students/{id}/gap` → runs deterministic gap engine, writes a `gap_snapshot`, returns breakdown
- `GET /admin/heatmap?cohort=` → aggregates `gap_snapshots` across a cohort
- `POST /roadmaps/generate` (Phase 2) → calls LLM, creates roadmap in `draft` status
- `POST /roadmaps/{id}/approve` (Phase 2) → mentor-only, flips status to `approved`, notifies student

## 6. Key Architectural Decisions
- **Gap engine is plain SQL, not ML**, in both phases — see Rules.md for why this must not change without explicit sign-off.
- **pgvector is isolated to `similarity_engine.py`** and only touches the `alumni` table — it must never be used to compute the gap shown to students.
- **LLM calls are isolated to `roadmap_generator.py`** and always write to `status=draft` — nothing from the LLM reaches a student without passing through the `/approve` endpoint.
