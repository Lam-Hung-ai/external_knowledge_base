from abc import ABC, abstractmethod
from collections.abc import Generator

from ag_ui.core import BaseEvent


class AGUIStreamAdapter(ABC):
    @abstractmethod
    def transform(self, chunk) -> Generator[BaseEvent]: ...
