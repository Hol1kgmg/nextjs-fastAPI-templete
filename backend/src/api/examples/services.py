from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.common.exceptions import NotFoundException
from src.db.models.example import Example

from .schemas import ExampleCreate, ExampleListResponse, ExampleResponse, ExampleUpdate


class ExampleService:
    """Example サービス"""

    @staticmethod
    async def create_example(
        db: AsyncSession, example: ExampleCreate
    ) -> ExampleResponse:
        """新しいExampleを作成"""
        db_example = Example(**example.model_dump())
        db.add(db_example)
        await db.commit()
        await db.refresh(db_example)
        return ExampleResponse.model_validate(db_example)

    @staticmethod
    async def get_example(db: AsyncSession, example_id: int) -> ExampleResponse:
        """指定されたExampleを取得"""
        stmt = select(Example).where(Example.id == example_id)
        result = await db.execute(stmt)
        db_example = result.scalar_one_or_none()

        if not db_example:
            raise NotFoundException("Example")

        return ExampleResponse.model_validate(db_example)

    @staticmethod
    async def list_examples(
        db: AsyncSession,
        page: int = 1,
        per_page: int = 10,
        search: str | None = None,
    ) -> ExampleListResponse:
        """Exampleリストを取得"""
        # ベースクエリ
        stmt = select(Example)

        # 検索条件
        if search:
            stmt = stmt.where(Example.name.ilike(f"%{search}%"))

        # 総件数取得
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await db.execute(count_stmt)
        total = total_result.scalar() or 0

        # ページネーション
        offset = (page - 1) * per_page
        stmt = stmt.offset(offset).limit(per_page).order_by(Example.created_at.desc())

        result = await db.execute(stmt)
        examples = result.scalars().all()

        # レスポンス作成
        items = [ExampleResponse.model_validate(example) for example in examples]
        pages = (total + per_page - 1) // per_page

        return ExampleListResponse(
            items=items, total=total, page=page, per_page=per_page, pages=pages
        )

    @staticmethod
    async def list_examples_optimized(
        db: AsyncSession,
        page: int = 1,
        per_page: int = 10,
        search: str | None = None,
    ) -> ExampleListResponse:
        """最適化されたExampleリスト取得"""
        # ベースクエリ
        stmt = select(Example)

        # 検索条件（インデックスを活用）
        if search:
            stmt = stmt.where(Example.name.ilike(f"%{search}%"))

        # 効率的な総件数取得（サブクエリを使用）
        count_stmt = select(func.count(Example.id)).select_from(stmt.subquery())
        total_result = await db.execute(count_stmt)
        total = total_result.scalar() or 0

        # ページネーション（LIMIT/OFFSETの最適化）
        offset = (page - 1) * per_page
        stmt = (
            stmt.offset(offset).limit(per_page).order_by(Example.id.desc())
        )  # idでソート（インデックス活用）

        result = await db.execute(stmt)
        examples = result.scalars().all()

        # レスポンス作成
        items = [ExampleResponse.model_validate(example) for example in examples]
        pages = (total + per_page - 1) // per_page

        return ExampleListResponse(
            items=items, total=total, page=page, per_page=per_page, pages=pages
        )

    @staticmethod
    async def update_example(
        db: AsyncSession, example_id: int, example: ExampleUpdate
    ) -> ExampleResponse:
        """指定されたExampleを更新"""
        stmt = select(Example).where(Example.id == example_id)
        result = await db.execute(stmt)
        db_example = result.scalar_one_or_none()

        if not db_example:
            raise NotFoundException("Example")

        # 更新データの適用
        update_data = example.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_example, field, value)

        await db.commit()
        await db.refresh(db_example)
        return ExampleResponse.model_validate(db_example)

    @staticmethod
    async def delete_example(db: AsyncSession, example_id: int) -> None:
        """指定されたExampleを削除"""
        stmt = select(Example).where(Example.id == example_id)
        result = await db.execute(stmt)
        db_example = result.scalar_one_or_none()

        if not db_example:
            raise NotFoundException("Example")

        await db.delete(db_example)
        await db.commit()
