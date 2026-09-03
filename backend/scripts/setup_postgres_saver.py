#!/usr/bin/env python3
"""
Script khởi tạo và thiết lập các bảng lưu trữ Checkpoint cho LangGraph trong PostgreSQL.
Các bảng được tạo gồm:
  - checkpoints
  - checkpoint_blobs
  - checkpoint_writes
  - checkpoint_migrations
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# Xác định đường dẫn thư mục gốc backend và load file .env
BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BACKEND_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)


def get_database_url() -> str:
    """Lấy connection string PostgreSQL từ biến môi trường."""
    db_url = os.getenv("BACKEND_DATABASE_URL") or os.getenv("DATABASE_URL")
    if not db_url:
        print(
            "❌ LỖI: Không tìm thấy biến môi trường 'BACKEND_DATABASE_URL' hoặc 'DATABASE_URL' trong .env"
        )
        print(f"   Vui lòng kiểm tra file: {ENV_PATH}")
        sys.exit(1)
    return db_url


def setup_postgres_checkpointer(db_url: str) -> None:
    """Khởi tạo các bảng lưu checkpoint bằng PostgresSaver."""
    try:
        from langgraph.checkpoint.postgres import PostgresSaver
    except ImportError:
        print("❌ LỖI: Chưa cài đặt thư viện 'langgraph-checkpoint-postgres'!")
        print("\n👉 Vui lòng chạy lệnh sau bằng uv để cài đặt:")
        print('   uv add langgraph-checkpoint-postgres "psycopg[binary,pool]"\n')
        sys.exit(1)

    # Che mật khẩu khi hiển thị log
    masked_url = db_url
    if "@" in db_url and ":" in db_url.split("@")[0]:
        protocol_user, rest = db_url.split("@", 1)
        protocol, credentials = protocol_user.split("://", 1)
        if ":" in credentials:
            user, _ = credentials.split(":", 1)
            masked_url = f"{protocol}://{user}:****@{rest}"

    print(f"🔄 Đang kết nối tới PostgreSQL: {masked_url}")

    try:
        # Sử dụng PostgresSaver để chạy .setup()
        with PostgresSaver.from_conn_string(db_url) as checkpointer:
            print("⏳ Đang thiết lập bảng checkpoint schema...")
            checkpointer.setup()
            print("✅ Đã thực thi setup schema thành công!")

        # Kiểm tra xác nhận các bảng đã được tạo thành công
        verify_tables(db_url)

    except Exception as e:
        print(f"❌ Xảy ra lỗi trong quá trình setup: {e}")
        print("\nGợi ý kiểm tra:")
        print(" 1. Đảm bảo dịch vụ PostgreSQL đang chạy.")
        print(
            " 2. Kiểm tra thông tin đăng nhập (user, password, host, port, database name)."
        )
        print(" 3. Đảm bảo user có quyền CREATE TABLE trên database mục tiêu.")
        sys.exit(1)


def verify_tables(db_url: str) -> None:
    """Xác thực danh sách bảng đã tồn tại trong database."""
    try:
        import psycopg

        expected_tables = {
            "checkpoints",
            "checkpoint_blobs",
            "checkpoint_writes",
            "checkpoint_migrations",
        }

        with psycopg.connect(db_url) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                      AND table_name IN ('checkpoints', 'checkpoint_blobs', 'checkpoint_writes', 'checkpoint_migrations');
                    """
                )
                found_tables = {row[0] for row in cur.fetchall()}

        print("\n📋 Trạng thái các bảng trong PostgreSQL:")
        for tbl in sorted(expected_tables):
            status = "✅ Tồn tại" if tbl in found_tables else "❌ Chưa có"
            print(f"   - {tbl:<25}: {status}")

        if expected_tables.issubset(found_tables):
            print(
                "\n🎉 HOÀN TẤT! Toàn bộ bảng PostgresSaver cho LangGraph đã sẵn sàng hoạt động."
            )
        else:
            print("\n⚠️ CẢNH BÁO: Một số bảng chưa được tạo đầy đủ.")

    except Exception as e:
        print(f"⚠️ Không thể kiểm tra trực tiếp danh sách bảng: {e}")


def main():
    print("=" * 60)
    print("🚀 THIẾT LẬP POSTGRES CHECKPOINTER CHO LANGGRAPH BACKEND")
    print("=" * 60)
    db_url = get_database_url()
    setup_postgres_checkpointer(db_url)


if __name__ == "__main__":
    main()
