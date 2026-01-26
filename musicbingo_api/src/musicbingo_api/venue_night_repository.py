"""Repository layer for VenueNight CRUD operations.

Provides database access functions for managing venue nights.
"""

from datetime import datetime
from typing import Optional

from .database import get_connection, transaction
from .db_models import VenueNight


def list_venue_nights(venue_id: Optional[int] = None) -> list[dict]:
    """Get all venue nights with venue info.

    Args:
        venue_id: Optional filter to get nights for a specific venue.

    Returns:
        List of venue night dicts with venue_name and game_count, ordered by date (newest first).
    """
    conn = get_connection()
    try:
        if venue_id is not None:
            query = """
                SELECT vn.*, v.name as venue_name,
                       (SELECT COUNT(*) FROM games g WHERE g.venue_night_id = vn.id) as game_count
                FROM venue_nights vn
                JOIN venues v ON vn.venue_id = v.id
                WHERE vn.venue_id = ?
                ORDER BY vn.date DESC
            """
            cursor = conn.execute(query, (venue_id,))
        else:
            query = """
                SELECT vn.*, v.name as venue_name,
                       (SELECT COUNT(*) FROM games g WHERE g.venue_night_id = vn.id) as game_count
                FROM venue_nights vn
                JOIN venues v ON vn.venue_id = v.id
                ORDER BY vn.date DESC
            """
            cursor = conn.execute(query)

        rows = cursor.fetchall()
        return [_row_to_dict(row) for row in rows]
    finally:
        conn.close()


def get_venue_night(venue_night_id: int) -> Optional[dict]:
    """Get a venue night by ID with venue info and game count.

    Args:
        venue_night_id: The venue night ID.

    Returns:
        Venue night dict with venue_name and game_count if found, None otherwise.
    """
    conn = get_connection()
    try:
        query = """
            SELECT vn.*, v.name as venue_name,
                   (SELECT COUNT(*) FROM games g WHERE g.venue_night_id = vn.id) as game_count
            FROM venue_nights vn
            JOIN venues v ON vn.venue_id = v.id
            WHERE vn.id = ?
        """
        cursor = conn.execute(query, (venue_night_id,))
        row = cursor.fetchone()
        if row is None:
            return None
        return _row_to_dict(row)
    finally:
        conn.close()


def create_venue_night(
    venue_id: int,
    date: str,
    notes: Optional[str] = None,
) -> dict:
    """Create a new venue night.

    Args:
        venue_id: ID of the venue for this night.
        date: Date in ISO format (YYYY-MM-DD).
        notes: Optional notes for this night.

    Returns:
        Created venue night dict with ID populated.

    Raises:
        ValueError: If venue night with same venue/date already exists.
    """
    now = datetime.utcnow().isoformat()

    with transaction() as conn:
        try:
            cursor = conn.execute(
                """
                INSERT INTO venue_nights (venue_id, date, status, notes, created_at, updated_at)
                VALUES (?, ?, 'draft', ?, ?, ?)
                """,
                (venue_id, date, notes, now, now),
            )
            venue_night_id = cursor.lastrowid
        except Exception as e:
            if "UNIQUE constraint failed" in str(e):
                raise ValueError(f"Venue night already exists for this venue on {date}")
            if "FOREIGN KEY constraint failed" in str(e):
                raise ValueError(f"Venue {venue_id} not found")
            raise

    return get_venue_night(venue_night_id)


def update_venue_night(
    venue_night_id: int,
    venue_id: int,
    date: str,
    status: str,
    notes: Optional[str] = None,
) -> Optional[dict]:
    """Update an existing venue night.

    Args:
        venue_night_id: The venue night ID.
        venue_id: New venue ID.
        date: New date.
        status: New status (draft, ready, completed).
        notes: New notes (or None to clear).

    Returns:
        Updated venue night dict if found, None if venue night doesn't exist.

    Raises:
        ValueError: If venue/date conflicts with another venue night.
    """
    now = datetime.utcnow().isoformat()

    # Validate status
    valid_statuses = ("draft", "ready", "completed")
    if status not in valid_statuses:
        raise ValueError(f"Invalid status '{status}'. Must be one of: {', '.join(valid_statuses)}")

    with transaction() as conn:
        # Check if venue night exists
        cursor = conn.execute("SELECT id FROM venue_nights WHERE id = ?", (venue_night_id,))
        if cursor.fetchone() is None:
            return None

        try:
            conn.execute(
                """
                UPDATE venue_nights
                SET venue_id = ?, date = ?, status = ?, notes = ?, updated_at = ?
                WHERE id = ?
                """,
                (venue_id, date, status, notes, now, venue_night_id),
            )
        except Exception as e:
            if "UNIQUE constraint failed" in str(e):
                raise ValueError(f"Venue night already exists for this venue on {date}")
            if "FOREIGN KEY constraint failed" in str(e):
                raise ValueError(f"Venue {venue_id} not found")
            raise

    return get_venue_night(venue_night_id)


def delete_venue_night(venue_night_id: int) -> bool:
    """Delete a venue night.

    Cascades to delete associated games due to foreign key constraints.

    Args:
        venue_night_id: The venue night ID.

    Returns:
        True if venue night was deleted, False if it didn't exist.
    """
    with transaction() as conn:
        cursor = conn.execute("DELETE FROM venue_nights WHERE id = ?", (venue_night_id,))
        return cursor.rowcount > 0


def _row_to_dict(row) -> dict:
    """Convert a database row to a venue night dict with extra fields.

    Args:
        row: sqlite3.Row from a SELECT query.

    Returns:
        Dict with venue night data plus venue_name and game_count.
    """
    return {
        "id": row["id"],
        "venue_id": row["venue_id"],
        "date": row["date"],
        "status": row["status"],
        "notes": row["notes"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "venue_name": row["venue_name"],
        "game_count": row["game_count"],
    }
