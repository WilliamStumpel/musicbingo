"""Tests for Game Prep API routes (venues and venue nights).

Tests cover venue CRUD, logo upload, and venue night management.
"""

import os
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from musicbingo_api.database import DATABASE_PATH, DATA_DIR, init_db
from musicbingo_api.main import app


@pytest.fixture(autouse=True)
def reset_database():
    """Reset database before each test.

    Creates a fresh database for each test to ensure isolation.
    """
    # Remove existing database
    if DATABASE_PATH.exists():
        DATABASE_PATH.unlink()

    # Ensure data directory exists
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Initialize fresh database
    init_db()

    yield

    # Clean up after test
    if DATABASE_PATH.exists():
        DATABASE_PATH.unlink()


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


# =============================================================================
# Venue Tests
# =============================================================================


def test_list_venues_empty(client):
    """Test listing venues returns empty list initially."""
    response = client.get("/api/prep/venues")
    assert response.status_code == 200
    data = response.json()
    assert data["venues"] == []


def test_create_venue(client):
    """Test creating a venue with name and contact info."""
    response = client.post(
        "/api/prep/venues",
        json={"name": "The Blue Note", "contact_info": "DJ Mike: 555-1234"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["name"] == "The Blue Note"
    assert data["contact_info"] == "DJ Mike: 555-1234"
    assert data["logo_path"] is None
    assert "created_at" in data
    assert "updated_at" in data


def test_create_venue_without_contact_info(client):
    """Test creating a venue with only name (contact info optional)."""
    response = client.post(
        "/api/prep/venues",
        json={"name": "The Green Room"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "The Green Room"
    assert data["contact_info"] is None


def test_get_venue(client):
    """Test getting a single venue by ID."""
    # Create venue
    create_response = client.post(
        "/api/prep/venues",
        json={"name": "Test Venue"},
    )
    venue_id = create_response.json()["id"]

    # Get venue
    response = client.get(f"/api/prep/venues/{venue_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == venue_id
    assert data["name"] == "Test Venue"


def test_get_venue_not_found(client):
    """Test getting a non-existent venue returns 404."""
    response = client.get("/api/prep/venues/9999")
    assert response.status_code == 404


def test_list_venues_with_data(client):
    """Test listing venues returns created venues."""
    # Create two venues
    client.post("/api/prep/venues", json={"name": "Venue A"})
    client.post("/api/prep/venues", json={"name": "Venue B"})

    response = client.get("/api/prep/venues")

    assert response.status_code == 200
    data = response.json()
    assert len(data["venues"]) == 2
    # Should be ordered by name
    names = [v["name"] for v in data["venues"]]
    assert names == ["Venue A", "Venue B"]


def test_update_venue(client):
    """Test updating a venue name and contact info."""
    # Create venue
    create_response = client.post(
        "/api/prep/venues",
        json={"name": "Original Name", "contact_info": "Old contact"},
    )
    venue_id = create_response.json()["id"]

    # Update venue
    response = client.put(
        f"/api/prep/venues/{venue_id}",
        json={"name": "Updated Name", "contact_info": "New contact"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["contact_info"] == "New contact"


def test_update_venue_not_found(client):
    """Test updating a non-existent venue returns 404."""
    response = client.put(
        "/api/prep/venues/9999",
        json={"name": "Doesn't Matter"},
    )
    assert response.status_code == 404


def test_delete_venue(client):
    """Test deleting a venue."""
    # Create venue
    create_response = client.post(
        "/api/prep/venues",
        json={"name": "To Delete"},
    )
    venue_id = create_response.json()["id"]

    # Delete venue
    response = client.delete(f"/api/prep/venues/{venue_id}")
    assert response.status_code == 204

    # Verify it's gone
    get_response = client.get(f"/api/prep/venues/{venue_id}")
    assert get_response.status_code == 404


def test_delete_venue_not_found(client):
    """Test deleting a non-existent venue returns 404."""
    response = client.delete("/api/prep/venues/9999")
    assert response.status_code == 404


def test_create_venue_duplicate_name(client):
    """Test creating a venue with duplicate name fails."""
    # Create first venue
    client.post("/api/prep/venues", json={"name": "Unique Name"})

    # Try to create second with same name
    response = client.post("/api/prep/venues", json={"name": "Unique Name"})
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


# =============================================================================
# Venue Night Tests
# =============================================================================


def test_list_venue_nights_empty(client):
    """Test listing venue nights returns empty list initially."""
    response = client.get("/api/prep/nights")
    assert response.status_code == 200
    data = response.json()
    assert data["nights"] == []


def test_create_venue_night(client):
    """Test creating a venue night with date and venue."""
    # Create venue first
    venue_response = client.post(
        "/api/prep/venues",
        json={"name": "Test Venue"},
    )
    venue_id = venue_response.json()["id"]

    # Create venue night
    response = client.post(
        "/api/prep/nights",
        json={"venue_id": venue_id, "date": "2026-02-15"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["venue_id"] == venue_id
    assert data["date"] == "2026-02-15"
    assert data["status"] == "draft"
    assert data["venue_name"] == "Test Venue"
    assert data["game_count"] == 0


def test_create_venue_night_with_notes(client):
    """Test creating a venue night with notes."""
    venue_response = client.post("/api/prep/venues", json={"name": "V1"})
    venue_id = venue_response.json()["id"]

    response = client.post(
        "/api/prep/nights",
        json={
            "venue_id": venue_id,
            "date": "2026-03-01",
            "notes": "Special event night",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["notes"] == "Special event night"


def test_get_venue_night(client):
    """Test getting a single venue night by ID."""
    # Setup
    venue_response = client.post("/api/prep/venues", json={"name": "V1"})
    venue_id = venue_response.json()["id"]
    night_response = client.post(
        "/api/prep/nights",
        json={"venue_id": venue_id, "date": "2026-01-20"},
    )
    night_id = night_response.json()["id"]

    # Get venue night
    response = client.get(f"/api/prep/nights/{night_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == night_id
    assert data["date"] == "2026-01-20"


def test_get_venue_night_not_found(client):
    """Test getting a non-existent venue night returns 404."""
    response = client.get("/api/prep/nights/9999")
    assert response.status_code == 404


def test_list_venue_nights_with_data(client):
    """Test listing venue nights returns created nights."""
    # Create venue and two nights
    venue_response = client.post("/api/prep/venues", json={"name": "V1"})
    venue_id = venue_response.json()["id"]

    client.post("/api/prep/nights", json={"venue_id": venue_id, "date": "2026-01-10"})
    client.post("/api/prep/nights", json={"venue_id": venue_id, "date": "2026-01-20"})

    response = client.get("/api/prep/nights")

    assert response.status_code == 200
    data = response.json()
    assert len(data["nights"]) == 2
    # Should be ordered by date (newest first)
    dates = [n["date"] for n in data["nights"]]
    assert dates == ["2026-01-20", "2026-01-10"]


def test_list_venue_nights_filter_by_venue(client):
    """Test filtering venue nights by venue_id."""
    # Create two venues with one night each
    v1_response = client.post("/api/prep/venues", json={"name": "V1"})
    v2_response = client.post("/api/prep/venues", json={"name": "V2"})
    v1_id = v1_response.json()["id"]
    v2_id = v2_response.json()["id"]

    client.post("/api/prep/nights", json={"venue_id": v1_id, "date": "2026-01-10"})
    client.post("/api/prep/nights", json={"venue_id": v2_id, "date": "2026-01-15"})

    # Filter by venue 1
    response = client.get(f"/api/prep/nights?venue_id={v1_id}")

    assert response.status_code == 200
    data = response.json()
    assert len(data["nights"]) == 1
    assert data["nights"][0]["venue_id"] == v1_id


def test_update_venue_night_status(client):
    """Test updating venue night status (draft -> ready -> completed)."""
    # Setup
    venue_response = client.post("/api/prep/venues", json={"name": "V1"})
    venue_id = venue_response.json()["id"]
    night_response = client.post(
        "/api/prep/nights",
        json={"venue_id": venue_id, "date": "2026-01-20"},
    )
    night_id = night_response.json()["id"]

    # Update to ready
    response = client.put(
        f"/api/prep/nights/{night_id}",
        json={
            "venue_id": venue_id,
            "date": "2026-01-20",
            "status": "ready",
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "ready"

    # Update to completed
    response = client.put(
        f"/api/prep/nights/{night_id}",
        json={
            "venue_id": venue_id,
            "date": "2026-01-20",
            "status": "completed",
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "completed"


def test_update_venue_night_invalid_status(client):
    """Test updating venue night with invalid status fails."""
    # Setup
    venue_response = client.post("/api/prep/venues", json={"name": "V1"})
    venue_id = venue_response.json()["id"]
    night_response = client.post(
        "/api/prep/nights",
        json={"venue_id": venue_id, "date": "2026-01-20"},
    )
    night_id = night_response.json()["id"]

    # Try invalid status
    response = client.put(
        f"/api/prep/nights/{night_id}",
        json={
            "venue_id": venue_id,
            "date": "2026-01-20",
            "status": "invalid_status",
        },
    )

    assert response.status_code == 400


def test_delete_venue_night(client):
    """Test deleting a venue night."""
    # Setup
    venue_response = client.post("/api/prep/venues", json={"name": "V1"})
    venue_id = venue_response.json()["id"]
    night_response = client.post(
        "/api/prep/nights",
        json={"venue_id": venue_id, "date": "2026-01-20"},
    )
    night_id = night_response.json()["id"]

    # Delete
    response = client.delete(f"/api/prep/nights/{night_id}")
    assert response.status_code == 204

    # Verify it's gone
    get_response = client.get(f"/api/prep/nights/{night_id}")
    assert get_response.status_code == 404


def test_delete_venue_night_not_found(client):
    """Test deleting a non-existent venue night returns 404."""
    response = client.delete("/api/prep/nights/9999")
    assert response.status_code == 404


def test_create_venue_night_nonexistent_venue(client):
    """Test creating a venue night for non-existent venue fails."""
    response = client.post(
        "/api/prep/nights",
        json={"venue_id": 9999, "date": "2026-01-20"},
    )
    assert response.status_code == 400


def test_create_venue_night_duplicate_date(client):
    """Test creating duplicate venue night for same date fails."""
    # Setup
    venue_response = client.post("/api/prep/venues", json={"name": "V1"})
    venue_id = venue_response.json()["id"]

    # First night - should succeed
    client.post("/api/prep/nights", json={"venue_id": venue_id, "date": "2026-01-20"})

    # Duplicate - should fail
    response = client.post(
        "/api/prep/nights",
        json={"venue_id": venue_id, "date": "2026-01-20"},
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_delete_venue_cascades_to_nights(client):
    """Test deleting a venue also deletes its venue nights."""
    # Setup venue with night
    venue_response = client.post("/api/prep/venues", json={"name": "V1"})
    venue_id = venue_response.json()["id"]
    night_response = client.post(
        "/api/prep/nights",
        json={"venue_id": venue_id, "date": "2026-01-20"},
    )
    night_id = night_response.json()["id"]

    # Delete venue
    client.delete(f"/api/prep/venues/{venue_id}")

    # Verify night is also gone
    response = client.get(f"/api/prep/nights/{night_id}")
    assert response.status_code == 404
