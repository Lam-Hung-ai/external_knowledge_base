from pathlib import Path

from langchain_core.vectorstores import VectorStore
from modules.rag.ingestion.base import DocumentProcessor
from modules.rag.ingestion.document_processor import DoclingDocumentProcessor


class IngestionPipeline:
    def __init__(
        self, document_processor: DocumentProcessor | None, vector_store: VectorStore
    ) -> None:
        self.document_processor = document_processor or DoclingDocumentProcessor()
        self.vector_store = vector_store

    async def aingest(self, file_path: str | Path) -> None:
        documents = self.document_processor.process(file_path)
        await self.vector_store.aadd_documents(documents)

    def ingest(self, file_path: str | Path) -> None:
        documents = self.document_processor.process(file_path)
        self.vector_store.add_documents(documents)
