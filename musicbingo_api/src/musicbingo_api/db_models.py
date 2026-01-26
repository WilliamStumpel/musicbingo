"""Database models and schema for Music Bingo API.

Defines the SQLite schema and dataclasses for:
- Venue: Venue information with branding
- VenueNight: Scheduled event at a venue
- Game: Individual bingo game within a venue night
"""

import sqlite3
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


# Schema DDL - CREATE TABLE IF NOT EXISTS for idempotent initialization
SCHEMA_SQL = """
-- Venues table: Stores venue information and branding
CREATE TABLE IF NOT EXISTS venues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    logo_path TEXT,
    contact_info TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Venue nights table: Scheduled events at venues
CREATE TABLE IF NOT EXISTS venue_nights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(venue_id, date)
);

-- Games table: Individual bingo games within a venue night
CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venue_night_id INTEGER NOT NULL REFERENCES venue_nights(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    playlist_json TEXT NOT NULL,
    card_count INTEGER NOT NULL DEFAULT 50,
    pdf_path TEXT,
    game_uuid TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_venue_nights_venue_id ON venue_nights(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_nights_date ON venue_nights(date);
CREATE INDEX IF NOT EXISTS idx_games_venue_night_id ON games(venue_night_id);
CREATE INDEX IF NOT EXISTS idx_games_game_uuid ON games(game_uuid);
"""


def create_tables(conn: sqlite3.Connection) -> None:
    """Execute schema DDL to create all tables.

    Safe to call multiple times - uses CREATE TABLE IF NOT EXISTS.

    Args:
        conn: Active database connection.
    """
    conn.executescript(SCHEMA_SQL)


@dataclass
class Venue:
    """Represents a venue where bingo games are hosted."""

    id: Optional[int]
    name: str
    logo_path: Optional[str] = None
    contact_info: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @classmethod
    def from_row(cls, row: sqlite3.Row) -> "Venue":
        """Create a Venue instance from a database row.

        Args:
            row: sqlite3.Row from a SELECT query.

        Returns:
            Venue instance populated from row data.
        """
        return cls(
            id=row["id"],
            name=row["name"],
            logo_path=row["logo_path"],
            contact_info=row["contact_info"],
            created_at=datetime.fromisoformat(row["created_at"]) if row["created_at"] else None,
            updated_at=datetime.fromisoformat(row["updated_at"]) if row["updated_at"] else None,
        )


@dataclass
class VenueNight:
    """Represents a scheduled event night at a venue."""

    id: Optional[int]
    venue_id: int
    date: str  # ISO date format YYYY-MM-DD
    status: str = "draft"  # draft, ready, completed
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @classmethod
    def from_row(cls, row: sqlite3.Row) -> "VenueNight":
        """Create a VenueNight instance from a database row.

        Args:
            row: sqlite3.Row from a SELECT query.

        Returns:
            VenueNight instance populated from row data.
        """
        return cls(
            id=row["id"],
            venue_id=row["venue_id"],
            date=row["date"],
            status=row["status"],
            notes=row["notes"],
            created_at=datetime.fromisoformat(row["created_at"]) if row["created_at"] else None,
            updated_at=datetime.fromisoformat(row["updated_at"]) if row["updated_at"] else None,
        )


@dataclass
class Game:
    """Represents a single bingo game within a venue night."""

    id: Optional[int]
    venue_night_id: int
    name: str
    playlist_json: str  # JSON array of songs
    card_count: int = 50
    pdf_path: Optional[str] = None
    game_uuid: str = ""  # UUID for API compatibility
    sort_order: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @classmethod
    def from_row(cls, row: sqlite3.Row) -> "Game":
        """Create a Game instance from a database row.

        Args:
            row: sqlite3.Row from a SELECT query.

        Returns:
            Game instance populated from row data.
        """
        return cls(
            id=row["id"],
            venue_night_id=row["venue_night_id"],
            name=row["name"],
            playlist_json=row["playlist_json"],
            card_count=row["card_count"],
            pdf_path=row["pdf_path"],
            game_uuid=row["game_uuid"],
            sort_order=row["sort_order"],
            created_at=datetime.fromisoformat(row["created_at"]) if row["created_at"] else None,
            updated_at=datetime.fromisoformat(row["updated_at"]) if row["updated_at"] else None,
        )
