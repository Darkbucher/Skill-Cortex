# PRD.md — SkillCortex Product Requirements Document

## 1. Problem Statement
College placement cells currently rely on predictive tools that tell a student "you have a 60% chance of placement" without telling them *why*, or what to do about it. Students are left guessing which skills to learn, and admins have no data-backed way to decide which workshops to run. SkillCortex replaces prediction with diagnosis: it shows the exact skill gap, prescribes a plan to close it, and gives the institution the aggregate data to act.

## 2. Target Users

| Persona | Who they are | Core need |
| :--- | :--- | :--- |
| **Student** | Undergrad, typically 2nd–4th year, preparing for placements | "What exactly am I missing, and what do I do about it?" |
| **Mentor** | Alumni or faculty member volunteering time | "Let me guide students without having to write every plan from scratch." |
| **Admin** | Placement cell staff / TPO (Training & Placement Officer) | "Where should I spend my limited workshop budget for the biggest impact?" |

## 3. Goals
- Give every student a clear, factual list of missing skills for their target role — no vague scores.
- Turn AI-generated study plans into mentor-approved, trustworthy roadmaps.
- Give admins aggregate, actionable data (heatmaps) instead of raw student-level noise.
- Prove, year over year, that interventions (workshops) actually close gaps.

## 4. Non-Goals (explicitly out of scope)
- SkillCortex does **not** predict placement probability or "chance of getting hired."
- It does **not** replace actual technical training content — it identifies gaps and points to a plan, it doesn't teach.
- It does **not** handle resume building, interview scheduling, or recruiter-facing workflows (out of scope unless added in a future phase).
- No mobile app in Phase 1 or 2 — web only.

## 5. Features by Phase

### Phase 1 — Diagnostic MVP
- Student profile creation (skills, domain interest, academic year, target role)
- Curated `role_skill_map` (admin-maintained target skill list per role)
- Deterministic gap calculation (set-difference: target skills − student skills)
- Student Dashboard: visual gap breakdown + progress-over-time timeline
- Admin Dashboard: aggregate heatmap of skill deficits across a batch/cohort
- Google Sign-In restricted to the college's email domain (no manual signup, no other login method)
- Basic RBAC (Student / Admin roles)

### Phase 2 — AI & Workflow Upgrade
- LLM-drafted 4-week study roadmap based on Phase 1 gap data
- Mentor role added to RBAC
- Mentor Dashboard: review/edit/approve roadmap queue
- Human-in-the-loop approval gate before a roadmap reaches a student
- Alumni similarity matching (pgvector/cosine) to refine target skill benchmarks
- Admin Intervention tool: schedule a workshop, tag which students it targets, track gap closure over time
- Cohort year-over-year comparison view

## 6. Success Metrics
- **Student:** % of students who see their gap shrink over a semester
- **Mentor:** average roadmap turnaround time (submission → approval)
- **Admin:** measurable drop in the top-3 most common skill gaps after a targeted workshop
- **System:** roadmap approval rate without major mentor edits (proxy for AI draft quality)

## 7. User Stories (representative, not exhaustive)
- As a student, I want to see exactly which skills I'm missing for my target role, so I know what to learn next.
- As a student, I want to see my gap shrink over time, so I stay motivated.
- As a mentor, I want to review an AI-drafted roadmap and tweak it before it goes to a student, so I don't have to write it from scratch but still control quality.
- As an admin, I want to see which skills are most commonly missing across a batch, so I know what workshop to run next.
- As an admin, I want to compare this year's gap data to last year's, so I can prove workshops are working.

## 8. Constraints & Assumptions
- Access is restricted to the college community only: sign-in is via Google OAuth, and only accounts on the college's official email domain (e.g., `@college.edu.in`) can log in. There is no path to create an account with a personal email.
- Assumes the placement cell will maintain the `role_skill_map` — this is a manual, ongoing responsibility, not automated.
- Assumes a cold-start fallback (generic industry skill templates) is acceptable for the first 1–2 placement cycles.
- Alumni data used for benchmarking is anonymized; see Rules.md and project.md for privacy handling.
