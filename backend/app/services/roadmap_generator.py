"""
services/roadmap_generator.py — LLM (Claude API) roadmap drafting. STUB — Phase 6.

RULES.md §1 non-negotiable:
  "LLM calls are isolated to roadmap_generator.py and always write to
   status=draft — nothing from the LLM reaches a student without passing
   through the /approve endpoint."

This is the ONLY place in the codebase that may call the Anthropic Claude API.
Calling the LLM directly from route handlers or from the frontend is a Rules.md
violation and must not be done.

Phase 6 will add:
  - Anthropic client initialization (from env var, never hardcoded)
  - generate_roadmap(gap: list[str], student_id: int, db) function
  - Error handling: try/catch with a fallback message (see Rules.md §4)
  - Writes roadmap row with status='draft' (never 'approved')
"""


def generate_roadmap(gap: list[str], student_id: int, db) -> dict:
    """STUB — implement in Phase 6."""
    raise NotImplementedError("roadmap_generator is a Phase 6 stub.")
