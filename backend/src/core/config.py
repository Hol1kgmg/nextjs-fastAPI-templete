from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """アプリケーション設定"""

    app_name: str = "FastAPI Backend"
    app_version: str = "1.0.0"
    debug: bool = False

    # CORS設定
    cors_origins: list[str] = ["http://localhost:3000"]
    cors_allow_credentials: bool = True
    cors_allow_methods: list[str] = ["*"]
    cors_allow_headers: list[str] = ["*"]

    # ログ設定
    log_level: str = "INFO"

    # データベース設定
    database_url: str = "postgresql://user:root@localhost:5432/mydb"

    # Docker用データベース設定（使用されないが.envファイルとの互換性のため）
    postgres_db: str = "mydb"
    postgres_user: str = "user"
    postgres_password: str = "root"

    class Config:
        env_file = ".env"


settings = Settings()
