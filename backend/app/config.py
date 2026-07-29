from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    SECRET_KEY: str = "dev-secret-change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    ALGORITHM: str = "HS256"

    DATABASE_URL: str = "sqlite:///./interview_coach.db"
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    AI_PROVIDER: str = "gemini"

    # AI_PROVIDER: str = "gemini"      # gemini | openai | mock

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    GEMINI_API_KEY: str = ""
    GEMINI_API_KEY_2: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

    UPLOAD_DIR: str = "./uploads"


@lru_cache
def get_settings() -> Settings:
    return Settings()