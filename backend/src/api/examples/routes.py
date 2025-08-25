from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.database import get_async_session

from .schemas import ExampleCreate, ExampleListResponse, ExampleResponse, ExampleUpdate
from .services import ExampleService

router = APIRouter(prefix="/api/examples", tags=["examples"])


@router.post("/", response_model=ExampleResponse, status_code=201)
async def create_example(
    example: ExampleCreate,
    db: AsyncSession = Depends(get_async_session),  # noqa: B008
) -> ExampleResponse:
    """新しいExampleを作成"""
    return await ExampleService.create_example(db, example)


@router.get("/", response_model=ExampleListResponse)
async def list_examples(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    db: AsyncSession = Depends(get_async_session),  # noqa: B008
) -> ExampleListResponse:
    """Exampleリストを取得"""
    return await ExampleService.list_examples(db, page, per_page, search)


@router.get("/{example_id}", response_model=ExampleResponse)
async def get_example(
    example_id: int,
    db: AsyncSession = Depends(get_async_session),  # noqa: B008
) -> ExampleResponse:
    """指定されたExampleを取得"""
    return await ExampleService.get_example(db, example_id)


@router.put("/{example_id}", response_model=ExampleResponse)
async def update_example(
    example_id: int,
    example: ExampleUpdate,
    db: AsyncSession = Depends(get_async_session),  # noqa: B008
) -> ExampleResponse:
    """指定されたExampleを更新"""
    return await ExampleService.update_example(db, example_id, example)


@router.delete("/{example_id}")
async def delete_example(
    example_id: int,
    db: AsyncSession = Depends(get_async_session),  # noqa: B008
) -> dict[str, str]:
    """指定されたExampleを削除"""
    await ExampleService.delete_example(db, example_id)
    return {"message": "Example deleted successfully"}
