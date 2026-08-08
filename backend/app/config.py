from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime config. Values come from environment / .env — never hard-coded
    secrets in source (NFR-003)."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openai_api_key: str = ""
    backend_api_key: str = "change-me-lab-only"
    database_url: str = "sqlite:///./soc_analyst.db"
    chroma_persist_dir: str = "./chroma_data"


settings = Settings()
