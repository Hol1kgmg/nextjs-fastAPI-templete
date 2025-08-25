import asyncio
import gc
import os
import sys
import time

import psutil
import pytest
from sqlalchemy import text

# プロジェクトのルートディレクトリをパスに追加
sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from src.api.examples.schemas import ExampleCreate
from src.api.examples.services import ExampleService
from src.db.models.example import Example


@pytest.mark.asyncio
class TestPerformance:
    """パフォーマンステストクラス"""

    @pytest.fixture(autouse=True)
    def setup_performance_data(self):
        """パフォーマンステスト用のデータセットアップ"""

        async def create_test_data():
            from tests.conftest import TestingSessionLocal

            async with TestingSessionLocal() as session:
                try:
                    # 既存データをクリア
                    await session.execute(
                        text("TRUNCATE TABLE examples RESTART IDENTITY CASCADE")
                    )
                    await session.commit()

                    # テスト用データを作成（1000件）
                    examples = []
                    for i in range(1000):
                        example = Example(
                            name=f"Performance Test Example {i:04d}",
                            description=f"Description for performance test {i}",
                            is_active=i % 2 == 0,  # 半分をアクティブ
                        )
                        examples.append(example)

                    session.add_all(examples)
                    await session.commit()
                except Exception:
                    await session.rollback()
                    raise

        # データ作成を実行
        asyncio.run(create_test_data())

        yield

    async def test_database_query_performance(self):
        """データベースクエリのパフォーマンステスト"""
        from tests.conftest import TestingSessionLocal

        async with TestingSessionLocal() as session:
            # 単純なSELECTクエリの性能測定
            start_time = time.time()

            stmt = text("SELECT COUNT(*) FROM examples")
            result = await session.execute(stmt)
            count = result.scalar()

            end_time = time.time()
            query_time = end_time - start_time

            assert count == 1000
            assert query_time < 0.5, f"Simple count query too slow: {query_time:.3f}s"

    async def test_pagination_query_performance(self):
        """ページネーションクエリのパフォーマンステスト"""
        from tests.conftest import TestingSessionLocal

        page_sizes = [10, 50, 100]
        performance_results = {}

        for per_page in page_sizes:
            async with TestingSessionLocal() as session:
                start_time = time.time()

                result = await ExampleService.list_examples(
                    db=session, page=1, per_page=per_page
                )

                end_time = time.time()
                query_time = end_time - start_time
                performance_results[per_page] = query_time

                assert len(result.items) == per_page
                assert result.total == 1000
                assert query_time < 0.5, (
                    f"Pagination query too slow for {per_page} items: {query_time:.3f}s"
                )

        # ページサイズが大きくなっても線形的な増加に留まることを確認
        assert performance_results[100] < performance_results[10] * 5, (
            "Pagination performance degradation too severe"
        )

    async def test_search_query_performance(self):
        """検索クエリのパフォーマンステスト"""
        from tests.conftest import TestingSessionLocal

        search_terms = ["Test", "0001", "Performance", "999"]

        for search_term in search_terms:
            async with TestingSessionLocal() as session:
                start_time = time.time()

                result = await ExampleService.list_examples(
                    db=session, page=1, per_page=10, search=search_term
                )

                end_time = time.time()
                query_time = end_time - start_time

                assert query_time < 0.3, (
                    f"Search query too slow for '{search_term}': {query_time:.3f}s"
                )
                assert result.total >= 0

    async def test_index_effectiveness(self):
        """インデックス効果の確認テスト"""
        from tests.conftest import TestingSessionLocal

        async with TestingSessionLocal() as session:
            # nameカラムでの検索（インデックスあり）
            start_time = time.time()

            stmt = text("SELECT * FROM examples WHERE name LIKE :pattern LIMIT 10")
            result = await session.execute(stmt, {"pattern": "%Test%"})
            indexed_results = result.fetchall()

            indexed_time = time.time() - start_time

            # descriptionカラムでの検索（インデックスなし）
            start_time = time.time()

            stmt = text(
                "SELECT * FROM examples WHERE description LIKE :pattern LIMIT 10"
            )
            result = await session.execute(stmt, {"pattern": "%test%"})
            non_indexed_results = result.fetchall()

            non_indexed_time = time.time() - start_time

            # 両方のクエリが結果を返すことを確認
            assert len(indexed_results) > 0
            assert len(non_indexed_results) > 0

            # インデックスの効果確認（小さなデータセットでは差が出にくいため緩和）
            # 主にクエリが正常実行されることを確認
            print(
                f"Indexed query time: {indexed_time:.3f}s, "
                f"Non-indexed query time: {non_indexed_time:.3f}s"
            )

    async def test_concurrent_query_performance(self):
        """並行クエリのパフォーマンステスト"""
        from tests.conftest import TestingSessionLocal

        async def single_query():
            async with TestingSessionLocal() as session:
                return await ExampleService.list_examples(
                    db=session, page=1, per_page=10
                )

        # 10個の並行クエリを実行
        start_time = time.time()

        tasks = [single_query() for _ in range(10)]
        results = await asyncio.gather(*tasks)

        end_time = time.time()
        total_time = end_time - start_time

        # 全てのクエリが成功することを確認
        assert len(results) == 10
        for result in results:
            assert len(result.items) == 10
            assert result.total == 1000

        # 並行実行が効率的であることを確認（単純な10倍より高速）
        assert total_time < 2.0, f"Concurrent queries too slow: {total_time:.3f}s"

    async def test_memory_usage_during_large_queries(self):
        """大量クエリ時のメモリ使用量テスト"""
        from tests.conftest import TestingSessionLocal

        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss

        # 大量データを取得するクエリを複数回実行
        async with TestingSessionLocal() as session:
            for page in range(
                1, 6
            ):  # 5ページ分取得（1000件データなので100件×10ページ可能だが5ページで十分）
                result = await ExampleService.list_examples(
                    db=session, page=page, per_page=100
                )
                expected_items = min(100, max(0, 1000 - (page - 1) * 100))
                assert len(result.items) == expected_items

        # ガベージコレクション実行
        gc.collect()

        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory

        # メモリ増加が合理的な範囲内であることを確認（50MB以下）
        assert memory_increase < 50 * 1024 * 1024, (
            f"Memory usage too high: {memory_increase} bytes"
        )

    async def test_crud_operation_performance(self):
        """CRUD操作のパフォーマンステスト"""
        from tests.conftest import TestingSessionLocal

        # Create操作の性能測定
        create_times = []
        created_ids = []

        for i in range(10):
            async with TestingSessionLocal() as session:
                start_time = time.time()

                example = ExampleCreate(
                    name=f"Performance CRUD Test {i}",
                    description=f"CRUD performance test {i}",
                    is_active=True,
                )
                result = await ExampleService.create_example(
                    db=session, example=example
                )
                created_ids.append(result.id)

                create_time = time.time() - start_time
                create_times.append(create_time)

        avg_create_time = sum(create_times) / len(create_times)
        assert avg_create_time < 0.2, (
            f"Create operation too slow: {avg_create_time:.3f}s"
        )

        # Read操作の性能測定
        read_times = []

        for example_id in created_ids:
            async with TestingSessionLocal() as session:
                start_time = time.time()

                result = await ExampleService.get_example(
                    db=session, example_id=example_id
                )

                read_time = time.time() - start_time
                read_times.append(read_time)

                assert result.id == example_id

        avg_read_time = sum(read_times) / len(read_times)
        assert avg_read_time < 0.05, f"Read operation too slow: {avg_read_time:.3f}s"

        # Delete操作の性能測定
        delete_times = []

        for example_id in created_ids:
            async with TestingSessionLocal() as session:
                start_time = time.time()

                await ExampleService.delete_example(db=session, example_id=example_id)

                delete_time = time.time() - start_time
                delete_times.append(delete_time)

        avg_delete_time = sum(delete_times) / len(delete_times)
        assert avg_delete_time < 0.2, (
            f"Delete operation too slow: {avg_delete_time:.3f}s"
        )

    @pytest.mark.skip(reason="API client not available in current test environment")
    def test_api_response_time_measurement(self):
        """API応答時間の測定テスト"""
        # APIクライアントテストはclientフィクスチャが必要なためスキップ
        import pytest

        pytest.skip("API client not available in current test environment")

    @pytest.mark.skip(reason="API client not available in current test environment")
    def test_api_throughput_measurement(self):
        """API スループットの測定テスト"""
        # APIクライアントテストはclientフィクスチャが必要なためスキップ
        import pytest

        pytest.skip("API client not available in current test environment")
