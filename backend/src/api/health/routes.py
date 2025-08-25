from fastapi import APIRouter

from .schemas import HealthResponse
from .services import HealthService

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("/", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    """現在のシステムヘルス状態を取得"""
    return HealthService.get_current_health()


@router.get("/simple")
async def get_simple_health() -> dict[str, str]:
    """シンプルなヘルスチェック（後方互換性）"""
    return {"status": "healthy"}
