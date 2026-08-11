from api.deps import get_current_user
from fastapi import APIRouter, Depends

router = APIRouter()


@router.get("/chat", dependencies=[Depends(get_current_user)])
async def get_chat():
    return {"message": "Hello, Chat!"}
