from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from enum import Enum

class UserRole(str, Enum):
    FIRST_RESPONDER = "first_responder"
    VOLUNTEER = "volunteer"
    USER = "user"
    GOVERNMENT = "government"

class Status(str, Enum):
    NORMAL = "normal"
    EMERGENCY = "emergency"

class BaseUser(BaseModel):
    name: str
    email: EmailStr
    phone: str
    profile_image_url: Optional[str] = None

class UserSignup(BaseUser):
    password: str
    role: UserRole
    skills: Optional[List[str]] = None  # for volunteers
    department: Optional[str] = None   # for first_responders and government
    unit: Optional[str] = None         # for first_responders
    position: Optional[str] = None     # for government

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    latitude: float
    longitude: float

class UserProfile(BaseUser):
    uid: str
    role: UserRole
    skills: Optional[List[str]] = None
    department: Optional[str] = None
    unit: Optional[str] = None
    position: Optional[str] = None
    status: Optional[Status] = Status.NORMAL

class DeleteUser(BaseModel):
    user_id: str
    
class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user_info: Dict[str, Any] 
    
    class Config:
        arbitrary_types_allowed = True