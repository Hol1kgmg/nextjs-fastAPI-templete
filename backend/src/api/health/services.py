from datetime import datetime

from .schemas import HealthResponse, HealthStatus


class HealthService:
    """ヘルスチェックサービス"""

    @staticmethod
    def get_current_health() -> HealthResponse:
        """現在のシステムヘルス状態を取得"""
        return HealthResponse(
            status=HealthStatus.HEALTHY,
            timestamp=datetime.now(),
        )
