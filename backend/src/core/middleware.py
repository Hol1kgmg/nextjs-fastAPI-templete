import logging
import time
from datetime import datetime
from typing import Any

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """統一エラーハンドラーミドルウェア"""

    async def dispatch(self, request: Request, call_next: Any) -> Any:
        try:
            response = await call_next(request)
            return response
        except HTTPException as exc:
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "error": True,
                    "message": exc.detail,
                    "timestamp": datetime.now().isoformat(),
                    "path": str(request.url),
                },
            )
        except Exception as exc:
            logger.error(f"Unhandled exception: {exc}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "error": True,
                    "message": "Internal server error",
                    "timestamp": datetime.now().isoformat(),
                    "path": str(request.url),
                },
            )


class LoggingMiddleware(BaseHTTPMiddleware):
    """リクエスト/レスポンスログミドルウェア"""

    async def dispatch(self, request: Request, call_next: Any) -> Any:
        start_time = time.time()

        # リクエストログ
        logger.info(f"Request: {request.method} {request.url}")

        response = await call_next(request)

        # レスポンスログ
        process_time = time.time() - start_time
        logger.info(f"Response: {response.status_code} - {process_time:.3f}s")

        return response
