"""Repository layer for Venue CRUD operations.

Provides database access functions for managing venues.
"""

from datetime import datetime
from typing import Optional

from .database import get_connection, transaction
from .db_models import Venue


def list_venues() -> list[Venue]:
    """Get all venues.

    Returns:
        List of Venue objects ordered by name.
    """
    conn = get_connection()
    try:
        cursor = conn.execute("SELECT * FROM venues ORDER BY name")
        rows = cursor.fetchall()
        return [Venue.from_row(row) for row in rows]
    finally:
        conn.close()


def get_venue(venue_id: int) -> Optional[Venue]:
    """Get a venue by ID.

    Args:
        venue_id: The venue ID.

    Returns:
        Venue object if found, None otherwise.
    """
    conn = get_connection()
    try:
        cursor = conn.execute("SELECT * FROM venues WHERE id = ?", (venue_id,))
        row = cursor.fetchone()
        if row is None:
            return None
        return Venue.from_row(row)
    finally:
        conn.close()


def create_venue(
    name: str,
    logo_path: Optional[str] = None,
    contact_info: Optional[str] = None,
) -> Venue:
    """Create a new venue.

    Args:
        name: Venue name (required, unique).
        logo_path: Path to logo file (optional).
        contact_info: Contact information (optional).

    Returns:
        Created Venue object with ID populated.

    Raises:
        ValueError: If venue with same name already exists.
    """
    now = datetime.utcnow().isoformat()

    with transaction() as conn:
        try:
            cursor = conn.execute(
                """
                INSERT INTO venues (name, logo_path, contact_info, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (name, logo_path, contact_info, now, now),
            )
            venue_id = cursor.lastrowid
        except Exception as e:
            if "UNIQUE constraint failed" in str(e):
                raise ValueError(f"Venue with name '{name}' already exists")
            raise

    return Venue(
        id=venue_id,
        name=name,
        logo_path=logo_path,
        contact_info=contact_info,
        created_at=datetime.fromisoformat(now),
        updated_at=datetime.fromisoformat(now),
    )


def update_venue(
    venue_id: int,
    name: str,
    logo_path: Optional[str] = None,
    contact_info: Optional[str] = None,
) -> Optional[Venue]:
    """Update an existing venue.

    Args:
        venue_id: The venue ID.
        name: New venue name.
        logo_path: New logo path (or None to clear).
        contact_info: New contact info (or None to clear).

    Returns:
        Updated Venue object if found, None if venue doesn't exist.

    Raises:
        ValueError: If name conflicts with another venue.
    """
    now = datetime.utcnow().isoformat()

    with transaction() as conn:
        # Check if venue exists
        cursor = conn.execute("SELECT id FROM venues WHERE id = ?", (venue_id,))
        if cursor.fetchone() is None:
            return None

        try:
            conn.execute(
                """
                UPDATE venues
                SET name = ?, logo_path = ?, contact_info = ?, updated_at = ?
                WHERE id = ?
                """,
                (name, logo_path, contact_info, now, venue_id),
            )
        except Exception as e:
            if "UNIQUE constraint failed" in str(e):
                raise ValueError(f"Venue with name '{name}' already exists")
            raise

    return get_venue(venue_id)


def update_venue_logo(venue_id: int, logo_path: Optional[str]) -> Optional[Venue]:
    """Update only the logo path for a venue.

    Args:
        venue_id: The venue ID.
        logo_path: New logo path (or None to clear).

    Returns:
        Updated Venue object if found, None if venue doesn't exist.
    """
    now = datetime.utcnow().isoformat()

    with transaction() as conn:
        cursor = conn.execute("SELECT id FROM venues WHERE id = ?", (venue_id,))
        if cursor.fetchone() is None:
            return None

        conn.execute(
            """
            UPDATE venues
            SET logo_path = ?, updated_at = ?
            WHERE id = ?
            """,
            (logo_path, now, venue_id),
        )

    return get_venue(venue_id)


def delete_venue(venue_id: int) -> bool:
    """Delete a venue.

    Cascades to delete associated venue_nights and games due to foreign key constraints.

    Args:
        venue_id: The venue ID.

    Returns:
        True if venue was deleted, False if it didn't exist.
    """
    with transaction() as conn:
        cursor = conn.execute("DELETE FROM venues WHERE id = ?", (venue_id,))
        return cursor.rowcount > 0
