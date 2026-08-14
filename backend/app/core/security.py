"""
core/security.py — Authentication and RBAC helpers.

Implements:
  - Clerk JWT verification (JWKS endpoint fetch + signature check)
  - MANDATORY server-side domain restriction: every authenticated request
    independently verifies the user's email ends with settings.college_domain.
  - Role resolution: Student by default; Mentor/Admin only if a matching row
    exists in role_allowlist.
"""

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from dataclasses import dataclass
import json

from app.core.config import settings
from app.core.db import get_db
from app.models.student import Student
from app.models.role_allowlist import RoleAllowlist

security = HTTPBearer()

_jwks_cache = None
_user_cache = {}

@dataclass
class CurrentUser:
    email: str
    name: str
    role: str
    student_id: int | None


def require_role(*roles: str):
    """
    Dependency factory that restricts an endpoint to users whose role is one
    of *roles.  Raises HTTP 403 otherwise.

    Usage:
        @router.get("/some-route")
        async def handler(user = Depends(require_role("mentor", "admin"))):
            ...
    """
    def checker(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error": "Forbidden", "code": "FORBIDDEN"},
            )
        return current_user
    return checker


async def get_jwks():
    global _jwks_cache
    if _jwks_cache is None:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.clerk.com/v1/jwks",
                    headers={"Authorization": f"Bearer {settings.clerk_secret_key}"}
                )
                response.raise_for_status()
                _jwks_cache = response.json()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"error": "Failed to fetch JWKS from Clerk", "code": "JWKS_FETCH_FAILED"}
            )
    return _jwks_cache


async def verify_clerk_token(token: str) -> dict:
    jwks = await get_jwks()
    
    try:
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        for key in jwks.get("keys", []):
            if key["kid"] == unverified_header.get("kid"):
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break
        
        if not rsa_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": "Invalid token signature", "code": "INVALID_TOKEN"}
            )

        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            options={"verify_aud": False}
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "Invalid token", "code": "INVALID_TOKEN"}
        )


async def get_clerk_user_info(user_id: str) -> dict:
    if user_id in _user_cache:
        return _user_cache[user_id]
        
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.clerk.com/v1/users/{user_id}",
                headers={"Authorization": f"Bearer {settings.clerk_secret_key}"}
            )
            response.raise_for_status()
            data = response.json()
            
        email = None
        for email_obj in data.get("email_addresses", []):
            if email_obj.get("id") == data.get("primary_email_address_id"):
                email = email_obj.get("email_address")
                break
                
        if not email and data.get("email_addresses"):
            email = data["email_addresses"][0].get("email_address")
            
        first_name = data.get("first_name") or ""
        last_name = data.get("last_name") or ""
        name = f"{first_name} {last_name}".strip()
        if not name and email:
            name = email.split("@")[0]
            
        info = {"email": email, "name": name}
        _user_cache[user_id] = info
        return info
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "Failed to fetch user profile", "code": "USER_FETCH_FAILED"}
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> CurrentUser:
    token = credentials.credentials
    payload = await verify_clerk_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "Invalid token payload", "code": "INVALID_PAYLOAD"}
        )

    user_info = await get_clerk_user_info(user_id)
    email = user_info["email"]
    name = user_info["name"]
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "No email associated with account", "code": "NO_EMAIL"}
        )

    # Role check
    role_row = db.query(RoleAllowlist).filter(RoleAllowlist.email == email).first()
    role = role_row.role if role_row else "student"

    # MANDATORY domain check on EVERY call (bypassed for explicitly allowed roles)
    if role == "student" and not email.endswith(f"@{settings.college_domain}"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": f"Must use a {settings.college_domain} email", "code": "DOMAIN_RESTRICTED"}
        )

    # Auto-provision
    student = db.query(Student).filter(Student.email == email).first()
    if not student:
        student = Student(name=name, email=email)
        db.add(student)
        db.commit()
        db.refresh(student)

    return CurrentUser(
        email=email,
        name=name,
        role=role,
        student_id=student.id
    )
