from api.deps import get_current_user
from fastapi import APIRouter, Depends

from .dto import ChatCreateReq, ChatCreateRes

router = APIRouter()


@router.post(
    "/new", dependencies=[Depends(get_current_user)], response_model=ChatCreateRes
)
async def create_chat(request: ChatCreateReq) -> ChatCreateRes:
    return ChatCreateRes(chat_id="1", current_message_id="1")
