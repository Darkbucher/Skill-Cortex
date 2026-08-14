"""Skill Levels (Option B): level-aware skills and gap snapshots

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-07

Changes:
  1. Migrate students.skills from list[str] → list[{skill, level}]
     Existing bare strings are wrapped as {"skill": <name>, "level": "beginner"}.
  2. Migrate role_skill_map.required_skills from list[str] → list[{skill, min_level}]
     Seeded rows are updated with sensible min_level defaults.
     Any admin-created rows that are still plain strings are wrapped at "intermediate".
  3. Add gap_snapshots.level_gap_skills JSONB NOT NULL DEFAULT '[]'
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Migrate students.skills ────────────────────────────────────────────
    # Convert each element of the JSONB array:
    #   "Python"  →  {"skill": "Python", "level": "beginner"}
    # Elements that are already objects (have a "skill" key) are left untouched.
    op.execute("""
        UPDATE students
        SET skills = (
            SELECT jsonb_agg(
                CASE
                    WHEN jsonb_typeof(elem) = 'string'
                        THEN jsonb_build_object('skill', elem #>> '{}', 'level', 'beginner')
                    ELSE elem
                END
            )
            FROM jsonb_array_elements(COALESCE(skills, '[]'::jsonb)) AS elem
        )
        WHERE skills IS NOT NULL
          AND jsonb_array_length(COALESCE(skills, '[]'::jsonb)) > 0
    """)

    # ── 2. Migrate role_skill_map.required_skills ────────────────────────────
    # First, wrap any plain-string entries at "intermediate" (catch-all for
    # any admin-created roles that pre-date this migration).
    op.execute("""
        UPDATE role_skill_map
        SET required_skills = (
            SELECT jsonb_agg(
                CASE
                    WHEN jsonb_typeof(elem) = 'string'
                        THEN jsonb_build_object('skill', elem #>> '{}', 'min_level', 'intermediate')
                    ELSE elem
                END
            )
            FROM jsonb_array_elements(COALESCE(required_skills, '[]'::jsonb)) AS elem
        )
        WHERE required_skills IS NOT NULL
          AND jsonb_array_length(COALESCE(required_skills, '[]'::jsonb)) > 0
    """)

    # Now apply thoughtful per-role min_level overrides for the three seed roles.
    # SDE — most skills at intermediate, System Design at advanced
    op.execute("""
        UPDATE role_skill_map
        SET required_skills = '[
            {"skill": "Python",                        "min_level": "intermediate"},
            {"skill": "Data Structures & Algorithms",  "min_level": "intermediate"},
            {"skill": "SQL",                           "min_level": "beginner"},
            {"skill": "Git",                           "min_level": "beginner"},
            {"skill": "React",                         "min_level": "intermediate"},
            {"skill": "REST APIs",                     "min_level": "intermediate"},
            {"skill": "Docker",                        "min_level": "beginner"},
            {"skill": "System Design",                 "min_level": "advanced"}
        ]'::jsonb
        WHERE role_name = 'SDE'
    """)

    # Data Analyst — Python/SQL at intermediate, visualisation tools at beginner
    op.execute("""
        UPDATE role_skill_map
        SET required_skills = '[
            {"skill": "Python",             "min_level": "intermediate"},
            {"skill": "SQL",                "min_level": "intermediate"},
            {"skill": "Excel",              "min_level": "beginner"},
            {"skill": "Tableau",            "min_level": "beginner"},
            {"skill": "Statistics",         "min_level": "intermediate"},
            {"skill": "Pandas",             "min_level": "intermediate"},
            {"skill": "NumPy",              "min_level": "beginner"},
            {"skill": "Data Visualization", "min_level": "beginner"}
        ]'::jsonb
        WHERE role_name = 'Data Analyst'
    """)

    # Product Manager — most soft skills at intermediate
    op.execute("""
        UPDATE role_skill_map
        SET required_skills = '[
            {"skill": "Product Thinking",       "min_level": "intermediate"},
            {"skill": "User Research",           "min_level": "beginner"},
            {"skill": "SQL",                     "min_level": "beginner"},
            {"skill": "A/B Testing",             "min_level": "beginner"},
            {"skill": "Wireframing",             "min_level": "intermediate"},
            {"skill": "Stakeholder Management",  "min_level": "intermediate"},
            {"skill": "Agile/Scrum",             "min_level": "beginner"}
        ]'::jsonb
        WHERE role_name = 'Product Manager'
    """)

    # ── 3. Add level_gap_skills column to gap_snapshots ──────────────────────
    op.add_column(
        "gap_snapshots",
        sa.Column(
            "level_gap_skills",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )


def downgrade() -> None:
    # ── 3. Remove level_gap_skills column ────────────────────────────────────
    op.drop_column("gap_snapshots", "level_gap_skills")

    # ── 2. Revert role_skill_map.required_skills to list[str] ────────────────
    op.execute("""
        UPDATE role_skill_map
        SET required_skills = (
            SELECT jsonb_agg(
                CASE
                    WHEN jsonb_typeof(elem) = 'object'
                        THEN to_jsonb(elem->>'skill')
                    ELSE elem
                END
            )
            FROM jsonb_array_elements(COALESCE(required_skills, '[]'::jsonb)) AS elem
        )
        WHERE required_skills IS NOT NULL
    """)

    # ── 1. Revert students.skills to list[str] ────────────────────────────────
    op.execute("""
        UPDATE students
        SET skills = (
            SELECT jsonb_agg(
                CASE
                    WHEN jsonb_typeof(elem) = 'object'
                        THEN to_jsonb(elem->>'skill')
                    ELSE elem
                END
            )
            FROM jsonb_array_elements(COALESCE(skills, '[]'::jsonb)) AS elem
        )
        WHERE skills IS NOT NULL
    """)
