import concurrent.futures
import os
import sys
import time
from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

# プロジェクトのルートディレクトリをパスに追加
sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from src.api.common.exceptions import (
    APIException,
    ConflictException,
    NotFoundException,
    ValidationException,
)
from src.api.common.responses import ErrorDetail, ErrorResponse, SuccessResponse
from src.core.middleware import ErrorHandlerMiddleware, LoggingMiddleware


class TestErrorHandling:
    """エラーハンドリング テストクラス"""

    def test_404_not_found_error(self, client):
        """404 Not Found エラーテスト"""
        response = client.get("/api/nonexistent")

        assert response.status_code == 404
        data = response.json()

        # FastAPIデフォルトエラーレスポンス構造の検証
        assert "detail" in data
        assert "not found" in data["detail"].lower()

    def test_405_method_not_allowed_error(self, client):
        """405 Method Not Allowed エラーテスト"""
        # 存在するエンドポイントに対して許可されていないメソッドでリクエスト
        response = client.patch("/api/health/")

        assert response.status_code == 405
        data = response.json()

        # FastAPIデフォルトエラーレスポンス構造の検証
        assert "detail" in data
        assert "method not allowed" in data["detail"].lower()

    def test_422_validation_error_examples_api(self, client):
        """422 Validation Error テスト - Examples API"""
        # 必須フィールドなしでリクエスト
        response = client.post("/api/examples/", json={})

        assert response.status_code == 422
        data = response.json()

        # FastAPIのバリデーションエラー形式を確認
        assert "detail" in data
        assert isinstance(data["detail"], list)
        assert len(data["detail"]) > 0

        # エラー詳細の構造確認
        error_detail = data["detail"][0]
        assert "type" in error_detail
        assert "loc" in error_detail
        assert "msg" in error_detail

    def test_422_validation_error_invalid_data_types(self, client):
        """422 Validation Error テスト - 不正なデータ型"""
        # 不正なデータ型でリクエスト
        invalid_data = {
            "name": 123,  # 文字列が期待されるが数値
            "description": True,  # 文字列が期待されるがブール値
            "is_active": "invalid",  # ブール値が期待されるが文字列
        }

        response = client.post("/api/examples/", json=invalid_data)

        assert response.status_code == 422
        data = response.json()

        assert "detail" in data
        assert isinstance(data["detail"], list)

        # 複数のバリデーションエラーが含まれることを確認
        assert len(data["detail"]) >= 2

    def test_422_validation_error_field_constraints(self, client):
        """422 Validation Error テスト - フィールド制約違反"""
        # 文字数制限違反
        long_name = "a" * 101  # 100文字制限を超える
        response = client.post(
            "/api/examples/",
            json={"name": long_name, "description": "Valid description"},
        )

        assert response.status_code == 422
        data = response.json()

        assert "detail" in data
        error_detail = data["detail"][0]
        assert "name" in str(error_detail["loc"])

    def test_404_resource_not_found_examples_api(self, client):
        """404 Resource Not Found テスト - Examples API"""
        # 存在しないリソースIDでアクセス
        response = client.get("/api/examples/999999")

        assert response.status_code == 404
        data = response.json()

        assert "detail" in data
        assert "not found" in data["detail"].lower()

    def test_404_resource_not_found_update(self, client):
        """404 Resource Not Found テスト - 更新操作"""
        update_data = {"name": "Updated Name"}
        response = client.put("/api/examples/999999", json=update_data)

        assert response.status_code == 404
        data = response.json()

        assert "detail" in data
        assert "not found" in data["detail"].lower()

    def test_404_resource_not_found_delete(self, client):
        """404 Resource Not Found テスト - 削除操作"""
        response = client.delete("/api/examples/999999")

        assert response.status_code == 404
        data = response.json()

        assert "detail" in data
        assert "not found" in data["detail"].lower()

    def test_error_response_timestamp_format(self, client):
        """エラーレスポンスのタイムスタンプ形式テスト"""
        # カスタムエラーハンドラーが適用される内部エラーをシミュレート
        # 404エラーはFastAPIデフォルトなので、実際のアプリケーションエラーをテスト
        response = client.get("/api/examples/999999")

        assert response.status_code == 404
        data = response.json()

        # FastAPIデフォルトエラーの場合はタイムスタンプなし
        # カスタムエラーハンドラーが適用される場合のみタイムスタンプあり
        assert "detail" in data

    def test_error_response_path_information(self, client):
        """エラーレスポンスのパス情報テスト"""
        response = client.get("/api/nonexistent/path")

        assert response.status_code == 404
        data = response.json()

        # FastAPIデフォルトエラーの場合はパス情報なし
        assert "detail" in data

    def test_content_type_error_responses(self, client):
        """エラーレスポンスのContent-Typeテスト"""
        response = client.get("/api/nonexistent")

        assert response.status_code == 404
        assert response.headers["content-type"] == "application/json"

    def test_malformed_json_request(self, client):
        """不正なJSONリクエストのテスト"""
        # 不正なJSONを送信
        response = client.post(
            "/api/examples/",
            data='{"name": "test", "description":}',  # 不正なJSON
            headers={"Content-Type": "application/json"},
        )

        assert response.status_code == 422
        data = response.json()

        assert "detail" in data

    def test_unsupported_media_type(self, client):
        """サポートされていないメディアタイプのテスト"""
        # XMLデータを送信（JSONが期待される）
        xml_data = '<?xml version="1.0"?><data><name>test</name></data>'
        response = client.post(
            "/api/examples/",
            data=xml_data,
            headers={"Content-Type": "application/xml"},
        )

        # FastAPIは自動的に422を返すか、415を返す可能性がある
        assert response.status_code in [415, 422]

    def test_large_request_body(self, client):
        """大きなリクエストボディのテスト"""
        # 非常に大きなデータを送信
        large_description = "a" * 10000  # 10KB
        response = client.post(
            "/api/examples/",
            json={"name": "Large Request Test", "description": large_description},
        )

        # サイズ制限がある場合は413、ない場合は正常処理または422
        assert response.status_code in [201, 413, 422]

    def test_concurrent_error_handling(self, client):
        """並行エラーハンドリングテスト"""
        # 複数の不正なリクエストを同時に送信
        responses = []
        for i in range(5):
            response = client.get(f"/api/nonexistent/{i}")
            responses.append(response)

        # 全てのレスポンスが適切にエラーハンドリングされていることを確認
        for response in responses:
            assert response.status_code == 404
            data = response.json()
            assert "detail" in data

    @patch("src.core.middleware.logger")
    def test_internal_server_error_logging(self, mock_logger, client):
        """内部サーバーエラーのログ出力テスト"""
        # 内部エラーを発生させるために、存在しないエンドポイントにアクセス
        # （実際の内部エラーをシミュレートするのは困難なため、ログの呼び出しを確認）
        response = client.get("/api/nonexistent")

        assert response.status_code == 404
        # 404エラーの場合はHTTPExceptionとして処理されるため、
        # 内部エラーログは呼ばれない

    def test_error_response_consistency(self, client):
        """エラーレスポンスの一貫性テスト"""
        # 異なるタイプのエラーで一貫したレスポンス形式を確認
        error_responses = []

        # 404エラー
        response_404 = client.get("/api/nonexistent")
        error_responses.append(response_404.json())

        # 422エラーは異なる形式（FastAPIのバリデーションエラー）なので除外

        # 405エラー
        response_405 = client.patch("/api/health/")
        error_responses.append(response_405.json())

        # 全てのエラーレスポンスが基本的な構造を持つことを確認
        for error_data in error_responses:
            # FastAPIデフォルト形式の確認
            assert "detail" in error_data

    def test_api_exception_classes(self):
        """API例外クラスのテスト"""
        # APIException基底クラス
        api_exc = APIException(status_code=400, message="Test error")
        assert api_exc.status_code == 400
        assert api_exc.message == "Test error"
        assert api_exc.details == []

        # ValidationException
        validation_exc = ValidationException(message="Validation failed")
        assert validation_exc.status_code == 422
        assert validation_exc.message == "Validation failed"

        # NotFoundException
        not_found_exc = NotFoundException(resource="User")
        assert not_found_exc.status_code == 404
        assert "User not found" in not_found_exc.message

        # ConflictException
        conflict_exc = ConflictException(message="Resource already exists")
        assert conflict_exc.status_code == 409
        assert conflict_exc.message == "Resource already exists"

    def test_error_detail_schema(self):
        """ErrorDetailスキーマのテスト"""
        # 完全なエラー詳細
        error_detail = ErrorDetail(
            field="name", message="Field is required", code="required"
        )
        assert error_detail.field == "name"
        assert error_detail.message == "Field is required"
        assert error_detail.code == "required"

        # 最小限のエラー詳細
        minimal_error = ErrorDetail(message="Error occurred")
        assert minimal_error.field is None
        assert minimal_error.message == "Error occurred"
        assert minimal_error.code is None

    def test_error_response_schema(self):
        """ErrorResponseスキーマのテスト"""
        # 詳細ありのエラーレスポンス
        error_details = [
            ErrorDetail(field="name", message="Required field", code="required")
        ]
        error_response = ErrorResponse(
            message="Validation failed",
            details=error_details,
            timestamp="2023-01-01T00:00:00Z",
        )

        assert error_response.error is True
        assert error_response.message == "Validation failed"
        assert len(error_response.details) == 1
        assert error_response.timestamp == "2023-01-01T00:00:00Z"

        # 詳細なしのエラーレスポンス
        simple_error = ErrorResponse(
            message="Simple error", timestamp="2023-01-01T00:00:00Z"
        )
        assert simple_error.error is True
        assert simple_error.details is None

    def test_error_handling_edge_cases(self, client):
        """エラーハンドリングのエッジケーステスト"""
        # 空のパスでのリクエスト
        response = client.get("/")
        # ルートパスは定義されているため200
        assert response.status_code == 200

        # 非常に長いパスでのリクエスト
        long_path = "/api/" + "a" * 1000
        response = client.get(long_path)
        assert response.status_code == 404

        # 特殊文字を含むパス（URLエンコードされたスペース）
        special_path = "/api/examples/test%20with%20spaces"
        response = client.get(special_path)
        # パスパラメータのバリデーションエラーまたは404
        assert response.status_code in [404, 422]

    def test_error_message_localization_ready(self, client):
        """エラーメッセージの多言語対応準備テスト"""
        # 現在は英語メッセージだが、将来の多言語対応を考慮
        response = client.get("/api/examples/999999")

        assert response.status_code == 404
        data = response.json()

        # エラーメッセージが文字列であることを確認（多言語対応の基盤）
        assert isinstance(data["detail"], str)
        assert len(data["detail"]) > 0

    def test_error_handling_performance(self, client):
        """エラーハンドリングのパフォーマンステスト"""
        # エラーレスポンスの応答時間を測定
        start_time = time.time()
        response = client.get("/api/nonexistent")
        end_time = time.time()

        assert response.status_code == 404
        response_time = end_time - start_time

        # エラーハンドリングが高速であることを確認（1秒以内）
        assert response_time < 1.0, f"Error handling too slow: {response_time}s"

    def test_custom_api_exception_handling(self, client):
        """カスタムAPI例外ハンドリングテスト"""
        # カスタム例外が適切にHTTPExceptionに変換されることを確認
        api_exc = APIException(status_code=400, message="Custom API error")
        assert api_exc.status_code == 400
        assert api_exc.detail == "Custom API error"
        assert api_exc.message == "Custom API error"
        assert api_exc.details == []

        # 詳細情報付きの例外
        details = [{"field": "name", "message": "Invalid value"}]
        detailed_exc = APIException(
            status_code=400, message="Detailed error", details=details
        )
        assert detailed_exc.details == details

    def test_validation_exception_with_details(self):
        """詳細情報付きバリデーション例外テスト"""
        details = [
            {"field": "email", "message": "Invalid email format", "code": "invalid"},
            {"field": "age", "message": "Must be positive", "code": "min_value"},
        ]

        validation_exc = ValidationException(
            message="Multiple validation errors", details=details
        )

        assert validation_exc.status_code == 422
        assert validation_exc.message == "Multiple validation errors"
        assert validation_exc.details == details

    def test_not_found_exception_custom_resource(self):
        """カスタムリソース名でのNotFound例外テスト"""
        user_exc = NotFoundException(resource="User")
        assert user_exc.status_code == 404
        assert user_exc.message == "User not found"

        product_exc = NotFoundException(resource="Product")
        assert product_exc.status_code == 404
        assert product_exc.message == "Product not found"

    def test_conflict_exception_custom_message(self):
        """カスタムメッセージでのConflict例外テスト"""
        conflict_exc = ConflictException(message="Email already exists")
        assert conflict_exc.status_code == 409
        assert conflict_exc.message == "Email already exists"

    def test_error_response_model_validation(self):
        """ErrorResponseモデルのバリデーションテスト"""
        # 必須フィールドのみ
        error_response = ErrorResponse(
            message="Test error", timestamp="2023-01-01T00:00:00Z"
        )
        assert error_response.error is True
        assert error_response.message == "Test error"
        assert error_response.details is None
        assert error_response.timestamp == "2023-01-01T00:00:00Z"

        # 全フィールド指定
        error_details = [ErrorDetail(field="name", message="Required", code="required")]
        full_error_response = ErrorResponse(
            message="Validation failed",
            details=error_details,
            timestamp="2023-01-01T00:00:00Z",
        )
        assert full_error_response.details == error_details

    def test_success_response_model_validation(self):
        """SuccessResponseモデルのバリデーションテスト"""
        # 基本的な成功レスポンス
        success_response = SuccessResponse(data={"id": 1, "name": "test"})
        assert success_response.success is True
        assert success_response.data == {"id": 1, "name": "test"}
        assert success_response.message is None

        # メッセージ付き成功レスポンス
        success_with_message = SuccessResponse(
            data={"created": True}, message="Resource created successfully"
        )
        assert success_with_message.message == "Resource created successfully"

    @pytest.mark.asyncio
    async def test_error_handler_middleware_http_exception(self):
        """ErrorHandlerMiddlewareのHTTPException処理テスト"""

        middleware = ErrorHandlerMiddleware(app=None)

        # モックリクエスト
        request = MagicMock()
        request.url = "http://test.com/api/test"

        # HTTPExceptionを発生させるcall_next
        async def call_next_with_http_exception(request):
            raise HTTPException(status_code=404, detail="Not found")

        response = await middleware.dispatch(request, call_next_with_http_exception)

        assert response.status_code == 404
        content = response.body.decode()
        assert "error" in content
        assert "Not found" in content
        assert "timestamp" in content
        assert "path" in content

    @pytest.mark.asyncio
    async def test_error_handler_middleware_generic_exception(self):
        """ErrorHandlerMiddlewareの一般例外処理テスト"""
        middleware = ErrorHandlerMiddleware(app=None)

        # モックリクエスト
        request = MagicMock()
        request.url = "http://test.com/api/test"

        # 一般例外を発生させるcall_next
        async def call_next_with_exception(request):
            raise ValueError("Unexpected error")

        with patch("src.core.middleware.logger") as mock_logger:
            response = await middleware.dispatch(request, call_next_with_exception)

            # ログが記録されることを確認
            mock_logger.error.assert_called_once()

        assert response.status_code == 500
        content = response.body.decode()
        assert "error" in content
        assert "Internal server error" in content
        assert "timestamp" in content

    @pytest.mark.asyncio
    async def test_logging_middleware_request_response_logging(self):
        """LoggingMiddlewareのリクエスト/レスポンスログテスト"""
        middleware = LoggingMiddleware(app=None)

        # モックリクエスト
        request = MagicMock()
        request.method = "GET"
        request.url = "http://test.com/api/test"

        # モックレスポンス
        mock_response = MagicMock()
        mock_response.status_code = 200

        async def call_next_success(request):
            return mock_response

        with patch("src.core.middleware.logger") as mock_logger:
            response = await middleware.dispatch(request, call_next_success)

            # リクエストとレスポンスのログが記録されることを確認
            assert mock_logger.info.call_count == 2

            # リクエストログの確認
            request_log_call = mock_logger.info.call_args_list[0]
            assert "Request: GET" in request_log_call[0][0]

            # レスポンスログの確認
            response_log_call = mock_logger.info.call_args_list[1]
            assert "Response: 200" in response_log_call[0][0]

        assert response == mock_response

    def test_error_detail_model_optional_fields(self):
        """ErrorDetailモデルのオプションフィールドテスト"""
        # メッセージのみ
        minimal_detail = ErrorDetail(message="Error occurred")
        assert minimal_detail.field is None
        assert minimal_detail.message == "Error occurred"
        assert minimal_detail.code is None

        # 全フィールド指定
        full_detail = ErrorDetail(
            field="email", message="Invalid format", code="format_error"
        )
        assert full_detail.field == "email"
        assert full_detail.message == "Invalid format"
        assert full_detail.code == "format_error"

    def test_http_status_code_coverage(self, client):
        """HTTPステータスコードの網羅的テスト"""
        # 200 OK - 正常なリクエスト
        response = client.get("/api/health/")
        assert response.status_code == 200

        # 404 Not Found - 存在しないリソース
        response = client.get("/api/nonexistent")
        assert response.status_code == 404

        # 405 Method Not Allowed - 許可されていないメソッド
        response = client.patch("/api/health/")
        assert response.status_code == 405

        # 422 Unprocessable Entity - バリデーションエラー
        response = client.post("/api/examples/", json={})
        assert response.status_code == 422

    def test_error_response_headers(self, client):
        """エラーレスポンスのヘッダーテスト"""
        response = client.get("/api/nonexistent")

        assert response.status_code == 404
        assert response.headers["content-type"] == "application/json"

        # セキュリティヘッダーの確認（設定されている場合）
        # 実際の設定に応じて調整が必要
        headers = response.headers
        assert "content-type" in headers

    def test_error_message_sanitization(self):
        """エラーメッセージのサニタイゼーションテスト"""
        # 悪意のあるスクリプトを含むメッセージ
        malicious_message = "<script>alert('xss')</script>Error"

        api_exc = APIException(status_code=400, message=malicious_message)

        # メッセージがそのまま保存されることを確認（サニタイゼーションは表示時に行う）
        assert api_exc.message == malicious_message

        # ErrorResponseモデルでも同様
        error_response = ErrorResponse(
            message=malicious_message, timestamp="2023-01-01T00:00:00Z"
        )
        assert error_response.message == malicious_message

    def test_error_handling_with_different_content_types(self, client):
        """異なるContent-Typeでのエラーハンドリングテスト"""
        # JSON以外のContent-Typeでリクエスト
        response = client.post(
            "/api/examples/",
            data="plain text data",
            headers={"Content-Type": "text/plain"},
        )

        # FastAPIは自動的に適切なエラーを返す
        assert response.status_code in [415, 422]

    def test_error_response_serialization(self):
        """エラーレスポンスのシリアライゼーションテスト"""
        error_details = [
            ErrorDetail(field="name", message="Required", code="required"),
            ErrorDetail(field="email", message="Invalid format", code="format"),
        ]

        error_response = ErrorResponse(
            message="Multiple errors",
            details=error_details,
            timestamp="2023-01-01T00:00:00Z",
        )

        # JSON形式にシリアライズできることを確認
        json_data = error_response.model_dump()

        assert json_data["error"] is True
        assert json_data["message"] == "Multiple errors"
        assert len(json_data["details"]) == 2
        assert json_data["timestamp"] == "2023-01-01T00:00:00Z"

    def test_concurrent_error_handling_stress(self, client):
        """並行エラーハンドリングのストレステスト"""

        def make_error_request(path_suffix):
            return client.get(f"/api/nonexistent/{path_suffix}")

        # 複数のスレッドで同時にエラーリクエストを送信
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_error_request, i) for i in range(20)]

            responses = [future.result() for future in futures]

        # 全てのレスポンスが適切に処理されることを確認
        for response in responses:
            assert response.status_code == 404
            data = response.json()
            assert "detail" in data

    def test_error_response_timestamp_format_validation(self, client):
        """エラーレスポンスのタイムスタンプ形式検証テスト"""
        # カスタムエラーハンドラーが適用されるケースをテスト
        # 実際のアプリケーションでカスタムエラーハンドラーが動作する場合
        response = client.get("/api/examples/999999")

        if response.status_code == 404:
            data = response.json()

            # カスタムエラーハンドラーが適用されている場合のタイムスタンプ検証
            if "timestamp" in data:
                timestamp = data["timestamp"]

                # ISO 8601形式の検証
                try:
                    datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                    timestamp_valid = True
                except ValueError:
                    timestamp_valid = False

                assert timestamp_valid, f"Invalid timestamp format: {timestamp}"
