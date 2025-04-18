from fastapi import FastAPI
from contextlib import asynccontextmanager
from .routers import health, novels, chapters
from .db.database import connect_to_mongo, close_mongo_connection
from .core.config import settings
from fastapi.middleware.cors import CORSMiddleware
from scalar_fastapi import get_scalar_api_reference
from scalar_fastapi.scalar_fastapi import Layout

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    connect_to_mongo()
    yield
    # Shutdown: Close MongoDB connection
    close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API to manage webnovels and related data.",
    version="0.1.0",
    lifespan=lifespan # Add lifespan manager
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],  # Permitir estas URLs
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos (GET, POST, etc.)
    allow_headers=["*"],  # Permitir todos los headers
)

@app.get("/scalar", include_in_schema=False)
async def scalar_html():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        title=app.title,
        hide_download_button=True,
        hide_models=True,
        dark_mode=True,
        default_open_all_tags=True,
    )
    
# Include routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(novels.router, prefix=f"{settings.API_V1_STR}/novels")
app.include_router(chapters.router, prefix=f"{settings.API_V1_STR}/novels")

@app.get("/")
async def root():
    return {"message": f"Welcome to the {settings.PROJECT_NAME}"}
