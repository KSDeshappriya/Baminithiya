
from pydantic import BaseModel

class ResourcePayload(BaseModel):
    disasterId: str
    data: dict

class DeleteResourceRequest(BaseModel):
    resource_id: str

class UpdateAvailabilityRequest(BaseModel):
    resource_id: str
    availability: int