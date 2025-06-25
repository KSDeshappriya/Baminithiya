from pydantic import BaseModel

class EmergencyRequest(BaseModel):
    disasterId: str
    help: str
    urgencyType: str
    latitude: str
    longitude: str