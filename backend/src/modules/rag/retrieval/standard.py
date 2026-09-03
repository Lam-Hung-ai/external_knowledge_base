from collections.abc import Sequence

from langchain.messages import AnyMessage
from langchain_core.documents import Document
from langchain_core.vectorstores import VectorStore

from modules.rag.reranker import BaseRanker

from .base import BaseRetrieval


class StandardRetrieval(BaseRetrieval):
    def __init__(self, vector_store: VectorStore, reranker: BaseRanker, top_k: int = 5):
        self.vector_store = vector_store
        self.reranker = reranker
        self.top_k = top_k

    def retrieval(
        self,
        query: str,
        histtory: Sequence[dict | AnyMessage] = [],
    ) -> list[Document]:
        retriever = self.vector_store.as_retriever(
            search_type="mmr",
            search_kwargs={
                "k": self.top_k + 5,
                "fetch_k": 25,
                "lambda_mult": 0.6,
            },
        )
        similarity_docunents = retriever.invoke(query)
        reranked_documenst = self.reranker.rerank(query, similarity_docunents)
        return reranked_documenst
