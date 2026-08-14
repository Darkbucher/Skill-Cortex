# Rules.md — Boundaries for AI-Assisted Development

These rules apply to any AI tool (Claude Code, Cursor, Copilot, etc.) working on this codebase. Read this before writing or editing any file.

## 1. Non-Negotiable Architectural Rules
- **The core skill-gap calculation must remain plain SQL set-difference.** Never replace it with an ML model, embedding similarity, or "smart" scoring — this is the product's core credibility claim. If a task seems to require this, stop and flag it instead of implementing it.
- **`pgvector`/similarity logic is only allowed inside `services/similarity_engine.py`, and only touches the `alumni` table.** It must never influence what gap is shown to a student.
- **No LLM output reaches a student directly.** Every roadmap must be written with `status=draft` and only released to a student after `POST /roadmaps/{id}/approve` is called by a mentor.
- **Do not invent a placement-probability score anywhere in the product.** This was explicitly ruled out in the PRD.

## 2. Non-Negotiable Auth Rule
- **The only allowed sign-in method is Google OAuth, restricted to the college's domain.** Never add email/password login, magic links, or any other social provider — this isn't a preference, it's an access-control requirement (only college-affiliated accounts may reach any dashboard).
- **Domain restriction must be enforced server-side, not just via the Google `hd` parameter.** The `hd` param only narrows Google's account picker UI — it does not stop a non-domain account from completing OAuth and returning a token. Every login must independently verify the returned email's domain on the backend before a session is created. Treat any code path that creates a session without this check as a bug, not a style choice.
- If a task seems to require loosening this (e.g., "let a guest mentor from outside log in"), stop and flag it for explicit approval rather than implementing a workaround.

## 3. Libraries — Use / Avoid

| Category | Use | Avoid |
| :--- | :--- | :--- |
| Backend framework | FastAPI | Flask, Django (unless migrating an existing feature) |
| ORM | SQLAlchemy + Alembic for migrations | Raw SQL strings outside `services/`, ad-hoc schema changes without a migration |
| Frontend framework | React (functional components + hooks) | Class components, jQuery, direct DOM manipulation |
| Charts | Recharts | D3 directly (too low-level for this project's needs), Chart.js |
| Auth | Auth0 or Clerk SDKs, configured for Google OAuth only | Rolling custom auth/session handling, email/password signup, any social login other than Google |
| LLM calls | Anthropic Claude API via a single wrapped client in `services/roadmap_generator.py` | Calling the LLM API directly from route handlers or from the frontend |
| Styling | Tailwind CSS utility classes | Inline styles for anything beyond a one-off, large custom CSS files |

## 4. Error Handling
- Every API endpoint must return structured errors: `{ "error": "message", "code": "SOME_CODE" }` — never a raw stack trace to the client.
- LLM calls must be wrapped in try/catch with a fallback message ("Roadmap generation failed, please retry") — never let a failed LLM call silently produce an empty roadmap.
- Any database write inside a multi-step operation (e.g., gap snapshot + timeline update) must be wrapped in a transaction — partial writes are not acceptable.
- Validation errors (bad input) return `422`; auth errors return `401`/`403`; server errors return `500` with a logged trace ID, not the raw exception.

## 5. What the AI Should Do
- Follow the folder structure in `Architecture.md` — new files go where the structure says, not wherever is convenient.
- Write a test alongside any new backend endpoint (happy path + one failure path minimum).
- Keep functions small and named for what they do (`compute_skill_gap`, not `process`).
- Ask before changing anything listed under "Non-Negotiable Architectural Rules."
- Update `Memory.md` after completing a phase or a significant chunk of work (see Memory.md for format).

## 6. What the AI Should NOT Do
- Do not add new dependencies without checking they're not already covered by something in the "Use" column above.
- Do not refactor unrelated code while implementing a feature — flag it instead, fix it in a separate pass.
- Do not silently change the data model (e.g., renaming a column) without noting it in `Memory.md` and updating `Architecture.md`.
- Do not hardcode secrets, API keys, or connection strings — always use environment variables via `core/config.py`.
- Do not build features listed under "Non-Goals" in `PRD.md` (placement probability scoring, resume builder, recruiter workflows, mobile app) even if asked casually in passing — confirm scope change explicitly first.
- **Do not configure the LLM to auto-suggest specific course links or learning resources.** The system identifies gaps and points to a plan, but it does not teach. Specific resources must remain mentor-authored content added manually during the Phase 7 approval process.

## 7. Commit / Change Hygiene
- One logical change per commit; commit messages describe *why*, not just *what* ("Add gap snapshot table to support progress timeline" not "update models.py").
- Any schema change requires an Alembic migration in the same commit as the model change.
