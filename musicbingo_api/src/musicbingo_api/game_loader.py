"""Game loader module for loading/saving games from JSON files."""

import json
from pathlib import Path
from typing import Optional
from uuid import UUID

from .models import CardData, GameState, GameStatus, PatternType, Song

# Games directory at project root (relative to this file's location)
GAMES_DIR = Path(__file__).parent.parent.parent.parent / "games"


def list_available_games() -> list[dict]:
    """List all game JSON files in games/ directory.

    Returns:
        List of dicts with {filename, game_id, name, song_count, card_count}
        Returns empty list if games directory doesn't exist.
    """
    if not GAMES_DIR.exists():
        return []

    games = []
    for game_file in GAMES_DIR.glob("*.json"):
        try:
            with open(game_file) as f:
                data = json.load(f)

            games.append({
                "filename": game_file.name,
                "game_id": data.get("game_id", ""),
                "name": data.get("name", game_file.stem),
                "song_count": len(data.get("playlist", [])),
                "card_count": len(data.get("cards", [])),
            })
        except (json.JSONDecodeError, IOError, AttributeError, TypeError):
            # Skip invalid JSON files (including non-dict structures)
            continue

    return sorted(games, key=lambda g: g["name"])


def load_game_from_file(filename: str) -> GameState:
    """Load a game from JSON file and return GameState ready to play.

    JSON format matches card generator export:
    {
        "game_id": "uuid",
        "name": "Game Name",
        "playlist": [...],
        "cards": [...]
    }

    Args:
        filename: Name of JSON file in games/ directory

    Returns:
        GameState ready to be registered and played

    Raises:
        FileNotFoundError: If file doesn't exist
        ValueError: If file has invalid format
    """
    game_path = GAMES_DIR / filename

    if not game_path.exists():
        raise FileNotFoundError(f"Game file not found: {filename}")

    with open(game_path) as f:
        data = json.load(f)

    # Validate required fields
    if "game_id" not in data:
        raise ValueError(f"Game file missing 'game_id': {filename}")
    if "playlist" not in data:
        raise ValueError(f"Game file missing 'playlist': {filename}")

    # Parse game_id
    game_id = UUID(data["game_id"])

    # Parse playlist
    playlist = []
    for song_data in data["playlist"]:
        song = Song(
            song_id=UUID(song_data["song_id"]),
            title=song_data["title"],
            artist=song_data["artist"],
            album=song_data.get("album"),
            duration_seconds=song_data.get("duration_seconds"),
        )
        playlist.append(song)

    # Create game state
    game = GameState(
        game_id=game_id,
        status=GameStatus.SETUP,
        playlist=playlist,
        current_pattern=PatternType(data.get("pattern", "five_in_a_row")),
    )

    # Parse and add cards
    for card_data in data.get("cards", []):
        # Parse song_positions - JSON stores as string keys
        song_positions = {}
        for song_id_str, position in card_data["song_positions"].items():
            song_positions[UUID(song_id_str)] = tuple(position)

        card = CardData(
            card_id=UUID(card_data["card_id"]),
            game_id=game_id,
            card_number=card_data["card_number"],
            song_positions=song_positions,
        )
        game.add_card(card)

    return game


def save_game_to_file(game: GameState, filename: str) -> None:
    """Save current game state to JSON file for later reload.

    Args:
        game: GameState to save
        filename: Name of JSON file (will be created in games/ directory)
    """
    # Ensure games directory exists
    GAMES_DIR.mkdir(parents=True, exist_ok=True)

    game_path = GAMES_DIR / filename

    # Build JSON structure
    data = {
        "game_id": str(game.game_id),
        "name": filename.replace(".json", "").replace("-", " ").title(),
        "pattern": game.current_pattern.value,
        "playlist": [
            {
                "song_id": str(song.song_id),
                "title": song.title,
                "artist": song.artist,
                "album": song.album,
                "duration_seconds": song.duration_seconds,
            }
            for song in game.playlist
        ],
        "cards": [
            {
                "card_id": str(card.card_id),
                "card_number": card.card_number,
                "song_positions": {
                    str(song_id): list(position)
                    for song_id, position in card.song_positions.items()
                },
            }
            for card in game.cards.values()
        ],
    }

    with open(game_path, "w") as f:
        json.dump(data, f, indent=2)
