from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class HealthStatus(str, Enum):
    """ヘルスステータス"""

    HEALTHY = "healthy"


class HealthResponse(BaseModel):
    """ヘルスチェックレスポンス"""

    status: HealthStatus = Field(..., description="システムステータス")
    timestamp: datetime = Field(..., description="チェック時刻")
