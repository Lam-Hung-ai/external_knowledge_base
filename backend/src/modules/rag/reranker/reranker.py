from enum import StrEnum, auto
from typing import Self

import httpx
from langchain_core.documents import Document
from pydantic import AliasChoices, BaseModel, Field

from modules.rag.settings import rag_settings

from .base import BaseRanker


class ReRankProvider(StrEnum):
    VOYAGEAI = auto()
    JINA = auto()
    COHERE = auto()
    OPENROUTER = auto()


class RerankResult(BaseModel):
    index: int
    relevance_score: float


class RerankApiResponse(BaseModel):
    results: list[RerankResult] = Field(
        validation_alias=AliasChoices("data", "results")
    )


class ReRanker(BaseRanker):
    @staticmethod
    def _define_provider(base_url: str) -> ReRankProvider:
        for provider in ReRankProvider:
            if provider in base_url:
                return provider
        raise ValueError(f"Unsupported rerank base URL: {base_url}")

    def __init__(self, model: str, base_url: str, api_key: str) -> None:
        self.model = model
        self.base_url = base_url
        self.api_key = api_key
        self.provider = self._define_provider(base_url)

    @classmethod
    def from_environment(cls) -> Self:
        """Create a reranker from the RAG_RERANK_* environment settings."""
        return cls(
            model=rag_settings.rerank_model,
            base_url=rag_settings.rerank_base_url,
            api_key=rag_settings.rerank_api_key,
        )

    def _build_payload(
        self, query: str, documents: list[Document] | list[str], top_n: int
    ) -> dict[str, object]:
        payload = {
            "model": self.model,
            "query": query,
            "return_documents": False,
            "documents": [
                document.page_content if isinstance(document, Document) else document
                for document in documents
            ],
        }
        if self.provider == ReRankProvider.VOYAGEAI:
            payload["top_k"] = top_n
        else:
            payload["top_n"] = top_n
        return payload

    @staticmethod
    def _parse_response(
        http_response: httpx.Response, documents: list[Document] | list[str]
    ) -> list[Document]:
        http_response.raise_for_status()
        rerank_response = RerankApiResponse.model_validate(http_response.json())
        selected_documents = [
            documents[result.index] for result in rerank_response.results
        ]
        return [
            Document(page_content=document) if isinstance(document, str) else document
            for document in selected_documents
        ]

    def rerank(
        self, query: str, documents: list[Document] | list[str], top_n: int = 5
    ) -> list[Document]:
        if not documents:
            return []

        response = httpx.post(
            url=self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json=self._build_payload(query, documents, top_n),
        )
        return self._parse_response(response, documents)

    async def arerank(
        self, query: str, documents: list[Document] | list[str], top_n: int = 5
    ) -> list[Document]:
        if not documents:
            return []

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url=self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=self._build_payload(query, documents, top_n),
            )
        return self._parse_response(response, documents)


if __name__ == "__main__":
    rerank = ReRanker.from_environment()
    rerank.rerank(
        query="What is the capital of France?",
        documents=[
            "The capital of France is Paris.",
            "France is a country in Europe.",
            "The Eiffel Tower is located in Paris.",
        ],
        top_n=2,
    )
