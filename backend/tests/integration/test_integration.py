import os
import sys
import time

from fastapi.testclient import TestClient

# プロジェクトのルートディレクトリをパスに追加
sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)


class TestIntegration:
    """統合テストクラス"""

    def test_api_endpoints_availability(self, client: TestClient):
        """APIエンドポイントの可用性テスト"""
        endpoints = [
            ("/", "GET", 200),
            ("/api/health/", "GET", 200),
            ("/api/health/simple", "GET", 200),
            ("/api/examples/", "GET", 200),
            ("/docs", "GET", 200),
            ("/openapi.json", "GET", 200),
        ]

        for endpoint, method, expected_status in endpoints:
            if method == "GET":
                response = client.get(endpoint)
            elif method == "POST":
                response = client.post(endpoint)
            elif method == "PUT":
                response = client.put(endpoint)
            elif method == "DELETE":
                response = client.delete(endpoint)

            assert response.status_code == expected_status, (
                f"Endpoint {endpoint} failed with status {response.status_code}"
            )

    def test_health_api_integration(self, client: TestClient):
        """Health API統合テスト"""
        # 詳細ヘルスチェック
        response = client.get("/api/health/")
        assert response.status_code == 200

        data = response.json()
        required_fields = ["status", "timestamp"]
        for field in required_fields:
            assert field in data, f"Required field '{field}' missing in health response"

        # ステータス検証
        assert data["status"] == "healthy"
        # タイムスタンプ検証
        assert isinstance(data["timestamp"], str)

        # シンプルヘルスチェック（後方互換性）
        response = client.get("/api/health/simple")
        assert response.status_code == 200

        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"

    def test_examples_crud_integration(self, client: TestClient):
        """Examples CRUD統合テスト"""
        # 1. 作成テスト
        create_data = {
            "name": "Integration Test Example",
            "description": "Created during integration testing",
            "is_active": True,
        }

        response = client.post("/api/examples/", json=create_data)
        assert response.status_code == 201

        created_example = response.json()
        example_id = created_example["id"]
        assert created_example["name"] == create_data["name"]
        assert created_example["description"] == create_data["description"]
        assert created_example["is_active"] == create_data["is_active"]

        # 2. 取得テスト
        response = client.get(f"/api/examples/{example_id}")
        assert response.status_code == 200

        retrieved_example = response.json()
        assert retrieved_example["id"] == example_id
        assert retrieved_example["name"] == create_data["name"]

        # 3. 更新テスト
        update_data = {
            "name": "Updated Integration Test Example",
            "description": "Updated during integration testing",
        }

        response = client.put(f"/api/examples/{example_id}", json=update_data)
        assert response.status_code == 200

        updated_example = response.json()
        assert updated_example["name"] == update_data["name"]
        assert updated_example["description"] == update_data["description"]

        # 4. リスト取得テスト
        response = client.get("/api/examples/")
        assert response.status_code == 200

        examples_list = response.json()
        assert "items" in examples_list
        assert "total" in examples_list
        assert "page" in examples_list
        assert "per_page" in examples_list
        assert "pages" in examples_list

        # 作成したアイテムがリストに含まれることを確認
        found_example = False
        for item in examples_list["items"]:
            if item["id"] == example_id:
                found_example = True
                break
        assert found_example, "Created example not found in list"

        # 5. 削除テスト
        response = client.delete(f"/api/examples/{example_id}")
        assert response.status_code == 200

        # 削除後の確認
        response = client.get(f"/api/examples/{example_id}")
        assert response.status_code == 404

    def test_pagination_integration(self, client: TestClient):
        """ページネーション統合テスト"""
        # テストデータ作成
        test_examples = []
        for i in range(15):
            create_data = {
                "name": f"Pagination Test Example {i:02d}",
                "description": f"Created for pagination testing {i}",
                "is_active": True,
            }
            response = client.post("/api/examples/", json=create_data)
            assert response.status_code == 201
            test_examples.append(response.json())

        try:
            # ページネーションテスト
            response = client.get("/api/examples/?page=1&per_page=5")
            assert response.status_code == 200

            page1_data = response.json()
            assert len(page1_data["items"]) == 5
            assert page1_data["page"] == 1
            assert page1_data["per_page"] == 5
            assert page1_data["total"] >= 15

            # 2ページ目のテスト
            response = client.get("/api/examples/?page=2&per_page=5")
            assert response.status_code == 200

            page2_data = response.json()
            assert len(page2_data["items"]) == 5
            assert page2_data["page"] == 2

            # ページ1とページ2のアイテムが異なることを確認
            page1_ids = {item["id"] for item in page1_data["items"]}
            page2_ids = {item["id"] for item in page2_data["items"]}
            assert page1_ids.isdisjoint(page2_ids), (
                "Pages should contain different items"
            )

        finally:
            # テストデータクリーンアップ
            for example in test_examples:
                client.delete(f"/api/examples/{example['id']}")

    def test_search_integration(self, client: TestClient):
        """検索機能統合テスト"""
        # テストデータ作成
        test_examples = [
            {"name": "Search Test Alpha", "description": "Alpha description"},
            {"name": "Search Test Beta", "description": "Beta description"},
            {"name": "Different Name", "description": "Contains Alpha in description"},
        ]

        created_examples = []
        for example_data in test_examples:
            response = client.post("/api/examples/", json=example_data)
            assert response.status_code == 201
            created_examples.append(response.json())

        try:
            # 名前での検索
            response = client.get("/api/examples/?search=Alpha")
            assert response.status_code == 200

            search_results = response.json()
            assert search_results["total"] >= 1

            # 検索結果に"Alpha"を含むアイテムが含まれることを確認
            found_alpha = False
            for item in search_results["items"]:
                if "Alpha" in item["name"]:
                    found_alpha = True
                    break
            assert found_alpha, "Search should find items containing 'Alpha'"

            # 存在しない検索語での検索
            response = client.get("/api/examples/?search=NonExistentTerm")
            assert response.status_code == 200

            empty_results = response.json()
            # 結果が0件または該当しないアイテムのみであることを確認
            for item in empty_results["items"]:
                assert "NonExistentTerm" not in item["name"].lower()

        finally:
            # テストデータクリーンアップ
            for example in created_examples:
                client.delete(f"/api/examples/{example['id']}")

    def test_error_handling_integration(self, client: TestClient):
        """エラーハンドリング統合テスト"""
        # 404エラーテスト
        response = client.get("/api/examples/999999")
        assert response.status_code == 404

        error_data = response.json()
        assert "detail" in error_data
        assert "not found" in error_data["detail"].lower()

        # 422バリデーションエラーテスト
        invalid_data = {}  # 必須フィールドなし
        response = client.post("/api/examples/", json=invalid_data)
        assert response.status_code == 422

        validation_error = response.json()
        assert "detail" in validation_error
        assert isinstance(validation_error["detail"], list)

        # 405 Method Not Allowedテスト
        response = client.patch("/api/health/")
        assert response.status_code == 405

    def test_cors_integration(self, client: TestClient):
        """CORS統合テスト"""
        # プリフライトリクエストのシミュレーション
        headers = {
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Content-Type",
        }

        response = client.options("/api/health/", headers=headers)
        assert response.status_code == 200

        # CORSヘッダーの確認
        cors_headers = response.headers
        assert "access-control-allow-origin" in cors_headers
        assert "access-control-allow-methods" in cors_headers
        assert "access-control-allow-credentials" in cors_headers

    def test_backward_compatibility(self, client: TestClient):
        """後方互換性テスト"""
        # 既存のシンプルヘルスチェックエンドポイント
        response = client.get("/api/health/simple")
        assert response.status_code == 200

        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"

        # ルートエンドポイント
        response = client.get("/")
        assert response.status_code == 200

    def test_api_response_consistency(self, client: TestClient):
        """APIレスポンス一貫性テスト"""
        # 成功レスポンスの一貫性
        response = client.get("/api/examples/")
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"

        data = response.json()
        # ページネーションレスポンスの必須フィールド
        required_fields = ["items", "total", "page", "per_page", "pages"]
        for field in required_fields:
            assert field in data, (
                f"Required field '{field}' missing in pagination response"
            )

        # エラーレスポンスの一貫性
        response = client.get("/api/examples/999999")
        assert response.status_code == 404
        assert response.headers["content-type"] == "application/json"

        error_data = response.json()
        assert "detail" in error_data

    def test_api_performance_integration(self, client: TestClient):
        """APIパフォーマンス統合テスト"""
        endpoints_to_test = ["/api/health/", "/api/examples/", "/api/health/simple"]

        for endpoint in endpoints_to_test:
            start_time = time.time()
            response = client.get(endpoint)
            end_time = time.time()

            response_time = end_time - start_time

            assert response.status_code == 200
            # Health APIはシステム情報取得のため時間がかかる場合がある
            threshold = 2.0 if endpoint == "/api/health/" else 1.0
            assert response_time < threshold, (
                f"Endpoint {endpoint} too slow: {response_time:.3f}s"
            )

    def test_concurrent_requests_integration(self, client: TestClient):
        """並行リクエスト統合テスト"""
        import concurrent.futures

        def make_request():
            response = client.get("/api/health/")
            return response.status_code

        # 10個の並行リクエストを送信
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(10)]
            results = [future.result() for future in futures]

        # 全てのリクエストが成功することを確認
        for status_code in results:
            assert status_code == 200

    def test_openapi_documentation_integration(self, client: TestClient):
        """OpenAPIドキュメント統合テスト"""
        # OpenAPIスキーマの取得
        response = client.get("/openapi.json")
        assert response.status_code == 200

        openapi_schema = response.json()

        # 基本的なOpenAPIスキーマ構造の確認
        assert "openapi" in openapi_schema
        assert "info" in openapi_schema
        assert "paths" in openapi_schema

        # 実装したエンドポイントがスキーマに含まれることを確認
        paths = openapi_schema["paths"]
        expected_paths = [
            "/api/health/",
            "/api/health/simple",
            "/api/examples/",
            "/api/examples/{example_id}",
        ]

        for expected_path in expected_paths:
            assert expected_path in paths, (
                f"Expected path '{expected_path}' not found in OpenAPI schema"
            )

        # Swagger UIの確認
        response = client.get("/docs")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]

    def test_database_transaction_integration(self, client: TestClient):
        """データベーストランザクション統合テスト"""
        # 正常なトランザクション
        create_data = {
            "name": "Transaction Test Example",
            "description": "Testing database transactions",
            "is_active": True,
        }

        response = client.post("/api/examples/", json=create_data)
        assert response.status_code == 201

        created_example = response.json()
        example_id = created_example["id"]

        # データが正常に保存されていることを確認
        response = client.get(f"/api/examples/{example_id}")
        assert response.status_code == 200

        # クリーンアップ
        response = client.delete(f"/api/examples/{example_id}")
        assert response.status_code == 200

        # 削除後の確認
        response = client.get(f"/api/examples/{example_id}")
        assert response.status_code == 404
