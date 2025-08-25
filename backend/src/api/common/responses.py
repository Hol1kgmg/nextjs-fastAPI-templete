from typing import Any

from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    """エラー詳細"""

    field: str | None = Field(None, description="エラーフィールド")
    message: str = Field(..., description="エラーメッセージ")
    code: str | None = Field(None, description="エラーコード")


class ErrorResponse(BaseModel):
    """エラーレスポンス"""

    error: bool = Field(True, description="エラーフラグ")
    message: str = Field(..., description="エラーメッセージ")
    details: list[ErrorDetail] | None = Field(None, description="エラー詳細")
    timestamp: str = Field(..., description="エラー発生時刻")


class SuccessResponse(BaseModel):
    """成功レスポンス"""

    success: bool = Field(True, description="成功フラグ")
    data: Any = Field(..., description="レスポンスデータ")
    message: str | None = Field(None, description="メッセージ")


class PaginationMeta(BaseModel):
    """ページネーションメタ情報"""

    total: int = Field(..., description="総件数")
    page: int = Field(..., description="現在ページ")
    per_page: int = Field(..., description="ページあたり件数")
    pages: int = Field(..., description="総ページ数")
    has_next: bool = Field(..., description="次ページ有無")
    has_prev: bool = Field(..., description="前ページ有無")
