from fastapi import HTTPException
from app.models.users import UserSignup, UserLogin, UserProfile, Token, Status
from app.services.jwt_service import JWTService
from app.services.appwrite_service import AppwriteService
import bcrypt
import yaml
import pygeohash as ph


with open("trusted_domain.yaml", "r") as file:
    TRUSTED_DOMAINS = yaml.safe_load(file)

class AuthService:
    def __init__(self):
        self.appwrite = AppwriteService()
        self.jwt_service = JWTService()
    
    def is_domain_trusted(self, email: str, role: str) -> bool:
        domain = email.split('@')[-1].lower()
        if role == "government":
            return domain in TRUSTED_DOMAINS.get("gov", [])
        elif role == "first_responder":
            return domain in TRUSTED_DOMAINS.get("first_responders", [])
        return True  
    
    def hash_password(self, password: str) -> str:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    def create_user(self, user_data: UserSignup):
        try:
            # Check if user already exists
            existing_user = self.appwrite.get_user_by_email_from_auth(user_data.email)
            if existing_user:
                raise HTTPException(status_code=400, detail="Email already registered")

            if not self.is_domain_trusted(user_data.email, user_data.role):
                raise HTTPException(status_code=403, detail=f"Email domain not allowed for role: {user_data.role}")

            # Create user account in Appwrite Auth
            auth_user = self.appwrite.create_user_account(
                email=user_data.email,
                password=user_data.password,
                name=user_data.name
            )

            user_uid = auth_user['$id']

            # Prepare user document data
            user_doc = {
                "uid": user_uid,
                "name": user_data.name,
                "email": user_data.email,
                "phone": user_data.phone,
                "profile_image_url": user_data.profile_image_url,
                "role": user_data.role,
            }

            if user_data.role != "government":
                user_doc["status"] = Status.NORMAL

            if user_data.role == "volunteer":
                if user_data.skills:
                    user_doc["skills"] = user_data.skills

            elif user_data.role in {"first_responder", "government"}:
                if user_data.department:
                    user_doc["department"] = user_data.department
                if user_data.role == "first_responder" and user_data.unit:
                    user_doc["unit"] = user_data.unit
                if user_data.role == "government" and user_data.position:
                    user_doc["position"] = user_data.position

            # Create user profile document
            self.appwrite.create_user_document(user_uid, user_doc)

            return {"message": "User created successfully", "uid": user_uid}

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
        
    def login_user(self, login_data: UserLogin):
        try:
            auth_user = self.appwrite.get_user_by_email_from_auth(login_data.email)
            if not auth_user:
                raise HTTPException(status_code=401, detail="Invalid email or password")
            user_uid = auth_user['$id']
            try:
                self.appwrite.verify_user_credentials(login_data.email, login_data.password)

            except Exception as e:
                print(f"Authentication failed: {str(e)}")  # Debug log
                # Check if it's specifically an authentication error
                if "Invalid credentials" in str(e) or "unauthorized" in str(e).lower():
                    raise HTTPException(status_code=401, detail="Invalid email or password")
                else:
                    # For other errors, provide more specific information
                    raise HTTPException(status_code=500, detail=f"Authentication service error: {str(e)}")
            user_document = self.appwrite.get_user_document(user_uid)
            if not user_document:
                raise HTTPException(status_code=401, detail="User profile not found")

            geohash_value = ph.encode(login_data.latitude, login_data.longitude, precision=4)
            update_data = {
                "latitude": login_data.latitude,
                "longitude": login_data.longitude,
                "geohash": geohash_value,
            }
            self.appwrite.update_user_document(user_uid, update_data)
            user_document.update(update_data)
            token_payload = {
                "uid": str(user_document["uid"]),
                "email": str(user_document["email"]),
                "role": str(user_document["role"]),
                "name": str(user_document["name"])
            }

            access_token = self.jwt_service.create_access_token(data=token_payload)

            user_info = {
                k: (str(v) if not isinstance(v, (str, int, float, bool, list, dict)) else v)
                for k, v in user_document.items()
                if k not in ["password_hash", "$id", "$createdAt", "$updatedAt", "$permissions", "$databaseId", "$collectionId"]
            }

            token_data = {
                "access_token": access_token,
                "token_type": "bearer",
                "expires_in": self.jwt_service.access_token_expire_minutes * 60,
                "user_info": user_info
            }

            return Token(**token_data)

        except Exception as e:
            print(f"Login error: {e}")
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=400, detail=str(e))
        
    def verify_token(self, token: str):
        return self.jwt_service.verify_token(token)
    
    def get_user_profile(self, uid: str):
        try:
            user_document = self.appwrite.get_user_document(uid)
            if not user_document:
                raise HTTPException(status_code=404, detail="User not found")
            user_data = {}
            for key, value in user_document.items():
                if key not in ["password_hash", "$id", "$createdAt", "$updatedAt", "$permissions", "$databaseId", "$collectionId"]:
                    user_data[key] = value
            
            return UserProfile(**user_data)
            
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=400, detail=str(e))