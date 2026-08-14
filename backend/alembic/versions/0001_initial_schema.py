"""Initial schema: students, role_skill_map, gap_snapshots, role_allowlist

Revision ID: 0001
Revises: (none — first migration)
Create Date: 2026-08-06

Tables created:
  - students
  - role_skill_map
  - gap_snapshots
  - role_allowlist

Note: JSONB columns (skills, required_skills, missing_skills) require PostgreSQL.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── role_skill_map ────────────────────────────────────────────────────
    # Created first because students.target_role_id references it
    op.create_table(
        "role_skill_map",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("role_name", sa.String(255), nullable=False),
        sa.Column("required_skills", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("source", sa.Text(), nullable=True),
        sa.Column(
            "last_updated",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("role_name"),
    )
    op.create_index("ix_role_skill_map_id", "role_skill_map", ["id"])
    op.create_index("ix_role_skill_map_role_name", "role_skill_map", ["role_name"])

    # Seed with initial roles so Phase 3's gap engine is testable immediately
    op.execute("""
        INSERT INTO role_skill_map (role_name, required_skills, source) VALUES
        (
            'SDE',
            '["Python", "Data Structures & Algorithms", "SQL", "Git", "React", "REST APIs", "Docker", "System Design"]',
            'industry template (seed data — replace with local recruiter JDs)'
        ),
        (
            'Data Analyst',
            '["Python", "SQL", "Excel", "Tableau", "Statistics", "Pandas", "NumPy", "Data Visualization"]',
            'industry template (seed data — replace with local recruiter JDs)'
        ),
        (
            'Product Manager',
            '["Product Thinking", "User Research", "SQL", "A/B Testing", "Wireframing", "Stakeholder Management", "Agile/Scrum"]',
            'industry template (seed data — replace with local recruiter JDs)'
        )
    """)

    # ── students ──────────────────────────────────────────────────────────
    op.create_table(
        "students",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column("target_role_id", sa.Integer(), nullable=True),
        sa.Column("skills", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["target_role_id"],
            ["role_skill_map.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_students_id", "students", ["id"])
    op.create_index("ix_students_email", "students", ["email"])

    # ── gap_snapshots ─────────────────────────────────────────────────────
    op.create_table(
        "gap_snapshots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column(
            "computed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("missing_skills", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(
            ["student_id"],
            ["students.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_gap_snapshots_id", "gap_snapshots", ["id"])
    op.create_index("ix_gap_snapshots_student_id", "gap_snapshots", ["student_id"])

    # ── role_allowlist ────────────────────────────────────────────────────
    op.create_table(
        "role_allowlist",
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("role", sa.String(50), nullable=False),
        sa.Column("added_by", sa.String(255), nullable=True),
        sa.Column(
            "added_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("email"),
    )


def downgrade() -> None:
    # Drop in reverse dependency order
    op.drop_table("role_allowlist")
    op.drop_index("ix_gap_snapshots_student_id", table_name="gap_snapshots")
    op.drop_index("ix_gap_snapshots_id", table_name="gap_snapshots")
    op.drop_table("gap_snapshots")
    op.drop_index("ix_students_email", table_name="students")
    op.drop_index("ix_students_id", table_name="students")
    op.drop_table("students")
    op.drop_index("ix_role_skill_map_role_name", table_name="role_skill_map")
    op.drop_index("ix_role_skill_map_id", table_name="role_skill_map")
    op.drop_table("role_skill_map")
