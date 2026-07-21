from collections.abc import Iterable
from typing import cast

from docling_core.transforms.chunker.doc_chunk import DocChunk
from docling_core.transforms.chunker.hybrid_chunker import HybridChunker
from docling_core.transforms.chunker.tokenizer.huggingface import HuggingFaceTokenizer
from docling_core.types.doc.document import DoclingDocument

from langchain_core.documents import Document

tokenizer = HuggingFaceTokenizer.from_pretrained(
    model_name="microsoft/harrier-oss-v1-270m",
    max_tokens=512,
)

chunker = HybridChunker(
    tokenizer=tokenizer,
    repeat_table_header=True,
    omit_header_on_overflow=False,
    merge_peers=True,
    always_emit_headings=False,
    delim="\n\n",
)


def chunking(document: DoclingDocument) -> list[Document]:
    chunks = cast(Iterable[DocChunk], chunker.chunk(document))
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
