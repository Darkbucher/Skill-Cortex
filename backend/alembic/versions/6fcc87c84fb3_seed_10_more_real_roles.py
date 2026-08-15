"""seed 10 more real roles

Revision ID: 6fcc87c84fb3
Revises: 902dcdfa6ff2
Create Date: 2026-08-15 11:57:02.548451

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = '6fcc87c84fb3'
down_revision: Union[str, None] = '902dcdfa6ff2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    role_skill_map = sa.table(
        'role_skill_map',
        sa.column('role_name', sa.String),
        sa.column('required_skills', JSONB),
        sa.column('source', sa.String)
    )

    roles_data = [
        {
            "role_name": "Frontend Developer",
            "source": "2026 Industry Standard (Entry Level)",
            "required_skills": [
                {"skill": "JavaScript", "level": "intermediate"},
                {"skill": "React", "level": "intermediate"},
                {"skill": "HTML5", "level": "intermediate"},
                {"skill": "CSS3", "level": "intermediate"},
                {"skill": "TailwindCSS", "level": "beginner"},
                {"skill": "Git", "level": "beginner"}
            ]
        },
        {
            "role_name": "Backend Developer",
            "source": "2026 Industry Standard (Entry Level)",
            "required_skills": [
                {"skill": "Python", "level": "intermediate"},
                {"skill": "Node.js", "level": "intermediate"},
                {"skill": "PostgreSQL", "level": "beginner"},
                {"skill": "REST APIs", "level": "intermediate"},
                {"skill": "Docker", "level": "beginner"},
                {"skill": "Git", "level": "beginner"}
            ]
        },
        {
            "role_name": "Full Stack Developer",
            "source": "2026 Industry Standard (Entry Level)",
            "required_skills": [
                {"skill": "JavaScript", "level": "intermediate"},
                {"skill": "React", "level": "beginner"},
                {"skill": "Node.js", "level": "beginner"},
                {"skill": "SQL", "level": "beginner"},
                {"skill": "API Design", "level": "beginner"},
                {"skill": "Git", "level": "beginner"}
            ]
        },
        {
            "role_name": "Data Scientist",
            "source": "2026 Industry Standard (Entry Level)",
            "required_skills": [
                {"skill": "Python", "level": "intermediate"},
                {"skill": "Machine Learning", "level": "beginner"},
                {"skill": "Pandas", "level": "intermediate"},
                {"skill": "SQL", "level": "beginner"},
                {"skill": "Statistics", "level": "intermediate"},
                {"skill": "Data Visualization", "level": "beginner"}
            ]
        },
        {
            "role_name": "Machine Learning Engineer",
            "source": "2026 Industry Standard (Entry Level)",
            "required_skills": [
                {"skill": "Python", "level": "advanced"},
                {"skill": "PyTorch", "level": "beginner"},
                {"skill": "TensorFlow", "level": "beginner"},
                {"skill": "Algorithms", "level": "intermediate"},
                {"skill": "Data Structures", "level": "intermediate"},
                {"skill": "Git", "level": "beginner"}
            ]
        },
        {
            "role_name": "Cloud Engineer",
            "source": "2026 Industry Standard (Entry Level)",
            "required_skills": [
                {"skill": "AWS", "level": "beginner"},
                {"skill": "Linux", "level": "intermediate"},
                {"skill": "Python", "level": "beginner"},
                {"skill": "Docker", "level": "intermediate"},
                {"skill": "Kubernetes", "level": "beginner"},
                {"skill": "Networking", "level": "beginner"}
            ]
        },
        {
            "role_name": "Security Analyst",
            "source": "2026 Industry Standard (Entry Level)",
            "required_skills": [
                {"skill": "Cryptography", "level": "intermediate"},
                {"skill": "Network Security", "level": "beginner"},
                {"skill": "Linux", "level": "intermediate"},
                {"skill": "Python", "level": "beginner"}
            ]
        },
        {
            "role_name": "Mobile App Developer",
            "source": "2026 Industry Standard (Entry Level)",
            "required_skills": [
                {"skill": "Flutter", "level": "beginner"},
                {"skill": "React Native", "level": "beginner"},
                {"skill": "Java", "level": "intermediate"},
                {"skill": "Swift", "level": "beginner"},
                {"skill": "UI/UX Design", "level": "beginner"},
                {"skill": "Git", "level": "beginner"}
            ]
        },
        {
            "role_name": "UI/UX Designer",
            "source": "2026 Industry Standard (Entry Level)",
            "required_skills": [
                {"skill": "Figma", "level": "intermediate"},
                {"skill": "UI/UX Design", "level": "intermediate"},
                {"skill": "Wireframing", "level": "beginner"},
                {"skill": "User Research", "level": "beginner"},
                {"skill": "HTML5", "level": "beginner"}
            ]
        },
        {
            "role_name": "Database Administrator",
            "source": "2026 Industry Standard (Entry Level)",
            "required_skills": [
                {"skill": "SQL", "level": "advanced"},
                {"skill": "PostgreSQL", "level": "intermediate"},
                {"skill": "Database Design", "level": "intermediate"},
                {"skill": "Performance Tuning", "level": "beginner"},
                {"skill": "Linux", "level": "beginner"}
            ]
        }
    ]

    op.bulk_insert(
        role_skill_map,
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
    role_names = [
        "Frontend Developer", "Backend Developer", "Full Stack Developer",
        "Data Scientist", "Machine Learning Engineer", "Cloud Engineer",
        "Security Analyst", "Mobile App Developer", "UI/UX Designer",
        "Database Administrator"
    ]
    
    op.execute(
        sa.text("DELETE FROM role_skill_map WHERE role_name IN :roles")
        .bindparams(roles=tuple(role_names))
    )
