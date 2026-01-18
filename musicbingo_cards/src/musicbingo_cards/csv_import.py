"""
CSV Import for Exportify-format Spotify playlist exports.

Exportify (https://exportify.net) exports playlists with columns:
- Track Name (required)
- Artist Name(s) (required)
- Album Name (optional)
- Track Duration (ms) (optional)
- ISRC (optional, useful for cross-service lookup)
- Album Image URL (optional)
"""

import csv
import hashlib
from pathlib import Path
from typing import Optional


def generate_song_id(title: str, artist: str) -> str:
    """Generate a unique song ID from title and artist."""
    # Normalize and combine
    combined = f"{title.lower().strip()}|{artist.lower().strip()}"
    # Create short hash
    return hashlib.sha256(combined.encode()).hexdigest()[:12]


def parse_exportify_csv(csv_path: Path) -> list[dict]:
    """
    Parse an Exportify CSV file and return list of song dicts.

    Args:
        csv_path: Path to the CSV file

    Returns:
        List of song dicts with keys: song_id, title, artist, album, duration_ms, isrc

    Raises:
        ValueError: If required columns are missing
        FileNotFoundError: If CSV file doesn't exist
    """
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    songs = []

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        # Validate required columns
        if reader.fieldnames is None:
            raise ValueError("CSV file is empty or has no headers")

        headers = [h.strip() for h in reader.fieldnames]

        # Check for required columns (case-insensitive)
        header_map = {h.lower(): h for h in headers}

        if 'track name' not in header_map:
            raise ValueError("CSV missing required column: 'Track Name'")
        if 'artist name(s)' not in header_map:
            raise ValueError("CSV missing required column: 'Artist Name(s)'")

        track_name_col = header_map['track name']
        artist_col = header_map['artist name(s)']
        album_col = header_map.get('album name')
        duration_col = header_map.get('track duration (ms)')
        isrc_col = header_map.get('isrc')

        for row in reader:
            title = row.get(track_name_col, '').strip()
            artist = row.get(artist_col, '').strip()

            if not title or not artist:
                continue  # Skip rows without title or artist

            song = {
                'song_id': generate_song_id(title, artist),
                'title': title,
                'artist': artist,
            }

            # Optional fields
            if album_col and row.get(album_col):
                song['album'] = row[album_col].strip()

            if duration_col and row.get(duration_col):
                try:
                    song['duration_ms'] = int(row[duration_col])
                except ValueError:
                    pass

            if isrc_col and row.get(isrc_col):
                song['isrc'] = row[isrc_col].strip()

            songs.append(song)

    return songs


def create_game_from_csv(
    csv_path: Path,
    game_name: str,
    output_path: Optional[Path] = None
) -> dict:
    """
    Create a game JSON structure from an Exportify CSV.

    Args:
        csv_path: Path to the Exportify CSV file
        game_name: Name for the game
        output_path: Optional path to write JSON file

    Returns:
        Game dict ready for JSON serialization
    """
    import json

    songs = parse_exportify_csv(csv_path)

    if len(songs) < 24:
        raise ValueError(
            f"Playlist has {len(songs)} songs, but at least 24 are required "
            f"for bingo cards (5x5 grid minus free space)"
        )

    game = {
        'game_name': game_name,
        'song_count': len(songs),
        'songs': songs
    }

    if output_path:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(game, f, indent=2)

    return game
