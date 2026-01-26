"""Tests for card registration and winner detection API endpoints.

Tests cover player registration, card status tracking, proactive winner
detection, and prize management.
"""

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
    import musicbingo_api.game_service as gs
    gs._game_service = GameService()
    yield
    gs._game_service = None


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


def setup_active_game():
    """Create a game with cards and activate it.

    Returns:
        Tuple of (game_id, playlist, card_ids) where card_ids is a list of UUIDs.
    """
    game_id = str(uuid4())
    playlist = create_test_playlist()

    # Create game
    client.post(
        "/api/game/start",
        json={"game_id": game_id, "playlist": playlist, "pattern": "row"},
    )

    # Create cards - first card has row 0 songs
    card_ids = []
    for card_num in range(1, 4):  # 3 cards
        card_id = str(uuid4())
        card_ids.append(card_id)

        # Each card gets different songs in row 0
        start_idx = (card_num - 1) * 5 % len(playlist)
        song_positions = {
            playlist[(start_idx + i) % len(playlist)]["song_id"]: [0, i]
            for i in range(5)
        }

        client.post(
            f"/api/game/{game_id}/card",
            json={
                "card_id": card_id,
                "card_number": card_num,
                "song_positions": song_positions,
            },
        )

    # Activate game
    client.post(f"/api/game/{game_id}/activate")

    return game_id, playlist, card_ids


# =============================================================================
# Card Registration Tests
# =============================================================================


def test_register_card(reset_game_service):
    """Test registering a card to a player."""
    game_id, playlist, card_ids = setup_active_game()
    card_id = card_ids[0]

    response = client.post(
        f"/api/game/{game_id}/register-card",
        json={"card_id": card_id, "player_name": "Alice"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["card_id"] == card_id
    assert data["card_number"] == 1
    assert data["player_name"] == "Alice"
    assert "registered_at" in data


def test_register_multiple_cards(reset_game_service):
    """Test registering multiple cards to different players."""
    game_id, playlist, card_ids = setup_active_game()

    # Register all 3 cards
    players = ["Alice", "Bob", "Charlie"]
    for i, (card_id, player) in enumerate(zip(card_ids, players)):
        response = client.post(
            f"/api/game/{game_id}/register-card",
            json={"card_id": card_id, "player_name": player},
        )
        assert response.status_code == 200
        assert response.json()["player_name"] == player


def test_register_card_not_found(reset_game_service):
    """Test registering a non-existent card returns 404."""
    game_id, playlist, card_ids = setup_active_game()
    fake_card_id = str(uuid4())

    response = client.post(
        f"/api/game/{game_id}/register-card",
        json={"card_id": fake_card_id, "player_name": "Alice"},
    )

    assert response.status_code == 404


def test_register_card_game_not_found(reset_game_service):
    """Test registering a card to non-existent game returns 404."""
    fake_game_id = str(uuid4())
    fake_card_id = str(uuid4())

    response = client.post(
        f"/api/game/{fake_game_id}/register-card",
        json={"card_id": fake_card_id, "player_name": "Alice"},
    )

    assert response.status_code == 404


# =============================================================================
# Get Registered Cards Tests
# =============================================================================


def test_get_registered_cards(reset_game_service):
    """Test getting all registered cards for a game."""
    game_id, playlist, card_ids = setup_active_game()

    # Register 2 cards
    client.post(
        f"/api/game/{game_id}/register-card",
        json={"card_id": card_ids[0], "player_name": "Alice"},
    )
    client.post(
        f"/api/game/{game_id}/register-card",
        json={"card_id": card_ids[1], "player_name": "Bob"},
    )

    response = client.get(f"/api/game/{game_id}/registered-cards")

    assert response.status_code == 200
    data = response.json()
    assert data["game_id"] == game_id
    assert data["total_registered"] == 2
    assert len(data["cards"]) == 2

    # Check card info
    player_names = [c["player_name"] for c in data["cards"]]
    assert "Alice" in player_names
    assert "Bob" in player_names


def test_get_registered_cards_empty(reset_game_service):
    """Test getting registered cards when none registered."""
    game_id, playlist, card_ids = setup_active_game()

    response = client.get(f"/api/game/{game_id}/registered-cards")

    assert response.status_code == 200
    data = response.json()
    assert data["total_registered"] == 0
    assert data["cards"] == []


# =============================================================================
# Card Status Tests
# =============================================================================


def test_get_card_statuses(reset_game_service):
    """Test getting status of all registered cards."""
    game_id, playlist, card_ids = setup_active_game()

    # Register a card
    client.post(
        f"/api/game/{game_id}/register-card",
        json={"card_id": card_ids[0], "player_name": "Alice"},
    )

    # Play 3 songs from card's row
    for i in range(3):
        client.post(
            f"/api/game/{game_id}/mark-song",
            json={"song_id": playlist[i]["song_id"], "played": True},
        )

    response = client.get(f"/api/game/{game_id}/card-statuses")

    assert response.status_code == 200
    data = response.json()
    assert data["game_id"] == game_id
    assert data["current_pattern"] == "row"
    assert len(data["cards"]) == 1

    card_status = data["cards"][0]
    assert card_status["player_name"] == "Alice"
    assert card_status["matches"] == 3
    assert card_status["total_needed"] == 5
    assert card_status["is_winner"] is False
    assert card_status["progress"] == "3/5"


def test_get_card_statuses_with_winner(reset_game_service):
    """Test card statuses shows winner when pattern complete."""
    game_id, playlist, card_ids = setup_active_game()

    # Register a card
    client.post(
        f"/api/game/{game_id}/register-card",
        json={"card_id": card_ids[0], "player_name": "Alice"},
    )

    # Play all 5 songs from card's row (card 1 uses songs 0-4)
    for i in range(5):
        client.post(
            f"/api/game/{game_id}/mark-song",
            json={"song_id": playlist[i]["song_id"], "played": True},
        )

    response = client.get(f"/api/game/{game_id}/card-statuses")

    assert response.status_code == 200
    data = response.json()

    # Should have a winner
    assert len(data["winners"]) == 1
    winner = data["winners"][0]
    assert winner["player_name"] == "Alice"
    assert winner["is_winner"] is True
    assert winner["progress"] == "WINNER"


# =============================================================================
# Proactive Winner Detection Tests
# =============================================================================


def test_proactive_winner_detection(reset_game_service):
    """Test that marking a song proactively detects winners."""
    game_id, playlist, card_ids = setup_active_game()

    # Register a card
    client.post(
        f"/api/game/{game_id}/register-card",
        json={"card_id": card_ids[0], "player_name": "Alice"},
    )

    # Play 4 songs (not a winner yet)
    for i in range(4):
        client.post(
            f"/api/game/{game_id}/mark-song",
            json={"song_id": playlist[i]["song_id"], "played": True},
        )

    # Check game state - no winners yet
    state = client.get(f"/api/game/{game_id}/state").json()
    assert state["detected_winners"] == []

    # Play the 5th song to complete the row
    client.post(
        f"/api/game/{game_id}/mark-song",
        json={"song_id": playlist[4]["song_id"], "played": True},
    )

    # Check game state - should have winner now
    state = client.get(f"/api/game/{game_id}/state").json()
    assert len(state["detected_winners"]) == 1

    winner = state["detected_winners"][0]
    assert winner["player_name"] == "Alice"
    assert winner["pattern"] == "row"
    assert "detected_at" in winner


def test_detected_winners_in_game_state(reset_game_service):
    """Test detected_winners list in game state response."""
    game_id, playlist, card_ids = setup_active_game()

    # Register and create a winner
    client.post(
        f"/api/game/{game_id}/register-card",
        json={"card_id": card_ids[0], "player_name": "Alice"},
    )

    for i in range(5):
        client.post(
            f"/api/game/{game_id}/mark-song",
            json={"song_id": playlist[i]["song_id"], "played": True},
        )

    response = client.get(f"/api/game/{game_id}/state")

    assert response.status_code == 200
    data = response.json()
    assert len(data["detected_winners"]) == 1

    winner = data["detected_winners"][0]
    assert winner["card_id"] == card_ids[0]
    assert winner["player_name"] == "Alice"
    assert winner["pattern"] == "row"


# =============================================================================
# Prize Management Tests
# =============================================================================


def test_set_prize(reset_game_service):
    """Test setting the prize for a game."""
    game_id, playlist, card_ids = setup_active_game()

    response = client.post(
        f"/api/game/{game_id}/prize",
        json={"prize": "$50 Bar Tab"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["game_id"] == game_id
    assert data["prize"] == "$50 Bar Tab"


def test_prize_persists_in_game_state(reset_game_service):
    """Test prize is included in game state response."""
    game_id, playlist, card_ids = setup_active_game()

    # Set prize
    client.post(
        f"/api/game/{game_id}/prize",
        json={"prize": "Free Drinks"},
    )

    # Check game state
    response = client.get(f"/api/game/{game_id}/state")

    assert response.status_code == 200
    data = response.json()
    assert data["current_prize"] == "Free Drinks"


def test_prize_persists_after_round_reset(reset_game_service):
    """Test prize survives round reset."""
    game_id, playlist, card_ids = setup_active_game()

    # Set prize
    client.post(
        f"/api/game/{game_id}/prize",
        json={"prize": "$100 Gift Card"},
    )

    # Play some songs
    for i in range(3):
        client.post(
            f"/api/game/{game_id}/mark-song",
            json={"song_id": playlist[i]["song_id"], "played": True},
        )

    # Reset round
    response = client.post(f"/api/game/{game_id}/reset")

    assert response.status_code == 200

    # Verify prize still there
    state = client.get(f"/api/game/{game_id}/state").json()
    assert state["current_prize"] == "$100 Gift Card"


def test_round_reset_clears_detected_winners(reset_game_service):
    """Test round reset clears detected_winners but keeps prize."""
    game_id, playlist, card_ids = setup_active_game()

    # Register card and set prize
    client.post(
        f"/api/game/{game_id}/register-card",
        json={"card_id": card_ids[0], "player_name": "Alice"},
    )
    client.post(
        f"/api/game/{game_id}/prize",
        json={"prize": "Prize for Round 1"},
    )

    # Create a winner
    for i in range(5):
        client.post(
            f"/api/game/{game_id}/mark-song",
            json={"song_id": playlist[i]["song_id"], "played": True},
        )

    # Verify winner detected
    state = client.get(f"/api/game/{game_id}/state").json()
    assert len(state["detected_winners"]) == 1

    # Reset round
    client.post(f"/api/game/{game_id}/reset")

    # Verify winners cleared, prize kept
    state = client.get(f"/api/game/{game_id}/state").json()
    assert state["detected_winners"] == []
    assert state["current_prize"] == "Prize for Round 1"
    assert state["played_count"] == 0


# =============================================================================
# Verify Card with Player Name Tests
# =============================================================================


def test_verify_card_includes_player_name(reset_game_service):
    """Test verify card response includes player_name for registered cards."""
    game_id, playlist, card_ids = setup_active_game()
    card_id = card_ids[0]

    # Register the card
    client.post(
        f"/api/game/{game_id}/register-card",
        json={"card_id": card_id, "player_name": "Alice"},
    )

    # Complete the row
    for i in range(5):
        client.post(
            f"/api/game/{game_id}/mark-song",
            json={"song_id": playlist[i]["song_id"], "played": True},
        )

    # Verify card
    response = client.get(f"/api/verify/{game_id}/{card_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["winner"] is True
    assert data["player_name"] == "Alice"


def test_verify_unregistered_card_no_player_name(reset_game_service):
    """Test verify card response has null player_name for unregistered cards."""
    game_id, playlist, card_ids = setup_active_game()
    card_id = card_ids[0]

    # Do NOT register the card

    # Complete the row
    for i in range(5):
        client.post(
            f"/api/game/{game_id}/mark-song",
            json={"song_id": playlist[i]["song_id"], "played": True},
        )

    # Verify card
    response = client.get(f"/api/verify/{game_id}/{card_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["winner"] is True
    assert data["player_name"] is None
