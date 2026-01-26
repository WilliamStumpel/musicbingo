"""Database connection module for Music Bingo API.

Provides SQLite database connectivity with:
- Connection factory with row_factory for dict-like access
- Database initialization (creates tables on first run)
- Transaction context manager
"""

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

# Database file location in musicbingo_api/data/ directory
DATA_DIR = Path(__file__).parent.parent.parent / "data"
DATABASE_PATH = DATA_DIR / "musicbingo.db"


def get_connection() -> sqlite3.Connection:
    """Get a database connection with row_factory for dict-like access.

    Returns:
        sqlite3.Connection configured with Row factory and foreign keys enabled.
    """
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def transaction() -> Generator[sqlite3.Connection, None, None]:
    """Context manager for database transactions.

    Commits on success, rolls back on exception.

    Example:
        with transaction() as conn:
            conn.execute("INSERT INTO venues ...")
            conn.execute("INSERT INTO venue_nights ...")
        # Auto-committed after exiting without error

    Yields:
        sqlite3.Connection with active transaction.
    """
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    """Initialize the database.

    Creates the data directory if it doesn't exist and runs schema creation.
    Safe to call multiple times (uses CREATE TABLE IF NOT EXISTS).
    """
    # Import here to avoid circular imports
    from .db_models import create_tables

    # Ensure data directory exists
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Create tables
    conn = get_connection()
    try:
        create_tables(conn)
        conn.commit()
    finally:
        conn.close()
