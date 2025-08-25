from typing import Any

from fastapi import HTTPException, status


class APIException(HTTPException):
    """API例外基底クラス"""

    def __init__(
        self,
        status_code: int,
        message: str,
        details: list[dict[str, Any]] | None = None,
    ):
        self.message = message
        self.details = details or []
        super().__init__(status_code=status_code, detail=message)


class ValidationException(APIException):
    """バリデーション例外"""

    def __init__(
        self,
        message: str = "Validation failed",
        details: list[dict[str, Any]] | None = None,
    ):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            message=message,
            details=details,
        )


class NotFoundException(APIException):
    """リソース未発見例外"""

    def __init__(self, resource: str = "Resource"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND, message=f"{resource} not found"
        )


class ConflictException(APIException):
    """競合例外"""

    def __init__(self, message: str = "Resource conflict"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, message=message)
