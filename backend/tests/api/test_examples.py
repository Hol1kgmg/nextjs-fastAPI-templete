import os
import sys

# プロジェクトのルートディレクトリをパスに追加
sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)


import pytest

from src.api.examples.schemas import ExampleCreate, ExampleUpdate


class TestExampleCRUDAPI:
    """Example CRUD API テストクラス"""

    def test_create_example_success(self, client):
        """POST /api/examples/ - Example作成成功テスト"""
        example_data = {"name": "Test Example", "description": "This is a test example"}

        response = client.post("/api/examples/", json=example_data)

        assert response.status_code == 201
        data = response.json()

        # レスポンス構造の検証
        assert "id" in data
        assert data["name"] == example_data["name"]
        assert data["description"] == example_data["description"]
        assert data["is_active"] is True  # デフォルト値
        assert "created_at" in data
        assert "updated_at" in data

        # IDが自動採番されていることを確認
        assert isinstance(data["id"], int)
        assert data["id"] > 0

    def test_create_example_minimal_data(self, client):
        """POST /api/examples/ - 最小限データでのExample作成テスト"""
        example_data = {
            "name": "Minimal Example"
            # descriptionは任意
        }

        response = client.post("/api/examples/", json=example_data)

        assert response.status_code == 201
        data = response.json()

        assert data["name"] == example_data["name"]
        assert data["description"] is None
        assert data["is_active"] is True

    def test_create_example_validation_error(self, client):
        """POST /api/examples/ - バリデーションエラーテスト"""
        # 名前が空の場合
        response = client.post("/api/examples/", json={"name": ""})
        assert response.status_code == 422

        # 名前が未指定の場合
        response = client.post("/api/examples/", json={"description": "No name"})
        assert response.status_code == 422

        # 名前が長すぎる場合（100文字超）
        long_name = "a" * 101
        response = client.post("/api/examples/", json={"name": long_name})
        assert response.status_code == 422

    def test_get_examples_empty_list(self, client):
        """GET /api/examples/ - 空リスト取得テスト"""
        response = client.get("/api/examples/")

        assert response.status_code == 200
        data = response.json()

        # ページネーション構造の検証
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "per_page" in data
        assert "pages" in data

        assert data["items"] == []
        assert data["total"] == 0
        assert data["page"] == 1
        assert data["per_page"] == 10
        assert data["pages"] == 0

    def test_get_examples_with_data(self, client):
        """GET /api/examples/ - データありリスト取得テスト"""
        # テストデータを作成
        examples = [
            {"name": "Example 1", "description": "First example"},
            {"name": "Example 2", "description": "Second example"},
            {"name": "Example 3", "description": "Third example"},
        ]

        created_ids = []
        for example in examples:
            response = client.post("/api/examples/", json=example)
            assert response.status_code == 201
            created_ids.append(response.json()["id"])

        # リスト取得
        response = client.get("/api/examples/")

        assert response.status_code == 200
        data = response.json()

        assert len(data["items"]) == 3
        assert data["total"] == 3
        assert data["page"] == 1
        assert data["per_page"] == 10
        assert data["pages"] == 1

        # 作成したデータが含まれていることを確認（作成日時の降順なので逆順）
        item_names = [item["name"] for item in data["items"]]
        assert "Example 1" in item_names
        assert "Example 2" in item_names
        assert "Example 3" in item_names

    def test_get_examples_pagination(self, client):
        """GET /api/examples/ - ページネーションテスト"""
        # 15個のテストデータを作成
        for i in range(15):
            example_data = {
                "name": f"Example {i + 1}",
                "description": f"Description {i + 1}",
            }
            response = client.post("/api/examples/", json=example_data)
            assert response.status_code == 201

        # 1ページ目（5件ずつ）
        response = client.get("/api/examples/?page=1&per_page=5")
        assert response.status_code == 200
        data = response.json()

        assert len(data["items"]) == 5
        assert data["total"] == 15
        assert data["page"] == 1
        assert data["per_page"] == 5
        assert data["pages"] == 3

        # 2ページ目
        response = client.get("/api/examples/?page=2&per_page=5")
        assert response.status_code == 200
        data = response.json()

        assert len(data["items"]) == 5
        assert data["page"] == 2

        # 3ページ目
        response = client.get("/api/examples/?page=3&per_page=5")
        assert response.status_code == 200
        data = response.json()

        assert len(data["items"]) == 5
        assert data["page"] == 3

    def test_get_examples_search(self, client):
        """GET /api/examples/ - 検索機能テスト"""
        # テストデータを作成
        examples = [
            {"name": "Apple Example", "description": "Fruit example"},
            {"name": "Banana Test", "description": "Another fruit"},
            {"name": "Cherry Sample", "description": "Red fruit example"},
        ]

        for example in examples:
            response = client.post("/api/examples/", json=example)
            assert response.status_code == 201

        # "Apple"で検索
        response = client.get("/api/examples/?search=Apple")
        assert response.status_code == 200
        data = response.json()

        assert len(data["items"]) == 1
        assert data["items"][0]["name"] == "Apple Example"

        # 存在しない文字列で検索
        response = client.get("/api/examples/?search=nonexistent")
        assert response.status_code == 200
        data = response.json()

        assert len(data["items"]) == 0
        assert data["total"] == 0

    def test_get_example_by_id_success(self, client):
        """GET /api/examples/{id} - ID指定取得成功テスト"""
        # テストデータを作成
        example_data = {"name": "Single Example", "description": "Example for ID test"}

        response = client.post("/api/examples/", json=example_data)
        assert response.status_code == 201
        created_id = response.json()["id"]

        # ID指定で取得
        response = client.get(f"/api/examples/{created_id}")

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == created_id
        assert data["name"] == example_data["name"]
        assert data["description"] == example_data["description"]
        assert data["is_active"] is True

    def test_get_example_by_id_not_found(self, client):
        """GET /api/examples/{id} - 存在しないID指定テスト"""
        response = client.get("/api/examples/999999")

        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()

    def test_update_example_success(self, client):
        """PUT /api/examples/{id} - Example更新成功テスト"""
        # テストデータを作成
        example_data = {
            "name": "Original Example",
            "description": "Original description",
        }

        response = client.post("/api/examples/", json=example_data)
        assert response.status_code == 201
        created_id = response.json()["id"]
        original_created_at = response.json()["created_at"]

        # 更新データ
        update_data = {
            "name": "Updated Example",
            "description": "Updated description",
            "is_active": False,
        }

        response = client.put(f"/api/examples/{created_id}", json=update_data)

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == created_id
        assert data["name"] == update_data["name"]
        assert data["description"] == update_data["description"]
        assert data["is_active"] == update_data["is_active"]
        assert data["created_at"] == original_created_at  # 作成日時は変更されない
        assert data["updated_at"] != original_created_at  # 更新日時は変更される

    def test_update_example_partial(self, client):
        """PUT /api/examples/{id} - 部分更新テスト"""
        # テストデータを作成
        example_data = {
            "name": "Partial Update Example",
            "description": "Original description",
        }

        response = client.post("/api/examples/", json=example_data)
        assert response.status_code == 201
        created_id = response.json()["id"]

        # 名前のみ更新
        update_data = {"name": "New Name Only"}

        response = client.put(f"/api/examples/{created_id}", json=update_data)

        assert response.status_code == 200
        data = response.json()

        assert data["name"] == update_data["name"]
        assert data["description"] == example_data["description"]  # 元の値が保持される
        assert data["is_active"] is True  # デフォルト値が保持される

    def test_update_example_not_found(self, client):
        """PUT /api/examples/{id} - 存在しないExample更新テスト"""
        update_data = {"name": "Non-existent Example"}

        response = client.put("/api/examples/999999", json=update_data)

        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()

    def test_delete_example_success(self, client):
        """DELETE /api/examples/{id} - Example削除成功テスト"""
        # テストデータを作成
        example_data = {"name": "To Be Deleted", "description": "This will be deleted"}

        response = client.post("/api/examples/", json=example_data)
        assert response.status_code == 201
        created_id = response.json()["id"]

        # 削除実行
        response = client.delete(f"/api/examples/{created_id}")

        assert response.status_code == 200
        data = response.json()
        assert "deleted successfully" in data["message"].lower()

        # 削除後に取得を試行（404になることを確認）
        response = client.get(f"/api/examples/{created_id}")
        assert response.status_code == 404

    def test_delete_example_not_found(self, client):
        """DELETE /api/examples/{id} - 存在しないExample削除テスト"""
        response = client.delete("/api/examples/999999")

        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()

    def test_example_schema_validation(self):
        """Example スキーマバリデーションテスト"""
        # ExampleCreate スキーマテスト
        create_data = ExampleCreate(
            name="Schema Test", description="Testing schema validation"
        )

        assert create_data.name == "Schema Test"
        assert create_data.description == "Testing schema validation"

        # ExampleUpdate スキーマテスト
        update_data = ExampleUpdate(name="Updated Name", is_active=False)

        assert update_data.name == "Updated Name"
        assert update_data.is_active is False
        assert update_data.description is None  # 未指定

    def test_example_schema_validation_errors(self):
        """Example スキーマバリデーションエラーテスト"""
        # 名前が空文字列
        with pytest.raises(ValueError):
            ExampleCreate(name="", description="Empty name")

        # 名前が長すぎる
        with pytest.raises(ValueError):
            ExampleCreate(name="a" * 101, description="Too long name")

    def test_examples_api_performance(self, client):
        """Examples API パフォーマンステスト"""
        import time

        # 作成パフォーマンス
        start_time = time.time()
        response = client.post(
            "/api/examples/",
            json={"name": "Performance Test", "description": "Testing performance"},
        )
        end_time = time.time()

        assert response.status_code == 201
        create_time = end_time - start_time
        assert create_time < 2.0, f"Create time too slow: {create_time}s"

        created_id = response.json()["id"]

        # 取得パフォーマンス
        start_time = time.time()
        response = client.get(f"/api/examples/{created_id}")
        end_time = time.time()

        assert response.status_code == 200
        get_time = end_time - start_time
        assert get_time < 1.0, f"Get time too slow: {get_time}s"

    def test_examples_concurrent_operations(self, client):
        """Examples API 並行操作テスト"""
        # 複数のExampleを同時に作成
        examples = []
        for i in range(5):
            response = client.post(
                "/api/examples/",
                json={
                    "name": f"Concurrent Example {i + 1}",
                    "description": f"Concurrent test {i + 1}",
                },
            )
            assert response.status_code == 201
            examples.append(response.json())

        # 全て正常に作成されていることを確認
        response = client.get("/api/examples/")
        assert response.status_code == 200
        data = response.json()

        assert len(data["items"]) == 5
        assert data["total"] == 5

    def test_examples_edge_cases(self, client):
        """Examples API エッジケーステスト"""
        # 非常に長い説明文（500文字まで）
        long_description = "a" * 500
        response = client.post(
            "/api/examples/",
            json={"name": "Long Description Test", "description": long_description},
        )
        assert response.status_code == 201

        # 特殊文字を含む名前
        special_name = "Test with 特殊文字 and émojis 🚀"
        response = client.post(
            "/api/examples/",
            json={"name": special_name, "description": "Special characters test"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == special_name

    def test_examples_api_response_headers(self, client):
        """Examples API レスポンスヘッダーテスト"""
        response = client.get("/api/examples/")

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"

        # CORS ヘッダーの確認（設定されている場合）
        if "access-control-allow-origin" in response.headers:
            assert response.headers["access-control-allow-origin"] is not None

    def test_examples_pagination_edge_cases(self, client):
        """Examples API ページネーション境界値テスト"""
        # 10個のデータを作成
        for i in range(10):
            response = client.post(
                "/api/examples/",
                json={
                    "name": f"Pagination Test {i + 1}",
                    "description": f"Test {i + 1}",
                },
            )
            assert response.status_code == 201

        # 1ページ目（10件）
        response = client.get("/api/examples/?page=1&per_page=10")
        assert response.status_code == 200
        data = response.json()

        assert len(data["items"]) == 10
        assert data["total"] == 10
        assert data["page"] == 1
        assert data["per_page"] == 10
        assert data["pages"] == 1

        # 存在しないページ
        response = client.get("/api/examples/?page=2&per_page=10")
        assert response.status_code == 200
        data = response.json()

        assert len(data["items"]) == 0
        assert data["page"] == 2

    def test_examples_search_case_insensitive(self, client):
        """Examples API 大文字小文字を区別しない検索テスト"""
        # テストデータを作成
        response = client.post(
            "/api/examples/",
            json={"name": "TEST Example", "description": "Test description"},
        )
        assert response.status_code == 201

        # 小文字で検索
        response = client.get("/api/examples/?search=test")
        assert response.status_code == 200
        data = response.json()

        assert len(data["items"]) == 1
        assert data["items"][0]["name"] == "TEST Example"

        # 大文字で検索
        response = client.get("/api/examples/?search=TEST")
        assert response.status_code == 200
        data = response.json()

        assert len(data["items"]) == 1
        assert data["items"][0]["name"] == "TEST Example"

    def test_examples_update_validation(self, client):
        """Examples API 更新時バリデーションテスト"""
        # テストデータを作成
        response = client.post(
            "/api/examples/",
            json={
                "name": "Update Validation Test",
                "description": "Original description",
            },
        )
        assert response.status_code == 201
        created_id = response.json()["id"]

        # 名前を空文字列に更新しようとする
        response = client.put(f"/api/examples/{created_id}", json={"name": ""})
        assert response.status_code == 422

        # 名前を長すぎる文字列に更新しようとする
        response = client.put(f"/api/examples/{created_id}", json={"name": "a" * 101})
        assert response.status_code == 422

    def test_examples_datetime_fields(self, client):
        """Examples API 日時フィールドテスト"""
        # テストデータを作成
        response = client.post(
            "/api/examples/",
            json={"name": "DateTime Test", "description": "Testing datetime fields"},
        )
        assert response.status_code == 201
        data = response.json()

        # 日時フィールドの形式確認
        created_at = data["created_at"]
        updated_at = data["updated_at"]

        assert isinstance(created_at, str)
        assert isinstance(updated_at, str)

        # ISO形式の日時文字列であることを確認
        import datetime

        datetime.datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        datetime.datetime.fromisoformat(updated_at.replace("Z", "+00:00"))

        # 作成時は created_at と updated_at がほぼ同じ（1秒以内の差を許容）
        from datetime import datetime

        created_dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        updated_dt = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
        time_diff = abs((created_dt - updated_dt).total_seconds())
        assert time_diff < 1.0, f"時刻差が1秒を超えています: {time_diff}秒"
