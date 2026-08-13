from api.routes.chat import controller as chat_controller
from fastapi import APIRouter

api_router = APIRouter()
api_router.include_router(chat_controller.router, prefix="/chat", tags=["chat"])
