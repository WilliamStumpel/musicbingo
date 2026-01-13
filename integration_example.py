#!/usr/bin/env python3
"""
Integration example: Generate cards and load into API.

This script demonstrates the end-to-end workflow:
1. Generate bingo cards from a playlist
2. Export card data to JSON
3. Create a game in the API
4. Load cards into the game
5. Activate the game for play

Prerequisites:
- musicbingo_cards package installed
- musicbingo_api server running (uvicorn musicbingo_api.main:app)
- Test playlist file available
"""

import json
import sys
from pathlib import Path
from uuid import uuid4

import httpx

# Configuration
API_BASE_URL = "http://localhost:8000"
PLAYLIST_FILE = "musicbingo_cards/test_playlist.txt"
NUM_CARDS = 50
JSON_EXPORT_FILE = "cards_export.json"


def generate_cards_with_json_export(playlist_file: str, num_cards: int, json_file: str):
    """Generate cards and export to JSON using the CLI."""
    import subprocess

    print(f"\n📋 Generating {num_cards} cards from playlist...")

    # Run the musicbingo CLI with JSON export
    cmd = [
        sys.executable,
        "-m",
        "musicbingo_cards.cli",
        "generate",
        playlist_file,
        "-n",
        str(num_cards),
        "-o",
        "cards_output.pdf",
        "-j",
        json_file,
    ]

    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(result.stdout)
        print(f"✓ Cards generated and exported to {json_file}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Card generation failed: {e.stderr}")
        return False


def load_card_data(json_file: str) -> dict:
    """Load card data from JSON file."""
    print(f"\n📥 Loading card data from {json_file}...")

    with open(json_file, "r") as f:
        data = json.load(f)

    print(f"✓ Loaded {len(data['cards'])} cards")
    print(f"  Game ID: {data['game_id']}")

    return data


def create_game_in_api(game_id: str, playlist: list[dict]) -> bool:
    """Create a game in the API."""
    print(f"\n🎮 Creating game in API...")

    url = f"{API_BASE_URL}/api/game/start"
    payload = {"game_id": game_id, "playlist": playlist, "pattern": "five_in_a_row"}

    with httpx.Client() as client:
        response = client.post(url, json=payload, timeout=10.0)

        if response.status_code == 201:
            data = response.json()
            print(f"✓ Game created successfully")
            print(f"  Game ID: {data['game_id']}")
            print(f"  Status: {data['status']}")
            print(f"  Pattern: {data['pattern']}")
            return True
        else:
            print(f"✗ Failed to create game: {response.status_code}")
            print(f"  Error: {response.text}")
            return False


def load_cards_into_api(game_id: str, cards: list[dict]) -> bool:
    """Load cards into the API using bulk endpoint."""
    print(f"\n📤 Loading {len(cards)} cards into API...")

    url = f"{API_BASE_URL}/api/game/{game_id}/cards/bulk"
    payload = {"cards": cards}

    with httpx.Client() as client:
        response = client.post(url, json=payload, timeout=30.0)

        if response.status_code == 200:
            data = response.json()
            print(f"✓ Cards loaded successfully")
            print(f"  Cards added: {data['cards_added']}")
            return True
        else:
            print(f"✗ Failed to load cards: {response.status_code}")
            print(f"  Error: {response.text}")
            return False


def activate_game(game_id: str) -> bool:
    """Activate the game for play."""
    print(f"\n▶️  Activating game...")

    url = f"{API_BASE_URL}/api/game/{game_id}/activate"

    with httpx.Client() as client:
        response = client.post(url, timeout=10.0)

        if response.status_code == 200:
            data = response.json()
            print(f"✓ Game activated successfully")
            print(f"  Status: {data['status']}")
            print(f"  Cards: {data['card_count']}")
            return True
        else:
            print(f"✗ Failed to activate game: {response.status_code}")
            print(f"  Error: {response.text}")
            return False


def verify_api_connection() -> bool:
    """Check if API is running."""
    print(f"🔍 Checking API connection at {API_BASE_URL}...")

    try:
        with httpx.Client() as client:
            response = client.get(f"{API_BASE_URL}/health", timeout=5.0)
            if response.status_code == 200:
                print(f"✓ API is running")
                return True
            else:
                print(f"✗ API returned status {response.status_code}")
                return False
    except httpx.ConnectError:
        print(f"✗ Cannot connect to API at {API_BASE_URL}")
        print(f"  Make sure the API is running:")
        print(f"  uvicorn musicbingo_api.main:app --reload")
        return False
    except Exception as e:
        print(f"✗ Error connecting to API: {e}")
        return False


def create_test_playlist() -> list[dict]:
    """Create a test playlist for the game."""
    # Read the test playlist file and convert to API format
    from musicbingo_cards.playlist import PlaylistParser

    playlist_file = Path(PLAYLIST_FILE)
    if not playlist_file.exists():
        print(f"✗ Playlist file not found: {PLAYLIST_FILE}")
        sys.exit(1)

    playlist = PlaylistParser.parse_file(str(playlist_file))

    # Convert to API format
    api_playlist = []
    for song in playlist.songs:
        api_playlist.append(
            {
                "song_id": str(song.song_id),
                "title": song.title,
                "artist": song.artist,
                "album": song.album,
                "duration_seconds": song.duration_seconds,
            }
        )

    return api_playlist


def main():
    """Run the integration workflow."""
    print("=" * 60)
    print("Music Bingo Integration: Generate Cards → Load into API")
    print("=" * 60)

    # Step 1: Verify API is running
    if not verify_api_connection():
        sys.exit(1)

    # Step 2: Check playlist exists
    if not Path(PLAYLIST_FILE).exists():
        print(f"\n✗ Playlist file not found: {PLAYLIST_FILE}")
        print(f"  Create a test playlist or update PLAYLIST_FILE variable")
        sys.exit(1)

    # Step 3: Generate cards with JSON export
    if not generate_cards_with_json_export(PLAYLIST_FILE, NUM_CARDS, JSON_EXPORT_FILE):
        sys.exit(1)

    # Step 4: Load card data
    card_data = load_card_data(JSON_EXPORT_FILE)
    game_id = card_data["game_id"]
    cards = card_data["cards"]

    # Step 5: Create playlist for API
    playlist = create_test_playlist()

    # Step 6: Create game in API
    if not create_game_in_api(game_id, playlist):
        sys.exit(1)

    # Step 7: Load cards into API
    if not load_cards_into_api(game_id, cards):
        sys.exit(1)

    # Step 8: Activate game
    if not activate_game(game_id):
        sys.exit(1)

    # Success!
    print("\n" + "=" * 60)
    print("✨ Integration Complete!")
    print("=" * 60)
    print(f"\nGame ID: {game_id}")
    print(f"Cards: {len(cards)}")
    print(f"\nNext steps:")
    print(f"1. Scan QR codes from cards_output.pdf")
    print(f"2. Record played songs: POST /api/game/{game_id}/song-played")
    print(f"3. Verify cards: GET /api/verify/{game_id}/{{card_id}}")
    print(f"\nAPI Documentation: {API_BASE_URL}/docs")


if __name__ == "__main__":
    main()
