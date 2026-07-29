from abc import ABC
from collections.abc import Sequence

from langchain.messages import AnyMessage
from langchain_core.documents import Document


class BaseRetrieval(ABC):
    def retrieval(
        self, query: str, histtory: Sequence[dict | AnyMessage] = []
    ) -> list[Document]: ...
