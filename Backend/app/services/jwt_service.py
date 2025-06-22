from jwt import ExpiredSignatureError, DecodeError, InvalidTokenError, encode, decode
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException
import os

class JWTService:
    def __init__(self):
        self.secret_key = os.getenv("JWT_SECRET_KEY")
        if not self.secret_key:
            raise ValueError("JWT_SECRET_KEY environment variable is not set")
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 60 * 24  # 24 hours
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now() + expires_delta
        else:
            expire = datetime.now() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({"exp": expire})
        encoded_jwt = encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str):
        try:
            if token.startswith("Bearer "):
                token = token[7:]
            payload = decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except (DecodeError, InvalidTokenError):
            raise HTTPException(status_code=401, detail="Invalid token")