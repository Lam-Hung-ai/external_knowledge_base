from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class RagSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[3] / ".env",
        # env_file= Path.cwd().parents[0] / ".env", # load env file when running on jupyter notebook
        env_prefix="RAG_",
        extra="ignore",
    )
    chunk_size: int = 512
    embedding_model: str = ""
    embedding_base_url: str = ""
    embedding_api_key: str = ""
    vector_database_url: str = ""
    embedding_dimension: int = 2048
    rerank_model: str = ""
    rerank_base_url: str = ""
    rerank_api_key: str = ""


rag_settings = RagSettings()
