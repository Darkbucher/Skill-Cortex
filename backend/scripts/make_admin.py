import sys
import os

# Ensure the app module can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.db import SessionLocal
from app.models.role_allowlist import RoleAllowlist

def make_admin(email: str):
    db = SessionLocal()
    try:
        existing = db.query(RoleAllowlist).filter(RoleAllowlist.email == email).first()
        if existing:
            existing.role = "admin"
            print(f"Updated existing role for {email} to admin.")
        else:
            new_admin = RoleAllowlist(email=email, role="admin", added_by="system_script")
            db.add(new_admin)
            print(f"Successfully added {email} as admin.")
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python make_admin.py <email>")
        sys.exit(1)
    
    target_email = sys.argv[1]
    make_admin(target_email)
