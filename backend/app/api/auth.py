from fastapi import APIRouter, Depends
from app.core.security import get_current_user, CurrentUser

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.get("/me")
async def get_me(current_user: CurrentUser = Depends(get_current_user)):
    """
    Returns the currently authenticated user's information.
    Since get_current_user handles auto-provisioning and domain checks,
    this endpoint automatically ensures the user is valid and provisioned.
    """
    return {
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "student_id": current_user.student_id
    }
