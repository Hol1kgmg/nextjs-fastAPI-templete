from typing import Any, TypeVar

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .responses import PaginationMeta

T = TypeVar("T")


class PaginationHelper:
    """ページネーションヘルパー"""

    @staticmethod
    def calculate_pagination_meta(
        total: int, page: int, per_page: int
    ) -> PaginationMeta:
        """ページネーションメタ情報を計算"""
        pages = (total + per_page - 1) // per_page if total > 0 else 0
        has_next = page < pages
        has_prev = page > 1

        return PaginationMeta(
            total=total,
            page=page,
            per_page=per_page,
            pages=pages,
            has_next=has_next,
            has_prev=has_prev,
        )

    @staticmethod
    async def paginate_query(
        db: AsyncSession, query: Any, page: int, per_page: int
    ) -> tuple[list[Any], PaginationMeta]:
        """SQLAlchemyクエリをページネーション"""
        # 総件数取得
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # ページネーション適用
        offset = (page - 1) * per_page
        paginated_query = query.offset(offset).limit(per_page)

        result = await db.execute(paginated_query)
        items = result.scalars().all()

        # メタ情報計算
        meta = PaginationHelper.calculate_pagination_meta(total, page, per_page)

        return list(items), meta
