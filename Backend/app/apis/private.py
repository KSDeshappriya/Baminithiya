from fastapi import APIRouter, Depends
from app.models.users import UserProfile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.auth_service import AuthService

router = APIRouter(prefix="/private", tags=["Private - Any Authenticated User"])
security = HTTPBearer()
auth_service = AuthService()

@router.get("/profile", response_model=UserProfile)
def get_profile(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    token_payload = auth_service.verify_token(token)
    uid = token_payload["uid"]
    return auth_service.get_user_profile(uid)

