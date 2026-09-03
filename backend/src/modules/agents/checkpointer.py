import os
from contextlib import asynccontextmanager, contextmanager
from typing import AsyncGenerator, Generator

from dotenv import load_dotenv
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

load_dotenv()


def get_database_url() -> str:
    """Lấy connection string PostgreSQL từ biến môi trường."""
    db_url = os.getenv("BACKEND_DATABASE_URL") or os.getenv("DATABASE_URL")
    if not db_url:
        raise ValueError(
            "Biến môi trường 'BACKEND_DATABASE_URL' hoặc 'DATABASE_URL' chưa được cấu hình trong file .env"
        )
    return db_url


def create_postgres_saver(
    database_url: str | None = None,
    max_size: int = 10,
    setup: bool = True,
) -> PostgresSaver:
    """Khởi tạo PostgresSaver sử dụng ConnectionPool để quản lý kết nối hiệu năng cao."""
    url = database_url or get_database_url()
    pool = ConnectionPool(
        conninfo=url,
        max_size=max_size,
        kwargs={"autocommit": True, "row_factory": dict_row},
    )
    checkpointer = PostgresSaver(pool)
    if setup:
        checkpointer.setup()
    return checkpointer


@asynccontextmanager
async def get_async_checkpointer(
    database_url: str | None = None,
    run_setup: bool = True,
) -> AsyncGenerator[AsyncPostgresSaver, None]:
    """Context manager cung cấp AsyncPostgresSaver cho ứng dụng bất đồng bộ (FastAPI lifespan)."""
    url = database_url or get_database_url()
    async with AsyncPostgresSaver.from_conn_string(url) as checkpointer:
        if run_setup:
            await checkpointer.setup()
        yield checkpointer


@contextmanager
def get_sync_checkpointer(
    database_url: str | None = None,
    run_setup: bool = True,
) -> Generator[PostgresSaver, None, None]:
    """Context manager cung cấp PostgresSaver cho các tác vụ đồng bộ ngắn hạn."""
    url = database_url or get_database_url()
    with PostgresSaver.from_conn_string(url) as checkpointer:
        if run_setup:
            checkpointer.setup()
        yield checkpointer
