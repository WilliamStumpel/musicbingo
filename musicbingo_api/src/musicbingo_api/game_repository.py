"""Repository layer for Game CRUD operations.

Provides database access functions for managing bingo games within venue nights.
"""

import hashlib
import json
import uuid
from datetime import datetime
from typing import Optional

from .database import get_connection, transaction
from .db_models import Game


def generate_song_id(title: str, artist: str) -> str:
    """Generate a unique song ID from title and artist.

    Matches the pattern used in musicbingo_cards/csv_import.py.

    Args:
        title: Song title.
        artist: Artist name(s).

    Returns:
        12-character hex string from SHA256 hash.
    """
    combined = f"{title.lower().strip()}|{artist.lower().strip()}"
    return hashlib.sha256(combined.encode()).hexdigest()[:12]


def list_games(venue_night_id: Optional[int] = None) -> list[dict]:
    """Get all games with venue night info.

    Args:
        venue_night_id: Optional filter to get games for a specific venue night.

    Returns:
        List of game dicts with venue_night_name and song_count, ordered by sort_order.
    """
    conn = get_connection()
    try:
        if venue_night_id is not None:
            query = """
                SELECT g.*,
                       vn.date as night_date,
                       v.name as venue_name
                FROM games g
                JOIN venue_nights vn ON g.venue_night_id = vn.id
                JOIN venues v ON vn.venue_id = v.id
                WHERE g.venue_night_id = ?
                ORDER BY g.sort_order, g.id
            """
            cursor = conn.execute(query, (venue_night_id,))
        else:
            query = """
                SELECT g.*,
                       vn.date as night_date,
                       v.name as venue_name
                FROM games g
                JOIN venue_nights vn ON g.venue_night_id = vn.id
                JOIN venues v ON vn.venue_id = v.id
                ORDER BY vn.date DESC, g.sort_order, g.id
            """
            cursor = conn.execute(query)

        rows = cursor.fetchall()
        return [_row_to_dict(row) for row in rows]
    finally:
        conn.close()


def get_game(game_id: int) -> Optional[dict]:
    """Get a game by ID with parsed playlist.

    Args:
        game_id: The game ID.

    Returns:
        Game dict with parsed playlist if found, None otherwise.
    """
    conn = get_connection()
    try:
        query = """
            SELECT g.*,
                   vn.date as night_date,
                   v.name as venue_name
            FROM games g
            JOIN venue_nights vn ON g.venue_night_id = vn.id
            JOIN venues v ON vn.venue_id = v.id
            WHERE g.id = ?
        """
        cursor = conn.execute(query, (game_id,))
        row = cursor.fetchone()
        if row is None:
            return None
        return _row_to_dict(row)
    finally:
        conn.close()


def create_game(
    venue_night_id: int,
    name: str,
    playlist_json: str,
    card_count: int = 50,
) -> dict:
    """Create a new game.

    Args:
        venue_night_id: ID of the venue night for this game.
        name: Game name (e.g., "90s Hits").
        playlist_json: JSON string containing the playlist.
        card_count: Number of cards to generate (default 50).

    Returns:
        Created game dict with ID populated.

    Raises:
        ValueError: If venue night doesn't exist.
    """
    now = datetime.utcnow().isoformat()
    game_uuid = str(uuid.uuid4())

    # Get next sort_order for this venue night
    conn = get_connection()
    try:
        cursor = conn.execute(
            "SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM games WHERE venue_night_id = ?",
            (venue_night_id,)
        )
        next_order = cursor.fetchone()["next_order"]
    finally:
        conn.close()

    with transaction() as conn:
        try:
            cursor = conn.execute(
                """
                INSERT INTO games (venue_night_id, name, playlist_json, card_count, game_uuid, sort_order, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (venue_night_id, name, playlist_json, card_count, game_uuid, next_order, now, now),
            )
            game_id = cursor.lastrowid
        except Exception as e:
            if "FOREIGN KEY constraint failed" in str(e):
                raise ValueError(f"Venue night {venue_night_id} not found")
            raise

    return get_game(game_id)


def update_game(
    game_id: int,
    name: str,
    playlist_json: str,
    card_count: int,
    sort_order: int,
) -> Optional[dict]:
    """Update an existing game.

    Args:
        game_id: The game ID.
        name: New game name.
        playlist_json: New playlist JSON.
        card_count: New card count.
        sort_order: New sort order.

    Returns:
        Updated game dict if found, None if game doesn't exist.
    """
    now = datetime.utcnow().isoformat()

    with transaction() as conn:
        # Check if game exists
        cursor = conn.execute("SELECT id FROM games WHERE id = ?", (game_id,))
        if cursor.fetchone() is None:
            return None

        conn.execute(
            """
            UPDATE games
            SET name = ?, playlist_json = ?, card_count = ?, sort_order = ?, updated_at = ?
            WHERE id = ?
            """,
            (name, playlist_json, card_count, sort_order, now, game_id),
        )

    return get_game(game_id)


def delete_game(game_id: int) -> bool:
    """Delete a game.

    Args:
        game_id: The game ID.

    Returns:
        True if game was deleted, False if it didn't exist.
    """
    with transaction() as conn:
        cursor = conn.execute("DELETE FROM games WHERE id = ?", (game_id,))
        return cursor.rowcount > 0


def update_game_pdf_path(game_id: int, pdf_path: str) -> None:
    """Update the PDF path for a game after card generation.

    Args:
        game_id: The game ID.
        pdf_path: Path to the generated PDF file.
    """
    now = datetime.utcnow().isoformat()

    with transaction() as conn:
        conn.execute(
            """
            UPDATE games
            SET pdf_path = ?, updated_at = ?
            WHERE id = ?
            """,
            (pdf_path, now, game_id),
        )


def parse_csv_to_playlist(csv_content: str) -> list[dict]:
    """Parse CSV content (Exportify format) into a playlist.

    Args:
        csv_content: CSV file content as string.

    Returns:
        List of song dicts with song_id, title, artist.

    Raises:
        ValueError: If required columns are missing.
    """
    import csv
    import io

    reader = csv.DictReader(io.StringIO(csv_content))

    if reader.fieldnames is None:
        raise ValueError("CSV file is empty or has no headers")

    headers = [h.strip() for h in reader.fieldnames]
    header_map = {h.lower(): h for h in headers}

    if 'track name' not in header_map:
        raise ValueError("CSV missing required column: 'Track Name'")
    if 'artist name(s)' not in header_map:
        raise ValueError("CSV missing required column: 'Artist Name(s)'")

    track_name_col = header_map['track name']
    artist_col = header_map['artist name(s)']

    songs = []
    for row in reader:
        title = row.get(track_name_col, '').strip()
        artist = row.get(artist_col, '').strip()

        if not title or not artist:
            continue

        songs.append({
            'song_id': generate_song_id(title, artist),
            'title': title,
            'artist': artist,
        })

    return songs


def _row_to_dict(row) -> dict:
    """Convert a database row to a game dict with extra fields.

    Args:
        row: sqlite3.Row from a SELECT query.

    Returns:
        Dict with game data plus parsed playlist and related info.
    """
    playlist = json.loads(row["playlist_json"])

    return {
        "id": row["id"],
        "venue_night_id": row["venue_night_id"],
        "name": row["name"],
        "playlist": playlist,
        "song_count": len(playlist),
        "card_count": row["card_count"],
        "pdf_path": row["pdf_path"],
        "game_uuid": row["game_uuid"],
        "sort_order": row["sort_order"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "night_date": row["night_date"],
        "venue_name": row["venue_name"],
    }
