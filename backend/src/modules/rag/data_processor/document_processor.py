from collections.abc import Iterable
from pathlib import Path
from typing import cast

from docling.datamodel.base_models import InputFormat
from docling.document_converter import DocumentConverter
from docling_core.transforms.chunker.doc_chunk import DocChunk
from docling_core.transforms.chunker.hybrid_chunker import HybridChunker
from docling_core.transforms.chunker.tokenizer.huggingface import HuggingFaceTokenizer
from docling_core.types.doc.document import DoclingDocument
from langchain_core.documents import Document

from modules.rag.settings import rag_settings

ALLOWWED_FORMATS = [InputFormat.DCLX, InputFormat.PDF, InputFormat.MD, InputFormat.HTML]


class DoclingDocumentProcessor:
    def __init__(self) -> None:
        self.converter = DocumentConverter(allowed_formats=ALLOWWED_FORMATS)
        self.tokenizer = HuggingFaceTokenizer.from_pretrained(
            model_name="microsoft/harrier-oss-v1-270m",
            max_tokens=rag_settings.chunk_size,
        )

        self.chunker = HybridChunker(
            tokenizer=self.tokenizer,
            repeat_table_header=True,
            omit_header_on_overflow=False,
            merge_peers=True,
            always_emit_headings=False,
        )

    def _convert_document(self, file_path: str | Path) -> DoclingDocument:
        file_path = Path(file_path)
        result = self.converter.convert(source=file_path)
        return result.document

    def _chunking(self, document: DoclingDocument) -> list[Document]:
        chunks = cast(Iterable[DocChunk], self.chunker.chunk(document))
        results: list[Document] = []

        for chunk in chunks:
            origin = chunk.meta.origin

            results.append(
                Document(
                    page_content=chunk.text,
                    metadata={
                        "headings": chunk.meta.headings or [],
                        "file_name": origin.filename if origin else None,
                    },
                )
            )

        return results

    def process(self, file_path: str | Path) -> list[Document]:
        document = self._convert_document(file_path)
        return self._chunking(document)
