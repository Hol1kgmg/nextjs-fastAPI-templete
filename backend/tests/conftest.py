import asyncio
import os
import sys
from collections.abc import AsyncGenerator

# プロジェクトのルートディレクトリをパスに追加
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from src.db.base import Base
from src.db.database import get_async_session
from src.main import app

# テスト用データベースURL（環境変数で設定可能）
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL", "postgresql+asyncpg://user:root@localhost:5432/test_mydb"
)

# テスト用エンジン
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    future=True,
    poolclass=NullPool,  # 接続プールを無効化してテスト間の競合を回避
)

# テスト用セッションファクトリー
TestingSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def override_get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """テスト用非同期データベースセッション"""
    async with TestingSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """テスト開始時にテーブル作成、終了時に削除"""

    async def create_tables():
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def drop_tables():
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)

    # テーブル作成
    asyncio.run(create_tables())

    yield

    # テーブル削除
    asyncio.run(drop_tables())


@pytest.fixture(scope="function")
def client():
    """テスト用FastAPIクライアント"""
    # 依存関係をオーバーライド
    app.dependency_overrides[get_async_session] = override_get_async_session

    # TestClientを作成
    with TestClient(app) as test_client:
        yield test_client

    # クリーンアップ
    app.dependency_overrides.clear()


@pytest.fixture(scope="function", autouse=True)
def cleanup_database():
    """各テスト後にデータベースをクリーンアップ"""
    yield

    async def clean_tables():
        async with TestingSessionLocal() as session:
            try:
                # 全テーブルのデータを削除（外部キー制約を考慮した順序）
                await session.execute(
                    text("TRUNCATE TABLE examples RESTART IDENTITY CASCADE")
                )
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    asyncio.run(clean_tables())


@pytest.fixture
def sample_health_data():
    """Health APIテスト用サンプルデータ"""
    return {
        "cpu_usage": 45.2,
        "memory_usage": 62.8,
        "disk_usage": 23.1,
        "uptime_seconds": 86400.0,
    }


@pytest.fixture
def sample_example_data():
    """Example APIテスト用サンプルデータ"""
    return {
        "name": "Sample Example",
        "description": "This is a sample example for testing",
    }


@pytest.fixture
def multiple_example_data():
    """複数のExample APIテスト用サンプルデータ"""
    return [
        {"name": "Example 1", "description": "First test example"},
        {"name": "Example 2", "description": "Second test example"},
        {"name": "Example 3", "description": "Third test example"},
        {"name": "Example 4", "description": "Fourth test example"},
        {"name": "Example 5", "description": "Fifth test example"},
    ]
