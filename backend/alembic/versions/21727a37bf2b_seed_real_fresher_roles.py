"""seed_real_fresher_roles

Revision ID: 21727a37bf2b
Revises: 0003
Create Date: 2026-08-15 11:11:16.527020

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '21727a37bf2b'
down_revision: Union[str, None] = '0003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


import json
from sqlalchemy.sql import table, column
from sqlalchemy import String, MetaData
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime

roles_data = [
    {
        "role_name": "Software Development Engineer (SDE)",
        "source": "Indeed/Glassdoor (August 2026 Fresher Postings)",
        "required_skills": [
            {"skill": "Python", "min_level": "intermediate"},
            {"skill": "SQL", "min_level": "intermediate"},
            {"skill": "React", "min_level": "beginner"},
            {"skill": "Docker", "min_level": "beginner"},
            {"skill": "Data Structures & Algorithms", "min_level": "advanced"},
            {"skill": "Git", "min_level": "intermediate"}
        ]
    },
    {
        "role_name": "Data Analyst",
        "source": "Indeed/Glassdoor (August 2026 Fresher Postings)",
        "required_skills": [
            {"skill": "SQL", "min_level": "advanced"},
            {"skill": "Excel", "min_level": "advanced"},
            {"skill": "Python", "min_level": "intermediate"},
            {"skill": "Power BI", "min_level": "intermediate"},
            {"skill": "Tableau", "min_level": "intermediate"},
            {"skill": "Statistics", "min_level": "intermediate"},
            {"skill": "Data Visualization", "min_level": "advanced"}
        ]
    },
    {
        "role_name": "Product Manager",
        "source": "Internshala/Glassdoor (August 2026 Associate PM Postings)",
        "required_skills": [
            {"skill": "Product Management", "min_level": "advanced"},
            {"skill": "SQL", "min_level": "beginner"},
            {"skill": "Agile", "min_level": "intermediate"},
            {"skill": "Data Analytics", "min_level": "intermediate"},
            {"skill": "Communication", "min_level": "advanced"},
            {"skill": "Market Research", "min_level": "intermediate"},
            {"skill": "Jira", "min_level": "intermediate"}
        ]
    },
    {
        "role_name": "DevOps Engineer",
        "source": "Indeed India (August 2026 Junior/Fresher DevOps Postings)",
        "required_skills": [
            {"skill": "Linux", "min_level": "advanced"},
            {"skill": "Python", "min_level": "intermediate"},
            {"skill": "Bash", "min_level": "intermediate"},
            {"skill": "CI/CD Pipelines", "min_level": "intermediate"},
            {"skill": "AWS", "min_level": "beginner"},
            {"skill": "Kubernetes", "min_level": "beginner"}
        ]
    },
    {
        "role_name": "QA Automation Engineer",
        "source": "Indeed India (August 2026 Fresher QA Postings)",
        "required_skills": [
            {"skill": "Manual Testing", "min_level": "advanced"},
            {"skill": "UI Testing", "min_level": "intermediate"},
            {"skill": "API Testing (Postman)", "min_level": "intermediate"},
            {"skill": "Software Testing Lifecycle (STLC)", "min_level": "advanced"},
            {"skill": "Root Cause Analysis", "min_level": "intermediate"}
        ]
    }
]

def upgrade() -> None:
    role_skill_map_table = table(
        'role_skill_map',
        column('role_name', String),
        column('required_skills', JSONB),
        column('source', String)
    )
    
    # Delete all old placeholder data
    op.execute("DELETE FROM role_skill_map")
    
    # Insert new roles
    op.bulk_insert(
        role_skill_map_table,
        [
            {
                "role_name": role["role_name"],
                "required_skills": role["required_skills"],
                "source": role["source"]
            }
            for role in roles_data
        ]
    )


def downgrade() -> None:
    op.execute("DELETE FROM role_skill_map")
