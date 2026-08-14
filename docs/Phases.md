# Phases.md — Build Sequence

Each phase should be built, tested, and confirmed working before moving to the next. Do not skip ahead. Update `Memory.md` at the end of every phase.

---

## Phase 0 — Project Setup
- Initialize backend (FastAPI project skeleton, folder structure per `Architecture.md`)
- Initialize frontend (React app skeleton, Tailwind configured)
- Set up PostgreSQL locally + Alembic migrations initialized
- Set up `.env` handling via `core/config.py`
- **Done when:** backend `/health` endpoint returns 200, frontend renders a blank shell, DB connects successfully.

## Phase 1 — Google Auth (College Domain Only) & Roles
- Integrate Auth0 or Clerk, configured for Google OAuth only (no email/password option enabled)
- Set the `hd` parameter to the college's domain on the OAuth request (narrows Google's account picker)
- Implement the **mandatory server-side check**: verify the returned email's domain on every login before creating a session — do not rely on the `hd` parameter alone
- Auto-provision a `students` row on first successful login (name + email from Google profile); no separate signup form
- Implement RBAC: Student, Admin (Mentor role added in Phase 5), with Admin/Mentor granted via an allowlist, not self-assignable
- Login/logout flow on frontend: single "Sign in with Google" button, no other auth UI
- **Done when:** a college-domain Google account can sign in and lands on the correct dashboard for its role; a non-college Google account is rejected server-side even if it completes the Google OAuth screen; no signup/password form exists anywhere in the app.

## Phase 2 — Student Profile & Role-Skill Map
- Build `students` and `role_skill_map` tables + migrations
- Student profile creation/edit form (skills, year, target role)
- Admin CRUD for `role_skill_map` (seed with a few roles manually first)
- **Done when:** a student can create a profile, and an admin can view/edit the target skill list for a role.

## Phase 3 — Deterministic Gap Engine
- Implement `services/gap_engine.py` (plain SQL set-difference — see Rules.md)
- `POST /students/{id}/gap` endpoint, writes to `gap_snapshots`
- Student Dashboard: gap breakdown UI (`GapBreakdown.jsx`)
- **Done when:** a student's dashboard correctly shows missing skills for their target role, matching a manual calculation.

## Phase 4 — Progress Timeline & Admin Heatmap
- `ProgressTimeline.jsx` — plots `gap_snapshots` over time per student
- `GET /admin/heatmap` — aggregates gaps across a cohort
- `Heatmap.jsx` — admin-facing visualization
- **Done when:** re-running the gap calculation after a profile update produces a new snapshot and the timeline updates; admin heatmap correctly reflects aggregate data across test students.

**→ End of Phase 1 (Mini Project) scope. This is a complete, demoable product on its own.**

---

## Phase 5 — Mentor Role & Roadmap Data Model
- Add Mentor role to RBAC
- `roadmaps` table + migrations (status: draft/approved/edited)
- Mentor Dashboard skeleton (queue view, no AI yet — manual roadmap entry for testing)
- **Done when:** a mentor can log in, see a queue, and manually create/approve a roadmap end-to-end.

## Phase 6 — LLM Roadmap Generation
- `services/roadmap_generator.py` — wrapped Claude API client
- `POST /roadmaps/generate` — takes gap data, produces a draft roadmap
- **No automated resource links:** The LLM should outline the plan but must **not** auto-suggest specific course links or tutorials (e.g., a link to a Docker course). This violates the PRD non-goal ("it doesn't teach"). Specific learning resources must be mentor-authored content added manually to the roadmap during approval.
- Error handling per Rules.md (fallback on LLM failure)
- **Done when:** generating a roadmap from real gap data produces a sensible draft, saved with `status=draft`.

## Phase 7 — Human-in-the-Loop Approval
- `RoadmapCard.jsx` — mentor can view/edit/approve/reject a draft
- `POST /roadmaps/{id}/approve` — flips status, notifies student
- Student Dashboard: approved roadmap view
- **Done when:** a full loop works — gap detected → LLM drafts → mentor edits and approves → student sees it. No draft is ever visible to a student before approval.

## Phase 8 — Alumni Similarity & Admin Interventions
- `alumni` table + anonymization handling (see project.md privacy section)
- `services/similarity_engine.py` — pgvector cosine similarity, isolated per Rules.md
- Admin Intervention tool: tag a workshop to target skills, track gap closure over subsequent cycles
- Cohort year-over-year comparison view
- **Done when:** admin can schedule an intervention, and a follow-up gap snapshot cycle shows measurable change in the targeted skill's prevalence.

**→ End of Phase 2 (Major Project) scope.**

---

## Notes on Sequencing
- Phases 0–4 are strictly sequential; each depends on the last.
- Phases 5–8 can be reordered slightly (e.g., Phase 8's alumni similarity could move earlier) but Phase 6 (LLM) must come after Phase 5 (data model) and Phase 7 (approval gate) must come immediately after Phase 6 — never ship LLM generation without the approval gate in the same phase window.
