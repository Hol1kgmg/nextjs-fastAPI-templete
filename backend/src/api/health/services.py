import time
from datetime import datetime

import psutil  # type: ignore

from .schemas import HealthResponse, HealthStatus, SystemMetrics


class HealthService:
    """ヘルスチェックサービス"""

    @staticmethod
    def get_current_health() -> HealthResponse:
        """現在のシステムヘルス状態を取得"""
        # システムメトリクス取得
        cpu_usage = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage("/")
        boot_time = psutil.boot_time()
        uptime = int(time.time() - boot_time)

        metrics = SystemMetrics(
            cpu_usage=cpu_usage,
            memory_usage=memory.percent,
            disk_usage=(disk.used / disk.total) * 100,
            uptime_seconds=uptime,
        )

        # ステータス判定
        status = HealthService._determine_status(metrics)
        message = HealthService._get_status_message(status, metrics)

        return HealthResponse(
            status=status,
            timestamp=datetime.now(),
            message=message,
            metrics=metrics,
            version="1.0.0",
        )

    @staticmethod
    def _determine_status(metrics: SystemMetrics) -> HealthStatus:
        """メトリクスからステータスを判定"""
        if metrics.cpu_usage > 90 or metrics.memory_usage > 90:
            return HealthStatus.UNHEALTHY
        elif metrics.cpu_usage > 70 or metrics.memory_usage > 70:
            return HealthStatus.WARNING
        else:
            return HealthStatus.HEALTHY

    @staticmethod
    def _get_status_message(status: HealthStatus, metrics: SystemMetrics) -> str:
        """ステータスに応じたメッセージを生成"""
        if status == HealthStatus.HEALTHY:
            return "All systems operational"
        elif status == HealthStatus.WARNING:
            cpu = metrics.cpu_usage
            memory = metrics.memory_usage
            return f"High resource usage - CPU: {cpu:.1f}%, Memory: {memory:.1f}%"
        else:
            cpu = metrics.cpu_usage
            memory = metrics.memory_usage
            return f"Critical resource usage - CPU: {cpu:.1f}%, Memory: {memory:.1f}%"
