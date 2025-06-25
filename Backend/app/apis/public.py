from fastapi import APIRouter,Query,HTTPException
from fastapi.responses import JSONResponse
from app.services.near_disaster_service import get_nearby_disasters

router = APIRouter(prefix="/public", tags=["Public - No Authentication Required"])

@router.get("/status")
def disaster_status():
    return {"status": "active"}

@router.get("/nearby")
def nearby_check(
    latitude: float = Query(...),
    longitude: float = Query(...)
):
    try:
        data = get_nearby_disasters(latitude, longitude) 
        return JSONResponse(content=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))