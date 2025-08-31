import os
import sys
import time

# プロジェクトのルートディレクトリをパスに追加
sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from datetime import datetime

import pytest

from src.api.health.schemas import HealthResponse, HealthStatus
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

        # ステータス値の検証
        assert data["status"] == "healthy"

        # タイムスタンプの検証
        assert isinstance(data["timestamp"], str)

    def test_get_simple_health_endpoint(self, client):
        """GET /api/health/simple エンドポイントのテスト"""
        response = client.get("/api/health/simple")

        assert response.status_code == 200
        data = response.json()

        assert data == {"status": "healthy"}

    def test_health_service_simple_response(self):
        """HealthService - 簡素化されたレスポンステスト"""
        result = HealthService.get_current_health()

        assert result.status == HealthStatus.HEALTHY
        assert isinstance(result.timestamp, datetime)

    def test_health_response_schema_validation(self):
        """HealthResponse スキーマバリデーションテスト"""
        response = HealthResponse(
            status=HealthStatus.HEALTHY,
            timestamp=datetime.now(),
        )

        assert response.status == HealthStatus.HEALTHY
        assert isinstance(response.timestamp, datetime)

    def test_health_response_schema_invalid_data(self):
        """HealthResponse スキーマ - 不正データテスト"""
        with pytest.raises(ValueError):
            HealthResponse(
                status="invalid_status",
                timestamp=datetime.now(),
            )

    def test_health_endpoint_response_headers(self, client):
        """Health API レスポンスヘッダーテスト"""
        response = client.get("/api/health/")

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"

    def test_health_endpoint_performance(self, client):
        """Health API パフォーマンステスト"""

        start_time = time.time()
        response = client.get("/api/health/")
        end_time = time.time()

        assert response.status_code == 200

        response_time = end_time - start_time
        assert response_time < 0.1, f"Response time too slow: {response_time}s"

    def test_multiple_health_requests(self, client):
        """複数回のHealth APIリクエストテスト"""
        responses = []

        for _ in range(3):
            response = client.get("/api/health/")
            assert response.status_code == 200
            responses.append(response.json())

        for data in responses:
            assert "status" in data
            assert "timestamp" in data

    def test_health_status_enum_values(self):
        """HealthStatus Enum値テスト"""
        assert HealthStatus.HEALTHY == "healthy"

        valid_statuses = [status.value for status in HealthStatus]
        assert "healthy" in valid_statuses
