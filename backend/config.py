import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env if present
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip()
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "127.0.0.1")
    ENABLE_SEARCH_GROUNDING: bool = os.getenv("ENABLE_SEARCH_GROUNDING", "true").lower() in ("true", "1", "yes")
    
    # Allowed CORS origins
    _cors_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://127.0.0.1:5173")
    CORS_ORIGINS: list[str] = [origin.strip() for origin in _cors_raw.split(",") if origin.strip()]

    # Request limits
    MAX_MESSAGE_LENGTH: int = 4000
    MAX_HISTORY_TURNS: int = 15

settings = Settings()
