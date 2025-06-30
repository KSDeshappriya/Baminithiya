from pydantic import BaseModel
from typing import Optional

class UpdateTaskStatusRequest(BaseModel):
    status: str
    action_done_by: Optional[str] = None 