"""SQLite/Postgres-compatible store via SQLModel. Documented as swappable —
DATABASE_URL points at Postgres in production without code changes."""

import sqlite3

from sqlmodel import Session, SQLModel, create_engine

from app.config import settings

is_sqlite = settings.database_url.startswith("sqlite")


def _sqlite_creator():
    # Azure Files (SMB) doesn't reliably support the POSIX byte-range locks
    # SQLite's default VFS uses, so even a single writer can see "database
    # is locked" on first access there. `nolock=1` disables SQLite's file
    # locking outright — safe here because this service is capped at
    # max_replicas=1 with a single uvicorn worker, so there's no real
    # concurrent-writer scenario to guard against.
    path = settings.database_url.removeprefix("sqlite:///")
    return sqlite3.connect(f"file:{path}?nolock=1", uri=True, check_same_thread=False)


engine = (
    create_engine("sqlite://", creator=_sqlite_creator)
    if is_sqlite
    else create_engine(settings.database_url)
)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
