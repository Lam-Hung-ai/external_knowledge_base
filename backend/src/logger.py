import logging
import os
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


def setup_logging():
    handlers = []
    level = os.getenv("LOG_LEVEL")
    log_path = Path(__file__).resolve() / "logs" / "backend.log"

    os.makedirs(os.path.dirname(log_path), exist_ok=True)
    file_hander = TimedRotatingFileHandler(
        filename=log_path,
        when="midnight",
        interval=1,
        backupCount=7,
        encoding="utf-8",
        utc=True,
    )

    handlers.append(file_hander)

    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        handlers=handlers,
        force=True,
    )

    logging.getLogger(__name__).info(
        "Logging ready: level=%s, output=%s", level, log_path
    )
