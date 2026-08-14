"""
models/role_allowlist.py — Admin-maintained list of users with elevated roles.

Added per Architecture.md §4a + Phase 0 plan Fix 2:
  "Mentor and Admin roles are not self-assignable — they're granted via an
   admin-maintained allowlist (email → role mapping table), checked at login time."

Schema:
  email (PK) — the full college email address of the elevated user
  role        — one of: 'mentor', 'admin'  (Student is the default, not listed here)
  added_by    — email of the admin who granted the role
  added_at    — timestamp of grant

Phase 1's login provisioning logic:
  1. User authenticates with Google (college domain verified).
  2. Look up user's email in this table.
  3. If found → assign that role; if not found → default to 'student'.
  4. No endpoint may let a user set their own role — only an admin can INSERT here.
"""

from datetime import datetime

from sqlalchemy import DateTime, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class RoleAllowlist(Base):
    __tablename__ = "role_allowlist"

    # The college email address being granted elevated access
    email: Mapped[str] = mapped_column(String(255), primary_key=True)

    # 'mentor' or 'admin' — Student is never stored here (it's the default)
    role: Mapped[str] = mapped_column(String(50), nullable=False)

    # Audit trail — who granted this and when
    added_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )

    def __repr__(self) -> str:
        return f"<RoleAllowlist email={self.email!r} role={self.role!r}>"
