from pathlib import Path
from typing import Protocol

from langchain_core.documents import Document


class DocumentProcessor(Protocol):
    def process(self, file_path: str | Path) -> list[Document]: ...
