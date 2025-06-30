from fastapi import APIRouter, Depends,HTTPException
from app.models.user import UserProfile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.auth_service import AuthService
from app.models.task import UpdateTaskStatusRequest
from app.services.appwrite_service import AppwriteService

router = APIRouter(prefix="/private", tags=["Private - Any Authenticated User"])
security = HTTPBearer()
auth_service = AuthService()
appwrite_service = AppwriteService()

@router.get("/profile", response_model=UserProfile)
def get_profile(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    token_payload = auth_service.verify_token(token)
    uid = token_payload["uid"]
    return auth_service.get_user_profile(uid)

@router.patch("/tasks/{task_id}")
async def update_task_status(task_id: str, payload: UpdateTaskStatusRequest, user: UserProfile = Depends(security)):
    try:
        result = appwrite_service.update_task_status(task_id, payload.status, payload.action_done_by)
        return {"message": f"Task {task_id} status updated to {payload.status}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update task status: {str(e)}")

