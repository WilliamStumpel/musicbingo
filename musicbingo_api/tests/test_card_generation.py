"""Tests for card generation API endpoints.

Tests cover card generation, PDF/JSON download endpoints,
and error handling for the generation service.
"""

import json
import shutil
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from musicbingo_api.database import DATABASE_PATH, DATA_DIR, init_db
from musicbingo_api.main import app


# Generated files directory
GENERATED_DIR = DATA_DIR / "generated"


@pytest.fixture(autouse=True)
def reset_database():
    """Reset database and generated files before each test."""
    # Clean up generated files
    if GENERATED_DIR.exists():
        shutil.rmtree(GENERATED_DIR)

    # Reset database
    if DATABASE_PATH.exists():
        DATABASE_PATH.unlink()
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    init_db()

    yield

    # Clean up after test
    if GENERATED_DIR.exists():
        shutil.rmtree(GENERATED_DIR)
    if DATABASE_PATH.exists():
        DATABASE_PATH.unlink()


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


def create_test_playlist(count: int = 48):
    """Create a test playlist with enough songs for card generation.

    Card generation requires at least 48 songs.
    """
    return [
        {
            "song_id": f"song{i:03d}",
            "title": f"Test Song {i}",
            "artist": f"Test Artist {i}",
        }
        for i in range(count)
    ]


def setup_game_for_generation(client):
    """Create a venue, venue night, and game ready for card generation.

    Returns:
        Tuple of (game_id, venue_id, night_id)
    """
    # Create venue
    venue_response = client.post(
        "/api/prep/venues",
        json={"name": "Test Venue", "contact_info": "DJ Test: 555-1234"},
    )
    venue_id = venue_response.json()["id"]

    # Create venue night
    night_response = client.post(
        "/api/prep/nights",
        json={"venue_id": venue_id, "date": "2026-02-15"},
    )
    night_id = night_response.json()["id"]

    # Create game with 48 songs (minimum for generation)
    playlist = create_test_playlist(48)
    game_response = client.post(
        "/api/prep/games",
        json={
            "venue_night_id": night_id,
            "name": "Test Game",
            "playlist": playlist,
            "card_count": 10,
        },
    )
    game_id = game_response.json()["id"]

    return game_id, venue_id, night_id


# =============================================================================
# Card Generation Tests
# =============================================================================


def test_generate_cards_success(client):
    """Test successful card generation creates PDF and JSON."""
    game_id, venue_id, night_id = setup_game_for_generation(client)

    response = client.post(f"/api/prep/games/{game_id}/generate")

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["card_count"] == 10
    assert "pdf_path" in data
    assert "json_path" in data
    assert data["message"] == "Successfully generated 10 cards"


def test_generate_cards_insufficient_songs(client):
    """Test card generation fails with less than 48 songs."""
    # Create venue and night
    venue_response = client.post(
        "/api/prep/venues",
        json={"name": "V1"},
    )
    venue_id = venue_response.json()["id"]

    night_response = client.post(
        "/api/prep/nights",
        json={"venue_id": venue_id, "date": "2026-02-15"},
    )
    night_id = night_response.json()["id"]

    # Create game with only 24 songs (less than 48 minimum)
    playlist = create_test_playlist(24)
    game_response = client.post(
        "/api/prep/games",
        json={
            "venue_night_id": night_id,
            "name": "Small Game",
            "playlist": playlist,
            "card_count": 10,
        },
    )
    game_id = game_response.json()["id"]

    # Try to generate cards
    response = client.post(f"/api/prep/games/{game_id}/generate")

    # Should fail because playlist is too small
    assert response.status_code == 400
    assert "48" in response.json()["detail"]  # Should mention the 48 song requirement


def test_generate_cards_game_not_found(client):
    """Test card generation for non-existent game returns 400."""
    response = client.post("/api/prep/games/9999/generate")
    assert response.status_code == 400
    assert "not found" in response.json()["detail"].lower()


def test_generate_cards_updates_pdf_path(client):
    """Test card generation updates game's pdf_path in database."""
    game_id, venue_id, night_id = setup_game_for_generation(client)

    # Before generation, pdf_path should be None
    game_before = client.get(f"/api/prep/games/{game_id}").json()
    assert game_before["pdf_path"] is None

    # Generate cards
    client.post(f"/api/prep/games/{game_id}/generate")

    # After generation, pdf_path should be set
    game_after = client.get(f"/api/prep/games/{game_id}").json()
    assert game_after["pdf_path"] is not None
    assert "generated" in game_after["pdf_path"]


# =============================================================================
# PDF Download Tests
# =============================================================================


def test_download_pdf_success(client):
    """Test downloading generated PDF file."""
    game_id, venue_id, night_id = setup_game_for_generation(client)

    # First generate cards
    client.post(f"/api/prep/games/{game_id}/generate")

    # Download PDF
    response = client.get(f"/api/prep/games/{game_id}/download/pdf")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    # Check Content-Disposition header for filename
    assert "attachment" in response.headers.get("content-disposition", "")


def test_download_pdf_not_generated(client):
    """Test downloading PDF before generation returns 404."""
    game_id, venue_id, night_id = setup_game_for_generation(client)

    # Don't generate cards, try to download directly
    response = client.get(f"/api/prep/games/{game_id}/download/pdf")

    assert response.status_code == 404
    assert "not generated" in response.json()["detail"].lower()


def test_download_pdf_game_not_found(client):
    """Test downloading PDF for non-existent game returns 404."""
    response = client.get("/api/prep/games/9999/download/pdf")
    assert response.status_code == 404


# =============================================================================
# JSON Download Tests
# =============================================================================


def test_download_json_success(client):
    """Test downloading generated JSON file."""
    game_id, venue_id, night_id = setup_game_for_generation(client)

    # First generate cards
    client.post(f"/api/prep/games/{game_id}/generate")

    # Download JSON
    response = client.get(f"/api/prep/games/{game_id}/download/json")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
    assert "attachment" in response.headers.get("content-disposition", "")

    # Verify JSON content structure
    content = response.json()
    assert "game_id" in content
    assert "cards" in content


def test_download_json_not_generated(client):
    """Test downloading JSON before generation returns 404."""
    game_id, venue_id, night_id = setup_game_for_generation(client)

    # Don't generate cards, try to download directly
    response = client.get(f"/api/prep/games/{game_id}/download/json")

    assert response.status_code == 404
    assert "not generated" in response.json()["detail"].lower()


def test_download_json_game_not_found(client):
    """Test downloading JSON for non-existent game returns 404."""
    response = client.get("/api/prep/games/9999/download/json")
    assert response.status_code == 404


# =============================================================================
# Game CRUD Tests (for completeness)
# =============================================================================


def test_create_game(client):
    """Test creating a game with playlist."""
    # Setup venue and night
    venue_response = client.post("/api/prep/venues", json={"name": "V1"})
    venue_id = venue_response.json()["id"]
    night_response = client.post(
        "/api/prep/nights",
        json={"venue_id": venue_id, "date": "2026-02-15"},
    )
    night_id = night_response.json()["id"]

    # Create game
    playlist = create_test_playlist(48)
    response = client.post(
        "/api/prep/games",
        json={
            "venue_night_id": night_id,
            "name": "My Game",
            "playlist": playlist,
            "card_count": 25,
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My Game"
    assert data["song_count"] == 48
    assert data["card_count"] == 25
    assert data["pdf_path"] is None  # Not generated yet
    assert "game_uuid" in data


def test_list_games(client):
    """Test listing games for a venue night."""
    game_id, venue_id, night_id = setup_game_for_generation(client)

    response = client.get(f"/api/prep/games?venue_night_id={night_id}")

    assert response.status_code == 200
    data = response.json()
    assert len(data["games"]) == 1
    assert data["games"][0]["name"] == "Test Game"


def test_get_game(client):
    """Test getting a single game with full playlist."""
    game_id, venue_id, night_id = setup_game_for_generation(client)

    response = client.get(f"/api/prep/games/{game_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == game_id
    assert data["name"] == "Test Game"
    assert len(data["playlist"]) == 48


def test_delete_game(client):
    """Test deleting a game."""
    game_id, venue_id, night_id = setup_game_for_generation(client)

    response = client.delete(f"/api/prep/games/{game_id}")

    assert response.status_code == 200
    assert response.json()["success"] is True

    # Verify game is gone
    get_response = client.get(f"/api/prep/games/{game_id}")
    assert get_response.status_code == 404
