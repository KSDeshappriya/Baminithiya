from app.apis.auth import router as auth_router
from app.apis.private import router as private_router
from app.apis.public import router as public_router
from app.apis.user import router as user_router
from app.apis.government import router as government_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router) 
app.include_router(private_router)
app.include_router(public_router)
app.include_router(user_router)
app.include_router(government_router)