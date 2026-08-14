"""
services/similarity_engine.py — Alumni similarity matching via pgvector. STUB — Phase 8.

RULES.md §1 non-negotiable:
  "pgvector/similarity logic is only allowed inside services/similarity_engine.py,
   and only touches the alumni table. It must never influence what gap is shown
   to a student."

This file must NEVER be called from gap_engine.py. It is isolated here
precisely to enforce that boundary — see Architecture.md §6.

Phase 8 will add:
  - alumni table querying
  - cosine similarity via pgvector
  - refining the role_skill_map targets based on alumni data
"""


def find_similar_alumni(student_skills: list[str], role: str, db, top_k: int = 5):
    """STUB — implement in Phase 8."""
    raise NotImplementedError("similarity_engine is a Phase 8 stub.")
