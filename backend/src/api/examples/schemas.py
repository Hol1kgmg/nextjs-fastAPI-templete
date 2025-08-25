from datetime import datetime

from pydantic import BaseModel, Field


class ExampleBase(BaseModel):
    """Example基底スキーマ"""

    name: str = Field(..., min_length=1, max_length=100, description="名前")
    description: str | None = Field(None, max_length=500, description="説明")
    is_active: bool = Field(True, description="アクティブ状態")


class ExampleCreate(ExampleBase):
    """Example作成リクエスト"""

    pass


class ExampleUpdate(BaseModel):
    """Example更新リクエスト"""

    name: str | None = Field(None, min_length=1, max_length=100, description="名前")
    description: str | None = Field(None, max_length=500, description="説明")
    is_active: bool | None = Field(None, description="アクティブ状態")


class ExampleResponse(ExampleBase):
    """Exampleレスポンス"""

    id: int = Field(..., description="ID")
    created_at: datetime = Field(..., description="作成日時")
    updated_at: datetime = Field(..., description="更新日時")

    class Config:
        from_attributes = True


class ExampleListResponse(BaseModel):
    """Exampleリストレスポンス"""

    items: list[ExampleResponse] = Field(..., description="アイテムリスト")
    total: int = Field(..., description="総件数")
    page: int = Field(..., description="現在ページ")
    per_page: int = Field(..., description="ページあたり件数")
    pages: int = Field(..., description="総ページ数")
