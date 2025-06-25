
from pydantic import BaseModel

class DisasterRequest(BaseModel):
    disaster_id: str