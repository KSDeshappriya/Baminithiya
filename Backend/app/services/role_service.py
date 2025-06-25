from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.auth_service import AuthService
from app.models.user import UserRole

security = HTTPBearer()
auth_service = AuthService()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    token_payload = auth_service.verify_token(token)
    uid = token_payload["uid"]
    user_profile = auth_service.get_user_profile(uid)
    return user_profile

def require_role(required_role: UserRole):
    def role_checker(current_user = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=403, 
                detail=f"Access denied. Required role: {required_role}"
            )
        return current_user
    return role_checker

def require_any_role():
    return get_current_user

# Pre-defined role dependencies
def require_government(current_user = Depends(get_current_user)):
    if current_user.role != UserRole.GOVERNMENT:
        raise HTTPException(status_code=403, detail="Government access only")
    return current_user

def require_user(current_user = Depends(get_current_user)):
    if current_user.role != UserRole.USER:
        raise HTTPException(status_code=403, detail="User access only")
    return current_user

def require_first_responder(current_user = Depends(get_current_user)):
    if current_user.role != UserRole.FIRST_RESPONDER:
        raise HTTPException(status_code=403, detail="First responder access only")
    return current_user

def require_volunteer(current_user = Depends(get_current_user)):
    if current_user.role != UserRole.VOLUNTEER:
        raise HTTPException(status_code=403, detail="Volunteer access only")
    return current_user