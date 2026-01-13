"""Tests for FastAPI endpoints."""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from musicbingo_api.game_service import GameService, _game_service
from musicbingo_api.main import app
from musicbingo_api.models import PatternType

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_game_service():
    """Reset game service before each test."""
    global _game_service
    _game_service = GameService()
    yield
    _game_service = None


def create_test_playlist(count: int = 24):
    """Create a test playlist."""
    return [
        {
            "song_id": str(uuid4()),
            "title": f"Song {i}",
            "artist": f"Artist {i}",
            "album": f"Album {i}",
            "duration_seconds": 180,
        }
        for i in range(count)
    ]


def test_root_endpoint():
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Music Bingo API"
    assert "version" in data


def test_health_endpoint():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_create_game():
    """Test creating a new game."""
    game_id = str(uuid4())
    playlist = create_test_playlist()

    response = client.post(
        "/api/game/start",
        json={
            "game_id": game_id,
            "playlist": playlist,
            "pattern": "row",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["game_id"] == game_id
    assert data["status"] == "setup"
    assert data["playlist_size"] == 24
    assert data["pattern"] == "row"


def test_create_game_insufficient_songs():
    """Test creating game with too few songs fails."""
    game_id = str(uuid4())
    playlist = create_test_playlist(20)  # Less than 24

    response = client.post(
        "/api/game/start",
        json={
            "game_id": game_id,
            "playlist": playlist,
            "pattern": "row",
        },
    )

    assert response.status_code == 422  # Pydantic validation error


def test_add_card_to_game():
    """Test adding a card to a game."""
    # Create game first
    game_id = str(uuid4())
    playlist = create_test_playlist()
    client.post(
        "/api/game/start",
        json={"game_id": game_id, "playlist": playlist, "pattern": "row"},
    )

    # Add card
    card_id = str(uuid4())
    song_positions = {
        playlist[i]["song_id"]: [0, i] for i in range(5)
    }

    response = client.post(
        f"/api/game/{game_id}/card",
        json={
            "card_id": card_id,
            "card_number": 1,
            "song_positions": song_positions,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["card_id"] == card_id
    assert data["card_number"] == 1


def test_activate_game():
    """Test activating a game."""
    # Create game and add card
    game_id = str(uuid4())
    playlist = create_test_playlist()
    client.post(
        "/api/game/start",
        json={"game_id": game_id, "playlist": playlist, "pattern": "row"},
    )

    card_id = str(uuid4())
    song_positions = {
        playlist[i]["song_id"]: [0, i] for i in range(5)
    }
    client.post(
        f"/api/game/{game_id}/card",
        json={
            "card_id": card_id,
            "card_number": 1,
            "song_positions": song_positions,
        },
    )

    # Activate game
    response = client.post(f"/api/game/{game_id}/activate")

    assert response.status_code == 200
    data = response.json()
    assert data["game_id"] == game_id
    assert data["status"] == "active"
    assert data["card_count"] == 1


def test_record_played_song():
    """Test recording a played song."""
    # Setup game
    game_id = str(uuid4())
    playlist = create_test_playlist()
    client.post(
        "/api/game/start",
        json={"game_id": game_id, "playlist": playlist, "pattern": "row"},
    )

    card_id = str(uuid4())
    song_positions = {playlist[i]["song_id"]: [0, i] for i in range(5)}
    client.post(
        f"/api/game/{game_id}/card",
        json={
            "card_id": card_id,
            "card_number": 1,
            "song_positions": song_positions,
        },
    )
    client.post(f"/api/game/{game_id}/activate")

    # Record played song
    song_id = playlist[0]["song_id"]
    response = client.post(
        f"/api/game/{game_id}/song-played",
        json={"song_id": song_id},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["game_id"] == game_id
    assert data["song_id"] == song_id
    assert data["total_played"] == 1


def test_get_game_state():
    """Test getting game state."""
    # Create game
    game_id = str(uuid4())
    playlist = create_test_playlist()
    client.post(
        "/api/game/start",
        json={"game_id": game_id, "playlist": playlist, "pattern": "row"},
    )

    # Get state
    response = client.get(f"/api/game/{game_id}/state")

    assert response.status_code == 200
    data = response.json()
    assert data["game_id"] == game_id
    assert data["status"] == "setup"
    assert data["playlist_size"] == 24
    assert data["played_count"] == 0
    assert data["card_count"] == 0


def test_verify_card_winner():
    """Test verifying a winning card."""
    # Setup game
    game_id = str(uuid4())
    playlist = create_test_playlist()
    client.post(
        "/api/game/start",
        json={"game_id": game_id, "playlist": playlist, "pattern": "row"},
    )

    # Add card with first 5 songs in top row
    card_id = str(uuid4())
    song_positions = {playlist[i]["song_id"]: [0, i] for i in range(5)}
    client.post(
        f"/api/game/{game_id}/card",
        json={
            "card_id": card_id,
            "card_number": 1,
            "song_positions": song_positions,
        },
    )
    client.post(f"/api/game/{game_id}/activate")

    # Play all 5 songs in the row
    for i in range(5):
        client.post(
            f"/api/game/{game_id}/song-played",
            json={"song_id": playlist[i]["song_id"]},
        )

    # Verify card
    response = client.get(f"/api/verify/{game_id}/{card_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["winner"] is True
    assert data["pattern"] == "row"
    assert data["card_number"] == 1


def test_verify_card_not_winner():
    """Test verifying a non-winning card."""
    # Setup game
    game_id = str(uuid4())
    playlist = create_test_playlist()
    client.post(
        "/api/game/start",
        json={"game_id": game_id, "playlist": playlist, "pattern": "row"},
    )

    # Add card
    card_id = str(uuid4())
    song_positions = {playlist[i]["song_id"]: [0, i] for i in range(5)}
    client.post(
        f"/api/game/{game_id}/card",
        json={
            "card_id": card_id,
            "card_number": 1,
            "song_positions": song_positions,
        },
    )
    client.post(f"/api/game/{game_id}/activate")

    # Play only 3 songs (not enough for win)
    for i in range(3):
        client.post(
            f"/api/game/{game_id}/song-played",
            json={"song_id": playlist[i]["song_id"]},
        )

    # Verify card
    response = client.get(f"/api/verify/{game_id}/{card_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["winner"] is False
    assert data["pattern"] is None
    assert data["card_number"] == 1


def test_verify_card_not_found():
    """Test verifying a card that doesn't exist."""
    game_id = str(uuid4())
    card_id = str(uuid4())

    response = client.get(f"/api/verify/{game_id}/{card_id}")
    assert response.status_code == 404


def test_set_pattern():
    """Test changing winning pattern."""
    # Create game
    game_id = str(uuid4())
    playlist = create_test_playlist()
    client.post(
        "/api/game/start",
        json={"game_id": game_id, "playlist": playlist, "pattern": "row"},
    )

    # Change pattern
    response = client.post(
        f"/api/game/{game_id}/pattern",
        params={"pattern": "diagonal"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["current_pattern"] == "diagonal"


def test_five_in_a_row_pattern_with_row():
    """Test 5 in a row pattern detecting a row win."""
    # Setup game with five_in_a_row pattern
    game_id = str(uuid4())
    playlist = create_test_playlist()
    client.post(
        "/api/game/start",
        json={"game_id": game_id, "playlist": playlist, "pattern": "five_in_a_row"},
    )

    # Add card with first 5 songs in top row
    card_id = str(uuid4())
    song_positions = {playlist[i]["song_id"]: [0, i] for i in range(5)}
    client.post(
        f"/api/game/{game_id}/card",
        json={
            "card_id": card_id,
            "card_number": 1,
            "song_positions": song_positions,
        },
    )
    client.post(f"/api/game/{game_id}/activate")

    # Play all 5 songs in the row
    for i in range(5):
        client.post(
            f"/api/game/{game_id}/song-played",
            json={"song_id": playlist[i]["song_id"]},
        )

    # Verify card wins
    response = client.get(f"/api/verify/{game_id}/{card_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["winner"] is True
    assert data["pattern"] == "five_in_a_row"
    assert data["card_number"] == 1


def test_five_in_a_row_pattern_with_column():
    """Test 5 in a row pattern detecting a column win."""
    # Setup game with five_in_a_row pattern
    game_id = str(uuid4())
    playlist = create_test_playlist()
    client.post(
        "/api/game/start",
        json={"game_id": game_id, "playlist": playlist, "pattern": "five_in_a_row"},
    )

    # Add card with first 5 songs in left column
    card_id = str(uuid4())
    song_positions = {playlist[i]["song_id"]: [i, 0] for i in range(5)}
    client.post(
        f"/api/game/{game_id}/card",
        json={
            "card_id": card_id,
            "card_number": 1,
            "song_positions": song_positions,
        },
    )
    client.post(f"/api/game/{game_id}/activate")

    # Play all 5 songs in the column
    for i in range(5):
        client.post(
            f"/api/game/{game_id}/song-played",
            json={"song_id": playlist[i]["song_id"]},
        )

    # Verify card wins
    response = client.get(f"/api/verify/{game_id}/{card_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["winner"] is True
    assert data["pattern"] == "five_in_a_row"


def test_five_in_a_row_pattern_with_diagonal():
    """Test 5 in a row pattern detecting a diagonal win."""
    # Setup game with five_in_a_row pattern
    game_id = str(uuid4())
    playlist = create_test_playlist()
    client.post(
        "/api/game/start",
        json={"game_id": game_id, "playlist": playlist, "pattern": "five_in_a_row"},
    )

    # Add card with first 5 songs on main diagonal
    card_id = str(uuid4())
    song_positions = {playlist[i]["song_id"]: [i, i] for i in range(5)}
    client.post(
        f"/api/game/{game_id}/card",
        json={
            "card_id": card_id,
            "card_number": 1,
            "song_positions": song_positions,
        },
    )
    client.post(f"/api/game/{game_id}/activate")

    # Play all 5 songs on the diagonal
    for i in range(5):
        client.post(
            f"/api/game/{game_id}/song-played",
            json={"song_id": playlist[i]["song_id"]},
        )

    # Verify card wins
    response = client.get(f"/api/verify/{game_id}/{card_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["winner"] is True
    assert data["pattern"] == "five_in_a_row"
