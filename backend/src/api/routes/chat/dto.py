from datetime import datetime

from pydantic import BaseModel, field_validator


class ChatCreateReq(BaseModel):
    content: str
    knowledge_ids: list[str] | None = None


class ChatCreateRes(BaseModel):
    id: str
    user_id: str
    title: str
    chat: dict
    updated_at: datetime
    created_at: datetime
    share_id: str | None = None  # id of the chat to be shared
    archived: bool
    pinned: bool | None = False
    meta: dict = {}
    variables: dict = {}
    folder_id: str | None = None

    tasks: list | None = None
    summary: str | None = None
    current_message_id: str | None = None
    context_usage: dict | None = None

    @field_validator("variables", mode="before")
    @classmethod
    def normalize_variables(cls, value):
        return value if isinstance(value, dict) else {}
