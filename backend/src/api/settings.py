from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class RagSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_prefix="BACKEND_",
        extra="ignore",
    )
    next_public_api_url: str = ""


backend_settings = RagSettings()
