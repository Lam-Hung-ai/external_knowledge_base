import logging
from enum import StrEnum
from typing import ClassVar

from langchain.embeddings import Embeddings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import OpenAIEmbeddings

from modules.rag.settings import rag_settings

logger = logging.getLogger(__name__)


class EmbeddingProvider(StrEnum):
    OPENAI = "openai"
    HUGGINGFACE = "huggingface"


class EmbeddingFactory:
    _registry: ClassVar[dict[EmbeddingProvider, type[Embeddings]]] = {
        EmbeddingProvider.OPENAI: OpenAIEmbeddings,
        EmbeddingProvider.HUGGINGFACE: HuggingFaceEmbeddings,
    }
    _instances: ClassVar[dict[str, Embeddings]] = {}

    @classmethod
    def create(
        cls, provider: EmbeddingProvider, model: str, use_cache: bool = True, **kwargs
    ):
        if provider not in cls._registry:
            raise ValueError(
                f"Provider f{provider} is not registered! Avalable list: f{cls._registry.keys()}"
            )
        cache_key = f"{provider}::{model}"
        if use_cache and (cache_key in cls._instances):
            logger.info(f"Using cached embedding instance for: '{cache_key}'")
            return cls._instances[cache_key]
        argument = {"model": model, **kwargs}

        embedding = cls._registry[provider](**argument)

        cls._instances[cache_key] = embedding
        return embedding

    @classmethod
    def get_default_embedding(cls) -> Embeddings:
        return cls.create(
            provider=EmbeddingProvider.OPENAI,
            model=rag_settings.embedding_model,
            api_key=rag_settings.embedding_api_key,
            base_url=rag_settings.embedding_base_url,
            check_embedding_ctx_length=False,
            model_kwargs={
                "encoding_format": "float",
            },
        )
