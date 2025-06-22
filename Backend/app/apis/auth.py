from fastapi import APIRouter,Depends
from fastapi.security import HTTPBearer
from app.services.auth_service import AuthService
from app.models.users import UserSignup, UserLogin, Token
from app.services.role_service import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()
auth_service = AuthService()

@router.post("/signup")
def signup(user_data: UserSignup):
    return auth_service.create_user(user_data)

@router.post("/login", response_model=Token)
def login(login_data: UserLogin):
    return auth_service.login_user(login_data)

@router.get("/profile")
def get_profile(current_user = Depends(get_current_user)):
    """Get current user profile"""
    return current_user