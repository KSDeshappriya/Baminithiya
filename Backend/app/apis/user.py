from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query as FastAPIQuery
from app.services.role_service import require_user
from app.models.user import UserProfile
from typing import Optional
from app.services.third_workflow import process_emergency_request, delete_task_by_id
from app.services.first_workflow import handle_emergency_report
from app.models.userrequest import EmergencyRequest
from app.services.appwrite_service import AppwriteService
from appwrite.query import Query

router = APIRouter(prefix="/user", tags=["Users"])

appwrite_service = AppwriteService()


@router.get("/dashboard")
def user_dashboard(current_user: UserProfile = Depends(require_user)):
    return {
        "message": "User Dashboard",
        "user": current_user.name,
        "location": {"lat": current_user.latitude, "lng": current_user.longitude}
    }


# --- Emergency Report Endpoint ---
@router.post("/emergency/report")
async def emergency_report(
    emergencyType: str = Form(...),
    urgencyLevel: str = Form(...),
    situation: str = Form(...),
    peopleCount: str = Form(...),
    latitude: str = Form(...),
    longitude: str = Form(...),
    image: Optional[UploadFile] = File(None),
    current_user: UserProfile = Depends(require_user)
):
    # Call the emergency service function (placeholder for future logic)
    await handle_emergency_report(
        emergencyType=emergencyType,
        urgencyLevel=urgencyLevel,
        situation=situation,
        peopleCount=peopleCount,
        latitude=latitude,
        longitude=longitude,
        image=image,
        user=current_user
    )

    return {"status": "received"}


@router.post("/emergency/request")
async def report_emergency(
    body: EmergencyRequest,
    current_user: UserProfile = Depends(require_user)
):
    try:
        # Extract values from the request body
        disasterId = body.disasterId
        help = body.help
        urgencyType = body.urgencyType
        latitude = body.latitude
        longitude = body.longitude
        # Validate required fields
        if not all([disasterId, help, urgencyType, latitude, longitude]):
            raise HTTPException(status_code=400, detail="All fields are required")
        # Validate coordinates
        try:
            lat = float(latitude)
            lon = float(longitude)
            if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
                raise ValueError("Invalid coordinates")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid latitude or longitude")
        # Validate urgency type
        if urgencyType not in ["low", "medium", "high"]:
            raise HTTPException(status_code=400, detail="Invalid urgency type")
        try:
            result = await process_emergency_request(
                disaster_id=disasterId,
                user_id=current_user.uid,
                help=help.strip(),
                urgency_type=urgencyType,
                latitude=latitude,
                longitude=longitude
            )
            return {
                "status": "received",
                "message": "Emergency request processed successfully",
                "task_id": result.get("generated_task", {}).get("task_id"),
                "user_request_saved": True
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail="Failed to process emergency request")
    except HTTPException as he:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/emergency/request")
async def get_user_request(
    disasterId: str = FastAPIQuery(...),
    userId: str = FastAPIQuery(...),
    current_user: UserProfile = Depends(require_user)
):
    try:
        docs = appwrite_service.databases.list_documents(
            database_id=appwrite_service.database_id,
            collection_id=appwrite_service.user_requests_collection_id,
            queries=[
                Query.equal("disaster_id", disasterId),
                Query.equal("userId", userId)
            ]
        )
        if docs["total"] == 0:
            return {"exists": False}
        return {"exists": True, "request": docs["documents"][0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user request: {e}")


@router.delete("/emergency/request")
async def delete_user_request(
    disasterId: str = FastAPIQuery(...),
    userId: str = FastAPIQuery(...),
    current_user: UserProfile = Depends(require_user)
):
    try:
        docs = appwrite_service.databases.list_documents(
            database_id=appwrite_service.database_id,
            collection_id=appwrite_service.user_requests_collection_id,
            queries=[
                Query.equal("disaster_id", disasterId),
                Query.equal("userId", userId)
            ]
        )
        if docs["total"] == 0:
            raise HTTPException(status_code=404, detail="User request not found")
        doc = docs["documents"][0]
        appwrite_service.delete_user_request_document(doc["$id"])
        task_id = doc.get("task_id")
        if task_id:
            try:
                delete_task_by_id(task_id)
            except Exception as e:
                print(f"Warning: Failed to delete associated task: {e}")
        return {"deleted": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user request: {e}")