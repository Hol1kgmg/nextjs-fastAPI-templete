from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """アプリケーション設定"""

    # 基本設定
    app_name: str = "FastAPI Backend"
    app_version: str = "1.0.0"
    debug: bool = False
    log_level: str = "INFO"

    # データベース設定
    database_url: str = "postgresql://user:root@localhost:5432/mydb"
    database_echo: bool = True

    # Docker用データベース設定（互換性のため）
    postgres_db: str = "mydb"
    postgres_user: str = "user"
    postgres_password: str = "root"

    # CORS設定
    cors_origins: list[str] = ["http://localhost:3000"]
    cors_allow_credentials: bool = True
    cors_allow_methods: list[str] = ["*"]
    cors_allow_headers: list[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    """設定インスタンスを取得（キャッシュ付き）"""
    return Settings()


# グローバル設定インスタンス（互換性のため）
settings = get_settings()
