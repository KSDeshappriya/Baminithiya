from fastapi import APIRouter

router = APIRouter(prefix="/public", tags=["Public - No Authentication Required"])

@router.get("/status")
def disaster_status():
    return {"status": "active"}