"""seed initial admin

Revision ID: 902dcdfa6ff2
Revises: 21727a37bf2b
Create Date: 2026-08-15 11:51:35.478142

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '902dcdfa6ff2'
down_revision: Union[str, None] = '21727a37bf2b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        INSERT INTO role_allowlist (email, role, added_by)
        VALUES ('adarsh.25708@knit.ac.in', 'admin', 'system_migration')
        ON CONFLICT (email) DO UPDATE SET role = 'admin';
        """
    )


def downgrade() -> None:
    op.execute(
        "DELETE FROM role_allowlist WHERE email = 'adarsh.25708@knit.ac.in';"
    )
