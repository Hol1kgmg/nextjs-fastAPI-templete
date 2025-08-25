from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class HealthStatus(str, Enum):
    """ヘルスステータス"""

    HEALTHY = "healthy"
    WARNING = "warning"
    UNHEALTHY = "unhealthy"


class SystemMetrics(BaseModel):
    """システムメトリクス"""

    cpu_usage: float = Field(..., ge=0, le=100, description="CPU使用率（%）")
    memory_usage: float = Field(..., ge=0, le=100, description="メモリ使用率（%）")
    disk_usage: float = Field(..., ge=0, le=100, description="ディスク使用率（%）")
    uptime_seconds: int = Field(..., ge=0, description="稼働時間（秒）")


class HealthResponse(BaseModel):
    """ヘルスチェックレスポンス"""

    status: HealthStatus = Field(..., description="システムステータス")
    timestamp: datetime = Field(..., description="チェック時刻")
    message: str = Field(..., description="ステータスメッセージ")
    metrics: SystemMetrics = Field(..., description="システムメトリクス")
    version: str = Field(..., description="アプリケーションバージョン")


class HealthHistoryResponse(BaseModel):
    """ヘルス履歴レスポンス"""

    checks: list[HealthResponse] = Field(..., description="ヘルスチェック履歴")
    total_count: int = Field(..., description="総件数")
    healthy_count: int = Field(..., description="正常件数")
    warning_count: int = Field(..., description="警告件数")
    unhealthy_count: int = Field(..., description="異常件数")
