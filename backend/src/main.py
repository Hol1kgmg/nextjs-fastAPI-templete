from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.examples.routes import router as examples_router

# APIルート
from src.api.health.routes import router as health_router

# 設定とミドルウェア
from src.core.config import settings
from src.core.logging import setup_logging
from src.core.middleware import ErrorHandlerMiddleware, LoggingMiddleware

# ログ設定初期化
setup_logging()

app = FastAPI(
    title=settings.app_name, version=settings.app_version, debug=settings.debug
)

# ミドルウェア設定
app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

# APIルート登録
app.include_router(health_router)
app.include_router(examples_router)


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Hello, World!"}


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy"}
