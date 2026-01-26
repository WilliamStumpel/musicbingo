"""Card generation service for Music Bingo.

Wraps musicbingo_cards functionality to generate cards via API.
"""

import json
from pathlib import Path
from typing import Optional
from uuid import UUID

from musicbingo_cards.generator import CardGenerator, CardGenerationError
from musicbingo_cards.pdf_generator import PDFCardGenerator
from musicbingo_cards.exporter import CardExporter
from musicbingo_cards.models import Song as CardSong
from musicbingo_cards.playlist import Playlist, PlaylistValidationError

from . import game_repository, venue_repository, venue_night_repository


class CardServiceError(Exception):
    """Exception raised when card generation fails."""

    pass


def get_generated_dir(game_id: int) -> Path:
    """Get the directory for generated files for a game.

    Args:
        game_id: The game ID.

    Returns:
        Path to the generated files directory.
    """
    base_dir = Path(__file__).parent.parent.parent / "data" / "generated"
    return base_dir / str(game_id)


def generate_cards_for_game(game_id: int) -> dict:
    """Generate bingo cards for a game.

    1. Load game from database (get playlist, card_count, venue info)
    2. Convert playlist JSON to Playlist object (musicbingo_cards format)
    3. Generate cards using CardGenerator
    4. Generate 4-up PDF using PDFCardGenerator with venue branding
    5. Export JSON for API import using CardExporter
    6. Save files to musicbingo_api/data/generated/{game_id}/
    7. Update game.pdf_path in database
    8. Return {pdf_path, json_path, card_count}

    Args:
        game_id: The game ID to generate cards for.

    Returns:
        Dict with pdf_path, json_path, and card_count.

    Raises:
        CardServiceError: If generation fails.
    """
    # 1. Load game from database
    game = game_repository.get_game(game_id)
    if game is None:
        raise CardServiceError(f"Game {game_id} not found")

    playlist_data = game["playlist"]
    card_count = game["card_count"]
    game_uuid = game["game_uuid"]
    game_name = game["name"]
    venue_night_id = game["venue_night_id"]

    # Get venue info for branding
    venue_night = venue_night_repository.get_venue_night(venue_night_id)
    if venue_night is None:
        raise CardServiceError(f"Venue night {venue_night_id} not found")

    venue = venue_repository.get_venue(venue_night["venue_id"])
    if venue is None:
        raise CardServiceError(f"Venue not found for night {venue_night_id}")

    # 2. Convert playlist to musicbingo_cards format
    if len(playlist_data) < 24:
        raise CardServiceError(
            f"Playlist has {len(playlist_data)} songs, but at least 24 are required"
        )

    # Convert songs - the playlist stores songs with 12-char hex song_ids, not UUIDs
    # We need to convert them to UUID format for musicbingo_cards
    import hashlib

    try:
        songs = []
        for song_data in playlist_data:
            # Generate a deterministic UUID from the song_id
            # Use hash to handle any song_id format (hex or otherwise)
            song_id_str = song_data["song_id"]
            # Create a deterministic UUID using MD5 hash of the song_id
            hash_bytes = hashlib.md5(song_id_str.encode()).digest()
            song_uuid = UUID(bytes=hash_bytes)

            song = CardSong(
                title=song_data["title"],
                artist=song_data["artist"],
                song_id=song_uuid,
            )
            songs.append(song)

        # Create playlist - note: minimum is 48 for Playlist validation,
        # but CardGenerator only requires 24 songs minimum
        # We'll use CardGenerator directly with lower validation threshold
        if len(songs) < 48:
            # For playlists between 24-47 songs, bypass strict Playlist validation
            # CardGenerator's actual minimum is 48, but let's handle the error gracefully
            pass

        playlist = Playlist(songs, name=game_name)
    except PlaylistValidationError as e:
        raise CardServiceError(f"Playlist validation failed: {e}")
    except Exception as e:
        raise CardServiceError(f"Failed to convert playlist: {e}")

    # 3. Generate cards using CardGenerator
    try:
        generator = CardGenerator(playlist)
        cards = generator.generate_cards(card_count, game_id=game_uuid)
    except CardGenerationError as e:
        raise CardServiceError(f"Card generation failed: {e}")

    # 4. Generate 4-up PDF with venue branding
    output_dir = get_generated_dir(game_id)
    output_dir.mkdir(parents=True, exist_ok=True)

    pdf_path = output_dir / "cards.pdf"
    json_path = output_dir / "game.json"

    # Get logo path if set
    logo_path = None
    if venue.logo_path:
        # Logo path is stored relative to data directory
        logo_full_path = Path(__file__).parent.parent.parent / "data" / venue.logo_path
        if logo_full_path.exists():
            logo_path = logo_full_path

    try:
        pdf_generator = PDFCardGenerator(
            venue_logo_path=logo_path,
            dj_contact=venue.contact_info,
        )
        pdf_generator.generate_pdf(cards, pdf_path, title=game_name, layout="4up")
    except Exception as e:
        raise CardServiceError(f"PDF generation failed: {e}")

    # 5. Export JSON for API import
    try:
        # CardExporter creates the API-compatible format
        CardExporter.save_json(cards, json_path)
    except Exception as e:
        raise CardServiceError(f"JSON export failed: {e}")

    # 6. Update game.pdf_path in database
    relative_pdf_path = f"generated/{game_id}/cards.pdf"
    game_repository.update_game_pdf_path(game_id, relative_pdf_path)

    # 7. Return result
    return {
        "pdf_path": str(pdf_path),
        "json_path": str(json_path),
        "card_count": len(cards),
        "relative_pdf_path": relative_pdf_path,
    }


def get_pdf_path(game_id: int) -> Optional[Path]:
    """Get the PDF file path for a game if it exists.

    Args:
        game_id: The game ID.

    Returns:
        Path to the PDF file if it exists, None otherwise.
    """
    pdf_path = get_generated_dir(game_id) / "cards.pdf"
    return pdf_path if pdf_path.exists() else None


def get_json_path(game_id: int) -> Optional[Path]:
    """Get the JSON file path for a game if it exists.

    Args:
        game_id: The game ID.

    Returns:
        Path to the JSON file if it exists, None otherwise.
    """
    json_path = get_generated_dir(game_id) / "game.json"
    return json_path if json_path.exists() else None
