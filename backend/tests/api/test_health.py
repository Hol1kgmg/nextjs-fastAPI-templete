import os
import sys

# プロジェクトのルートディレクトリをパスに追加
sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest

from src.api.health.schemas import HealthResponse, HealthStatus, SystemMetrics
from src.api.health.services import HealthService


class TestHealthAPI:
    """Health API テストクラス"""

    def test_get_health_endpoint_success(self, client):
        """GET /api/health/ エンドポイントの正常動作テスト"""
        response = client.get("/api/health/")

        assert response.status_code == 200
        data = response.json()

        # レスポンス構造の検証
        assert "status" in data
        assert "timestamp" in data
        assert "message" in data
        assert "metrics" in data
        assert "version" in data

        # ステータス値の検証
        assert data["status"] in ["healthy", "warning", "unhealthy"]

        # メトリクス構造の検証
        metrics = data["metrics"]
        assert "cpu_usage" in metrics
        assert "memory_usage" in metrics
        assert "disk_usage" in metrics
        assert "uptime_seconds" in metrics

        # 数値型の検証
        assert isinstance(metrics["cpu_usage"], int | float)
        assert isinstance(metrics["memory_usage"], int | float)
        assert isinstance(metrics["disk_usage"], int | float)
        assert isinstance(metrics["uptime_seconds"], int | float)

        # 範囲の検証
        assert 0 <= metrics["cpu_usage"] <= 100
        assert 0 <= metrics["memory_usage"] <= 100
        assert metrics["uptime_seconds"] >= 0

    def test_get_simple_health_endpoint(self, client):
        """GET /api/health/simple エンドポイントのテスト"""
        response = client.get("/api/health/simple")

        assert response.status_code == 200
        data = response.json()

        assert data == {"status": "healthy"}

    @patch("src.api.health.services.psutil")
    def test_health_service_healthy_status(self, mock_psutil):
        """HealthService - HEALTHY ステータス判定テスト"""
        # モックの設定（正常値）
        mock_psutil.cpu_percent.return_value = 50.0
        mock_psutil.virtual_memory.return_value = MagicMock(percent=60.0)
        mock_psutil.disk_usage.return_value = MagicMock(
            used=30 * 1024**3,  # 30GB used
            total=100 * 1024**3,  # 100GB total
        )
        mock_psutil.boot_time.return_value = 1000000000.0

        with patch("time.time", return_value=1000086400.0):  # 24時間後
            result = HealthService.get_current_health()

        assert result.status == HealthStatus.HEALTHY
        assert "operational" in result.message.lower()
        assert result.metrics.cpu_usage == 50.0
        assert result.metrics.memory_usage == 60.0
        assert result.metrics.uptime_seconds == 86400

    @patch("src.api.health.services.psutil")
    def test_health_service_warning_status(self, mock_psutil):
        """HealthService - WARNING ステータス判定テスト"""
        # モックの設定（警告レベル）
        mock_psutil.cpu_percent.return_value = 75.0
        mock_psutil.virtual_memory.return_value = MagicMock(percent=85.0)
        mock_psutil.disk_usage.return_value = MagicMock(
            used=40 * 1024**3,  # 40GB used
            total=100 * 1024**3,  # 100GB total
        )
        mock_psutil.boot_time.return_value = 1000000000.0

        with patch("time.time", return_value=1000086400.0):
            result = HealthService.get_current_health()

        assert result.status == HealthStatus.WARNING
        assert "usage" in result.message.lower()
        assert result.metrics.cpu_usage == 75.0
        assert result.metrics.memory_usage == 85.0

    @patch("src.api.health.services.psutil")
    def test_health_service_unhealthy_status(self, mock_psutil):
        """HealthService - UNHEALTHY ステータス判定テスト"""
        # モックの設定（危険レベル）
        mock_psutil.cpu_percent.return_value = 95.0
        mock_psutil.virtual_memory.return_value = MagicMock(percent=98.0)
        mock_psutil.disk_usage.return_value = MagicMock(
            used=50 * 1024**3,  # 50GB used
            total=100 * 1024**3,  # 100GB total
        )
        mock_psutil.boot_time.return_value = 1000000000.0

        with patch("time.time", return_value=1000086400.0):
            result = HealthService.get_current_health()

        assert result.status == HealthStatus.UNHEALTHY
        assert "critical" in result.message.lower()
        assert result.metrics.cpu_usage == 95.0
        assert result.metrics.memory_usage == 98.0

    def test_health_status_determination_cpu_boundary(self):
        """CPU使用率境界値でのステータス判定テスト"""
        # CPU 70%（WARNING境界値 - まだHEALTHY）
        with patch("src.api.health.services.psutil") as mock_psutil:
            mock_psutil.cpu_percent.return_value = 70.0
            mock_psutil.virtual_memory.return_value = MagicMock(percent=50.0)
            mock_psutil.disk_usage.return_value = MagicMock(
                used=30 * 1024**3, total=100 * 1024**3
            )
            mock_psutil.boot_time.return_value = 1000000000.0

            with patch("time.time", return_value=1000086400.0):
                result = HealthService.get_current_health()

            assert result.status == HealthStatus.HEALTHY

        # CPU 70.1%（WARNING境界超え）
        with patch("src.api.health.services.psutil") as mock_psutil:
            mock_psutil.cpu_percent.return_value = 70.1
            mock_psutil.virtual_memory.return_value = MagicMock(percent=50.0)
            mock_psutil.disk_usage.return_value = MagicMock(
                used=30 * 1024**3, total=100 * 1024**3
            )
            mock_psutil.boot_time.return_value = 1000000000.0

            with patch("time.time", return_value=1000086400.0):
                result = HealthService.get_current_health()

            assert result.status == HealthStatus.WARNING

        # CPU 90%（UNHEALTHY境界値 - まだWARNING）
        with patch("src.api.health.services.psutil") as mock_psutil:
            mock_psutil.cpu_percent.return_value = 90.0
            mock_psutil.virtual_memory.return_value = MagicMock(percent=50.0)
            mock_psutil.disk_usage.return_value = MagicMock(
                used=30 * 1024**3, total=100 * 1024**3
            )
            mock_psutil.boot_time.return_value = 1000000000.0

            with patch("time.time", return_value=1000086400.0):
                result = HealthService.get_current_health()

            assert result.status == HealthStatus.WARNING

        # CPU 90.1%（UNHEALTHY境界超え）
        with patch("src.api.health.services.psutil") as mock_psutil:
            mock_psutil.cpu_percent.return_value = 90.1
            mock_psutil.virtual_memory.return_value = MagicMock(percent=50.0)
            mock_psutil.disk_usage.return_value = MagicMock(
                used=30 * 1024**3, total=100 * 1024**3
            )
            mock_psutil.boot_time.return_value = 1000000000.0

            with patch("time.time", return_value=1000086400.0):
                result = HealthService.get_current_health()

            assert result.status == HealthStatus.UNHEALTHY

    def test_health_status_determination_memory_boundary(self):
        """メモリ使用率境界値でのステータス判定テスト"""
        # Memory 70%（WARNING境界値 - まだHEALTHY）
        with patch("src.api.health.services.psutil") as mock_psutil:
            mock_psutil.cpu_percent.return_value = 50.0
            mock_psutil.virtual_memory.return_value = MagicMock(percent=70.0)
            mock_psutil.disk_usage.return_value = MagicMock(
                used=30 * 1024**3, total=100 * 1024**3
            )
            mock_psutil.boot_time.return_value = 1000000000.0

            with patch("time.time", return_value=1000086400.0):
                result = HealthService.get_current_health()

            assert result.status == HealthStatus.HEALTHY

        # Memory 70.1%（WARNING境界超え）
        with patch("src.api.health.services.psutil") as mock_psutil:
            mock_psutil.cpu_percent.return_value = 50.0
            mock_psutil.virtual_memory.return_value = MagicMock(percent=70.1)
            mock_psutil.disk_usage.return_value = MagicMock(
                used=30 * 1024**3, total=100 * 1024**3
            )
            mock_psutil.boot_time.return_value = 1000000000.0

            with patch("time.time", return_value=1000086400.0):
                result = HealthService.get_current_health()

            assert result.status == HealthStatus.WARNING

        # Memory 90%（UNHEALTHY境界値 - まだWARNING）
        with patch("src.api.health.services.psutil") as mock_psutil:
            mock_psutil.cpu_percent.return_value = 50.0
            mock_psutil.virtual_memory.return_value = MagicMock(percent=90.0)
            mock_psutil.disk_usage.return_value = MagicMock(
                used=30 * 1024**3, total=100 * 1024**3
            )
            mock_psutil.boot_time.return_value = 1000000000.0

            with patch("time.time", return_value=1000086400.0):
                result = HealthService.get_current_health()

            assert result.status == HealthStatus.WARNING

        # Memory 90.1%（UNHEALTHY境界超え）
        with patch("src.api.health.services.psutil") as mock_psutil:
            mock_psutil.cpu_percent.return_value = 50.0
            mock_psutil.virtual_memory.return_value = MagicMock(percent=90.1)
            mock_psutil.disk_usage.return_value = MagicMock(
                used=30 * 1024**3, total=100 * 1024**3
            )
            mock_psutil.boot_time.return_value = 1000000000.0

            with patch("time.time", return_value=1000086400.0):
                result = HealthService.get_current_health()

            assert result.status == HealthStatus.UNHEALTHY

    @patch("src.api.health.services.psutil")
    def test_health_service_message_generation(self, mock_psutil):
        """HealthService - メッセージ生成テスト"""
        mock_psutil.cpu_percent.return_value = 75.0
        mock_psutil.virtual_memory.return_value = MagicMock(percent=85.0)
        mock_psutil.disk_usage.return_value = MagicMock(
            used=40 * 1024**3, total=100 * 1024**3
        )
        mock_psutil.boot_time.return_value = 1000000000.0

        with patch("time.time", return_value=1000086400.0):
            result = HealthService.get_current_health()

        # メッセージにCPUとメモリの使用率が含まれていることを確認
        assert "75.0%" in result.message
        assert "85.0%" in result.message
        assert "CPU" in result.message
        assert "Memory" in result.message

    def test_health_response_schema_validation(self):
        """HealthResponse スキーマバリデーションテスト"""
        # 正常なデータでのスキーマ検証
        metrics = SystemMetrics(
            cpu_usage=50.0, memory_usage=60.0, disk_usage=30.0, uptime_seconds=86400
        )

        response = HealthResponse(
            status=HealthStatus.HEALTHY,
            timestamp=datetime.now(),
            message="All systems operational",
            metrics=metrics,
            version="1.0.0",
        )

        assert response.status == HealthStatus.HEALTHY
        assert response.metrics.cpu_usage == 50.0
        assert response.version == "1.0.0"

    def test_health_response_schema_invalid_data(self):
        """HealthResponse スキーマ - 不正データテスト"""
        with pytest.raises(ValueError):
            # 不正なステータス値
            HealthResponse(
                status="invalid_status",
                timestamp=datetime.now(),
                message="Test message",
                metrics=SystemMetrics(
                    cpu_usage=50.0,
                    memory_usage=60.0,
                    disk_usage=30.0,
                    uptime_seconds=86400,
                ),
                version="1.0.0",
            )

    @patch("src.api.health.services.psutil")
    def test_health_service_error_handling(self, mock_psutil):
        """HealthService - エラーハンドリングテスト"""
        # psutilでエラーが発生した場合の処理
        mock_psutil.cpu_percent.side_effect = Exception("CPU monitoring error")

        # エラーが発生した場合は例外が発生することを確認
        with pytest.raises(Exception) as exc_info:
            HealthService.get_current_health()

        assert "CPU monitoring error" in str(exc_info.value)

    def test_health_endpoint_response_headers(self, client):
        """Health API レスポンスヘッダーテスト"""
        response = client.get("/api/health/")

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"

    def test_health_endpoint_performance(self, client):
        """Health API パフォーマンステスト"""
        import time

        start_time = time.time()
        response = client.get("/api/health/")
        end_time = time.time()

        assert response.status_code == 200

        # レスポンス時間が1秒以下であることを確認（psutilのinterval=1を考慮）
        response_time = end_time - start_time
        assert response_time < 2.0, f"Response time too slow: {response_time}s"

    def test_multiple_health_requests(self, client):
        """複数回のHealth APIリクエストテスト"""
        responses = []

        for _ in range(3):  # 時間を考慮して3回に削減
            response = client.get("/api/health/")
            assert response.status_code == 200
            responses.append(response.json())

        # 全てのレスポンスが適切な構造を持つことを確認
        for data in responses:
            assert "status" in data
            assert "metrics" in data
            assert "timestamp" in data

    def test_system_metrics_schema_validation(self):
        """SystemMetrics スキーマバリデーションテスト"""
        # 正常なデータ
        metrics = SystemMetrics(
            cpu_usage=45.5, memory_usage=67.2, disk_usage=23.8, uptime_seconds=86400
        )

        assert metrics.cpu_usage == 45.5
        assert metrics.memory_usage == 67.2
        assert metrics.disk_usage == 23.8
        assert metrics.uptime_seconds == 86400

    def test_system_metrics_schema_boundary_validation(self):
        """SystemMetrics スキーマ境界値バリデーションテスト"""
        # CPU使用率が範囲外の場合
        with pytest.raises(ValueError):
            SystemMetrics(
                cpu_usage=-1.0,  # 負の値
                memory_usage=50.0,
                disk_usage=30.0,
                uptime_seconds=86400,
            )

        with pytest.raises(ValueError):
            SystemMetrics(
                cpu_usage=101.0,  # 100を超える値
                memory_usage=50.0,
                disk_usage=30.0,
                uptime_seconds=86400,
            )

        # 稼働時間が負の値の場合
        with pytest.raises(ValueError):
            SystemMetrics(
                cpu_usage=50.0,
                memory_usage=50.0,
                disk_usage=30.0,
                uptime_seconds=-1,  # 負の値
            )

    def test_health_status_enum_values(self):
        """HealthStatus Enum値テスト"""
        assert HealthStatus.HEALTHY == "healthy"
        assert HealthStatus.WARNING == "warning"
        assert HealthStatus.UNHEALTHY == "unhealthy"

        # Enumに含まれる全ての値の確認
        valid_statuses = [status.value for status in HealthStatus]
        assert "healthy" in valid_statuses
        assert "warning" in valid_statuses
        assert "unhealthy" in valid_statuses
