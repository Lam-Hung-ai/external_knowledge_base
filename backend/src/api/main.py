from api.routes import chat
from fastapi import APIRouter

api_router = APIRouter()

api_router.include_router(chat.router)
