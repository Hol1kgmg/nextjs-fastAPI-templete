import asyncio
import logging
import time
from collections.abc import Callable
from functools import wraps
from typing import Any

logger = logging.getLogger(__name__)


def monitor_performance(
    threshold: float = 0.1,
) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """パフォーマンス監視デコレータ"""

    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            start_time = time.perf_counter()
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                execution_time = time.perf_counter() - start_time
                if execution_time > threshold:
                    logger.warning(
                        f"Slow operation detected: {func.__name__} "
                        f"took {execution_time:.3f}s"
                    )
                else:
                    logger.debug(
                        f"Performance: {func.__name__} took {execution_time:.3f}s"
                    )

        @wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            start_time = time.perf_counter()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                execution_time = time.perf_counter() - start_time
                if execution_time > threshold:
                    logger.warning(
                        f"Slow operation detected: {func.__name__} "
                        f"took {execution_time:.3f}s"
                    )
                else:
                    logger.debug(
                        f"Performance: {func.__name__} took {execution_time:.3f}s"
                    )

        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper

    return decorator
