from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class RagSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env", env_prefix="RAG_"
    )
    chunk_size: int = 512
    embedding_model: str = ""
    embedding_base_url: str = ""
    embedding_api_key: str = ""
    vector_database_url: str = ""


rag_settings = RagSettings()
