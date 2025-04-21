from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv
from pathlib import Path

# Obtener la ruta al directorio raíz del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load environment variables from .env file
load_dotenv(BASE_DIR / ".env")

class Settings(BaseSettings):
    PROJECT_NAME: str = "WebNovel Manager API"
    API_V1_STR: str = "/api/v1"

    # MongoDB settings
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "webnovel_manager")

    # DeepL settings
    DEEPL_API_KEY: str | None = os.getenv("DEEPL_API_KEY")
    DEEPL_TARGET_LANGUAGE: str = "ES"  # Código de idioma para español

    class Config:
        case_sensitive = True
        # If using .env file:
        # env_file = ".env"
        # env_file_encoding = 'utf-8'

settings = Settings()