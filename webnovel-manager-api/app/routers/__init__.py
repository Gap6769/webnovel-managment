from fastapi import APIRouter
from .novels import router as novels_router
from .chapters import router as chapters_router
from .health import router as health_router

api_router = APIRouter()

api_router.include_router(novels_router, prefix="/novels", tags=["novels"])
api_router.include_router(chapters_router, prefix="/novels", tags=["chapters"])
api_router.include_router(health_router, tags=["health"])
