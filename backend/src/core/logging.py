import logging
import sys

from .config import settings


def setup_logging() -> None:
    """ログ設定を初期化"""

    # ログレベル設定
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)

    # ログフォーマット
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # 基本設定
    logging.basicConfig(
        level=log_level, format=log_format, handlers=[logging.StreamHandler(sys.stdout)]
    )

    # FastAPI関連ログの調整
    if not settings.debug:
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    logger = logging.getLogger(__name__)
    logger.info(f"Logging initialized with level: {settings.log_level}")


def get_logger(name: str) -> logging.Logger:
    """名前付きロガーを取得"""
    return logging.getLogger(name)
