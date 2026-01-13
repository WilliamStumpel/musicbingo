"""Tests for card exporter."""

import json
from pathlib import Path
from uuid import uuid4

import pytest

from musicbingo_cards.exporter import CardExporter
from musicbingo_cards.models import BingoCard, Song


@pytest.fixture
def sample_songs():
    """Create sample songs for testing."""
    return [Song(song_id=uuid4(), title=f"Song {i}", artist=f"Artist {i}") for i in range(30)]


@pytest.fixture
def sample_cards(sample_songs):
    """Create sample cards for testing."""
    game_id = uuid4()
    cards = []

    for card_num in range(3):
        card = BingoCard(game_id=game_id)

        # Fill card with 24 songs
        song_idx = 0
        for row in range(5):
            for col in range(5):
                if row == 2 and col == 2:  # Skip center
                    continue
                card.add_song(row, col, sample_songs[song_idx])
                song_idx += 1

        cards.append(card)

    return cards


def test_to_json_dict(sample_cards):
    """Test converting cards to JSON dictionary."""
    result = CardExporter.to_json_dict(sample_cards)

    assert "game_id" in result
    assert "cards" in result
    assert len(result["cards"]) == 3

    # Check first card structure
    card_data = result["cards"][0]
    assert "card_id" in card_data
    assert "card_number" in card_data
    assert "song_positions" in card_data

    # Should have 24 songs (excluding free space)
    assert len(card_data["song_positions"]) == 24

    # Card numbers should be 1-indexed
    assert result["cards"][0]["card_number"] == 1
    assert result["cards"][1]["card_number"] == 2
    assert result["cards"][2]["card_number"] == 3


def test_to_json_string(sample_cards):
    """Test converting cards to JSON string."""
    json_str = CardExporter.to_json_string(sample_cards)

    # Should be valid JSON
    data = json.loads(json_str)
    assert "game_id" in data
    assert "cards" in data
    assert len(data["cards"]) == 3


def test_save_json(sample_cards, tmp_path):
    """Test saving cards to JSON file."""
    output_file = tmp_path / "cards.json"

    CardExporter.save_json(sample_cards, output_file)

    assert output_file.exists()

    # Load and verify
    with open(output_file) as f:
        data = json.load(f)

    assert "game_id" in data
    assert len(data["cards"]) == 3


def test_get_summary(sample_cards):
    """Test getting summary of cards."""
    summary = CardExporter.get_summary(sample_cards)

    assert summary["card_count"] == 3
    assert "game_id" in summary
    assert "card_ids" in summary
    assert len(summary["card_ids"]) == 3
    assert summary["songs_per_card"] == 24


def test_empty_cards_raises_error():
    """Test that exporting empty card list raises error."""
    with pytest.raises(ValueError, match="Cannot export empty card list"):
        CardExporter.to_json_dict([])


def test_song_positions_format(sample_cards):
    """Test that song positions are in correct format [row, col]."""
    result = CardExporter.to_json_dict(sample_cards)

    for card_data in result["cards"]:
        for song_id, position in card_data["song_positions"].items():
            # Position should be [row, col]
            assert isinstance(position, list)
            assert len(position) == 2
            assert 0 <= position[0] < 5  # row
            assert 0 <= position[1] < 5  # col

            # Center position should not be present
            assert not (position[0] == 2 and position[1] == 2)
