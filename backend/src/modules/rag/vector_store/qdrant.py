from langchain_core.embeddings import Embeddings
from langchain_core.vectorstores import VectorStore
from langchain_qdrant import FastEmbedSparse, QdrantVectorStore, RetrievalMode
from modules.rag.ingestion.embedding import EmbeddingFactory
from modules.rag.settings import rag_settings
from qdrant_client import QdrantClient
from qdrant_client.http.models import (
    Distance,
    SparseIndexParams,
    SparseVectorParams,
    VectorParams,
)


class Qdrant:
    _cache_sparse_embedding: FastEmbedSparse | None = None

    def __init__(
        self, url: str | None = None, embedding: Embeddings | None = None
    ) -> None:
        self.client = QdrantClient(url=url or rag_settings.vector_database_url)
        self.vector_config = {
            "dense": VectorParams(
                size=1024,
                distance=Distance.COSINE,
                on_disk=False,
            )
        }
        self.sparse_vectors_config = {
            "sparse": SparseVectorParams(index=SparseIndexParams(on_disk=False))
        }
        self.embedding = embedding or EmbeddingFactory.get_default_embedding()
        if not self._cache_sparse_embedding:
            self._cache_sparse_embedding = FastEmbedSparse(model_name="Qdrant/bm25")
        self.sparse_embedding = self._cache_sparse_embedding

    def connect(self, collection_name: str) -> VectorStore:
        if not self.client.collection_exists(collection_name):
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=self.vector_config,
                sparse_vectors_config=self.sparse_vectors_config,
            )

        return QdrantVectorStore(
            client=self.client,
            collection_name=collection_name,
            embedding=self.embedding,
            retrieval_mode=RetrievalMode.HYBRID,
            sparse_embedding=self.sparse_embedding,
            distance=Distance.COSINE,
            vector_name="dense",
            sparse_vector_name="sparse",
        )
