# Memory.md — Living Progress Log

> This file is NOT written at project start. Create it the moment AI-assisted coding begins, and update it after every meaningful chunk of work (end of a phase, end of a session, or before switching AI tools/chats). Its job is to let a new chat/tool pick up exactly where the last one left off — without re-reading the whole codebase or guessing.

---

## How to Use This File
- Keep entries **short and factual** — what changed, what state it's in, what's next. Not a diary.
- Newest entry at the top.
- Before starting a new session, read the last 2–3 entries plus the "Current State" summary below — that should be enough context to resume.
- If a decision was made that deviates from `Architecture.md`, `Rules.md`, or `Phases.md`, log it here AND update the relevant doc — this file records history, the other docs record current truth.

---

## Current State (always keep this section up to date — overwrite, don't append)

- **Active phase:** Phase 4 complete — ready for Phase 5 (or live testing of Phase 1 MVP)
- **Last completed milestone:** Phase 4 done — Progress Timeline & Admin Heatmap fully built and tested.
- **In progress:** nothing — all Phase 1 (mini-project) scope is now complete.
- **Known issues / blockers:** None! The previous `test_auth.py` failures have been resolved. All 48 tests are passing.
- **Next step:** Live testing of the Phase 1 MVP, followed by Phase 5 — Mentor Role & Roadmap Data Model.

---

## Log

### [Template entry — copy this format for each new entry]
**Date:** YYYY-MM-DD
**Phase:** e.g., Phase 3
**What was done:**
- Bullet point summary of what was built/changed
**Decisions made:**
- Any deviation from the planning docs, and why
**What's next:**
- One or two concrete next steps
**Files touched:**
- `path/to/file.py`, `path/to/other.jsx`

---
### Phase 4 — Progress Timeline & Admin Heatmap
**Date:** 2026-08-07
**Phase:** Phase 4
**What was done:**
- Created `app/schemas/history.py` (`GapSnapshotHistoryRead`) and `app/schemas/heatmap.py` (`HeatmapSkill`, `HeatmapRoleAggregate`)
- Refactored `app/schemas/gap.py` to re-export the moved schemas for backward compatibility
- `GET /students/{id}/gap/history` — confirmed working with updated imports
- `GET /admin/heatmap` — full implementation: latest-snapshot-per-student subquery, group by role, count skill frequencies, optional cohort year filter, returns sorted `HeatmapRoleAggregate` list
- 7 new backend tests added (3 history, 4 heatmap) — all pass
- `ProgressTimeline.jsx` — recharts AreaChart showing missing-skill count over time with trend badge and custom tooltip
- `Heatmap.jsx` — recharts BarChart drill-down + cross-role colour-coded matrix table with severity legend and cohort filter
- `StudentDashboard.jsx` — fetches history on mount and after each compute gap, renders ProgressTimeline
- `AdminShell.jsx` — heatmap tab now renders real `Heatmap` component, default tab changed to heatmap
**Decisions made:**
- Gap schema split into canonical files; re-exports in gap.py preserve zero breaking changes
- Heatmap uses latest-snapshot-per-student (not all snapshots) to avoid double-counting
- History fetch failures in StudentDashboard are silently swallowed — timeline is non-critical UX
**What's next:**
- Phase 5: Mentor Role & Roadmap Data Model
**Files touched:**
- `backend/app/schemas/history.py` (NEW)
- `backend/app/schemas/heatmap.py` (NEW)
- `backend/app/schemas/gap.py`
- `backend/app/api/students.py`
- `backend/app/api/admin.py`
- `backend/tests/test_students.py`
- `backend/tests/test_admin.py`
- `frontend/src/components/ProgressTimeline.jsx` (NEW)
- `frontend/src/components/Heatmap.jsx` (NEW)
- `frontend/src/pages/StudentDashboard.jsx`
- `frontend/src/pages/AdminShell.jsx`

---

<!-- New entries go above this line -->
