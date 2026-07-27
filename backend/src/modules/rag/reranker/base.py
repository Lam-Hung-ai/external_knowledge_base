from abc import ABC, abstractmethod

from langchain_core.documents import Document


class BaseRanker(ABC):
    @abstractmethod
    def rerank(
        self, query: str, documents: list[Document] | list[str], top_n: int = 5
    ) -> list[Document]: ...

    @abstractmethod
    async def arerank(
        self, query: str, documents: list[Document] | list[str], top_n: int = 5
    ) -> list[Document]: ...
