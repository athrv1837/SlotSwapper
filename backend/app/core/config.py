import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "SlotSwapper API"
    
    # ✅ SECURE: Get from .env, NO hardcoded fallback for SECRET_KEY
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    
    # ✅ Safe to have defaults for these
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./slotswapper.db")
    CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

settings = Settings()

# Validate that SECRET_KEY is set
if not settings.SECRET_KEY:
    raise ValueError("SECRET_KEY must be set in .env file!")