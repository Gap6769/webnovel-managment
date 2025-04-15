from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "WebNovel Manager API"
    API_V1_STR: str = "/api/v1"

    # MongoDB settings
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "webnovel_manager")

    class Config:
        case_sensitive = True
        # If using .env file:
        # env_file = ".env"
        # env_file_encoding = 'utf-8'

settings = Settings()
