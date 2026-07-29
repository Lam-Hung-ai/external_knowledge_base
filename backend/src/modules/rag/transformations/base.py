from langchain.messages import AnyMessage
from abc import ABC, abstractmethod
from langchain_core.language_models import BaseChatModel


class BaseTransformation(ABC):
    def __init__(self, llm: BaseChatModel, max_history_messages: int = 5) -> None:
        self.llm = llm
        self.max_history_messages = max_history_messages

    @abstractmethod
    def transform(self, query: str, history: list[dict | AnyMessage]) -> list[str]: ...
