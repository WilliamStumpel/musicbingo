"""Playlist parsing and validation for Music Bingo."""

import csv
import json
from pathlib import Path
from typing import List, Optional, Union

from .models import Song


class PlaylistError(Exception):
    """Base exception for playlist parsing errors."""

    pass


class PlaylistValidationError(PlaylistError):
    """Exception raised when playlist fails validation."""

    pass


class Playlist:
    """Represents a parsed and validated playlist.

    Attributes:
        songs: List of songs in the playlist
        name: Optional playlist name
        metadata: Additional playlist metadata
    """

    def __init__(
        self,
        songs: List[Song],
        name: Optional[str] = None,
        metadata: Optional[dict] = None,
    ):
        """Initialize playlist with songs.

        Args:
            songs: List of Song objects
            name: Optional playlist name
            metadata: Optional metadata dictionary

        Raises:
            PlaylistValidationError: If playlist validation fails
        """
        self.songs = songs
        self.name = name
        self.metadata = metadata or {}
        self.validate()

    def validate(self) -> None:
        """Validate playlist meets requirements.

        Raises:
            PlaylistValidationError: If validation fails
        """
        if len(self.songs) < 48:
            raise PlaylistValidationError(
                f"Playlist too small: {len(self.songs)} songs (minimum 48 for quick game)"
            )
        if len(self.songs) > 1000:
            raise PlaylistValidationError(
                f"Playlist too large: {len(self.songs)} songs (maximum 1000)"
            )

        # Check for duplicate songs (by title + artist)
        seen = set()
        duplicates = []
        for song in self.songs:
            key = (song.title.lower().strip(), song.artist.lower().strip())
            if key in seen:
                duplicates.append(f"{song.title} - {song.artist}")
            seen.add(key)

        if duplicates:
            raise PlaylistValidationError(
                f"Playlist contains {len(duplicates)} duplicate songs: "
                f"{', '.join(duplicates[:3])}{'...' if len(duplicates) > 3 else ''}"
            )

    def __len__(self) -> int:
        """Return number of songs in playlist."""
        return len(self.songs)

    def __iter__(self):
        """Iterate over songs in playlist."""
        return iter(self.songs)


class PlaylistParser:
    """Parser for multiple playlist file formats."""

    @staticmethod
    def parse_file(file_path: Union[str, Path]) -> Playlist:
        """Parse a playlist file, auto-detecting format.

        Supported formats:
        - CSV: title,artist[,album][,duration]
        - JSON: [{"title": "...", "artist": "...", ...}, ...]
        - TXT: Title - Artist (one per line)

        Args:
            file_path: Path to playlist file

        Returns:
            Parsed and validated Playlist

        Raises:
            PlaylistError: If file cannot be parsed
            PlaylistValidationError: If playlist fails validation
        """
        path = Path(file_path)
        if not path.exists():
            raise PlaylistError(f"Playlist file not found: {file_path}")

        # Auto-detect format by extension
        suffix = path.suffix.lower()
        if suffix == ".csv":
            return PlaylistParser.parse_csv(path)
        elif suffix == ".json":
            return PlaylistParser.parse_json(path)
        elif suffix in [".txt", ""]:
            return PlaylistParser.parse_txt(path)
        else:
            raise PlaylistError(f"Unsupported playlist format: {suffix}")

    @staticmethod
    def parse_csv(file_path: Path) -> Playlist:
        """Parse CSV playlist file.

        Expected format:
        - Header row: title,artist[,album][,duration]
        - Data rows: song data

        Args:
            file_path: Path to CSV file

        Returns:
            Parsed Playlist

        Raises:
            PlaylistError: If CSV parsing fails
        """
        songs = []
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for i, row in enumerate(reader, start=2):  # Line 2 is first data row
                    try:
                        title = row.get("title", "").strip()
                        artist = row.get("artist", "").strip()

                        if not title or not artist:
                            raise PlaylistError(
                                f"Line {i}: Missing required fields (title, artist)"
                            )

                        # Optional fields
                        album = row.get("album", "").strip() or None
                        duration_str = row.get("duration", "").strip()
                        duration = int(duration_str) if duration_str else None

                        song = Song(
                            title=title,
                            artist=artist,
                            album=album,
                            duration_seconds=duration,
                        )
                        songs.append(song)
                    except (ValueError, KeyError) as e:
                        raise PlaylistError(f"Line {i}: {e}")

        except FileNotFoundError:
            raise PlaylistError(f"File not found: {file_path}")
        except Exception as e:
            if isinstance(e, PlaylistError):
                raise
            raise PlaylistError(f"Error reading CSV file: {e}")

        if not songs:
            raise PlaylistError("CSV file contains no valid songs")

        return Playlist(songs, name=file_path.stem)

    @staticmethod
    def parse_json(file_path: Path) -> Playlist:
        """Parse JSON playlist file.

        Expected format:
        {
          "name": "Playlist Name",
          "songs": [
            {"title": "...", "artist": "...", "album": "...", "duration": 123},
            ...
          ]
        }

        Or simple array:
        [
          {"title": "...", "artist": "..."},
          ...
        ]

        Args:
            file_path: Path to JSON file

        Returns:
            Parsed Playlist

        Raises:
            PlaylistError: If JSON parsing fails
        """
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            # Handle both formats: object with songs array or direct array
            if isinstance(data, list):
                songs_data = data
                name = file_path.stem
            elif isinstance(data, dict):
                songs_data = data.get("songs", [])
                name = data.get("name", file_path.stem)
            else:
                raise PlaylistError("JSON must be array or object with 'songs' array")

            songs = []
            for i, item in enumerate(songs_data, start=1):
                try:
                    title = item.get("title", "").strip()
                    artist = item.get("artist", "").strip()

                    if not title or not artist:
                        raise ValueError("Missing required fields (title, artist)")

                    song = Song(
                        title=title,
                        artist=artist,
                        album=item.get("album"),
                        duration_seconds=item.get("duration"),
                        metadata=item.get("metadata", {}),
                    )
                    songs.append(song)
                except (ValueError, KeyError) as e:
                    raise PlaylistError(f"Song {i}: {e}")

        except FileNotFoundError:
            raise PlaylistError(f"File not found: {file_path}")
        except json.JSONDecodeError as e:
            raise PlaylistError(f"Invalid JSON: {e}")
        except Exception as e:
            if isinstance(e, PlaylistError):
                raise
            raise PlaylistError(f"Error reading JSON file: {e}")

        if not songs:
            raise PlaylistError("JSON file contains no valid songs")

        return Playlist(songs, name=name)

    @staticmethod
    def parse_txt(file_path: Path) -> Playlist:
        """Parse plain text playlist file.

        Expected format (one per line):
        - "Title - Artist"
        - "Title by Artist"

        Args:
            file_path: Path to text file

        Returns:
            Parsed Playlist

        Raises:
            PlaylistError: If text parsing fails
        """
        songs = []
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                for i, line in enumerate(f, start=1):
                    line = line.strip()
                    if not line or line.startswith("#"):  # Skip empty and comments
                        continue

                    # Try to parse "Title - Artist" or "Title by Artist"
                    if " - " in line:
                        parts = line.split(" - ", 1)
                    elif " by " in line:
                        parts = line.split(" by ", 1)
                    else:
                        raise PlaylistError(
                            f"Line {i}: Invalid format. Expected 'Title - Artist' or 'Title by Artist'"
                        )

                    if len(parts) != 2:
                        raise PlaylistError(f"Line {i}: Could not parse title and artist")

                    title = parts[0].strip()
                    artist = parts[1].strip()

                    if not title or not artist:
                        raise PlaylistError(f"Line {i}: Title or artist is empty")

                    song = Song(title=title, artist=artist)
                    songs.append(song)

        except FileNotFoundError:
            raise PlaylistError(f"File not found: {file_path}")
        except Exception as e:
            if isinstance(e, PlaylistError):
                raise
            raise PlaylistError(f"Error reading text file: {e}")

        if not songs:
            raise PlaylistError("Text file contains no valid songs")

        return Playlist(songs, name=file_path.stem)


def validate_playlist_size(num_songs: int) -> str:
    """Get the game type based on playlist size.

    Args:
        num_songs: Number of songs in playlist

    Returns:
        Game type string: "quick", "standard", or "marathon"

    Raises:
        PlaylistValidationError: If playlist size is invalid
    """
    if num_songs < 48:
        raise PlaylistValidationError(
            f"Playlist too small ({num_songs} songs). Minimum: 48 songs for quick game"
        )
    if num_songs > 1000:
        raise PlaylistValidationError(
            f"Playlist too large ({num_songs} songs). Maximum: 1000 songs"
        )

    if num_songs < 60:
        return "quick"
    elif num_songs < 75:
        return "standard"
    else:
        return "marathon"
