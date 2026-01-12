"""Tests for data models."""

import pytest
from uuid import UUID, uuid4

from musicbingo_cards.models import Song, CardGrid, QRCodeData, BingoCard


class TestSong:
    """Tests for Song model."""

    def test_create_song(self):
        """Test creating a valid song."""
        song = Song(title="Bohemian Rhapsody", artist="Queen")
        assert song.title == "Bohemian Rhapsody"
        assert song.artist == "Queen"
        assert isinstance(song.song_id, UUID)

    def test_song_with_metadata(self):
        """Test creating a song with optional fields."""
        song = Song(
            title="Hotel California",
            artist="Eagles",
            album="Hotel California",
            duration_seconds=391,
            metadata={"year": 1976, "genre": "Rock"},
        )
        assert song.album == "Hotel California"
        assert song.duration_seconds == 391
        assert song.metadata["year"] == 1976

    def test_song_string_representation(self):
        """Test song string conversion."""
        song = Song(title="Imagine", artist="John Lennon")
        assert str(song) == "Imagine - John Lennon"

    def test_empty_title_raises_error(self):
        """Test that empty title raises ValueError."""
        with pytest.raises(ValueError, match="title cannot be empty"):
            Song(title="", artist="Test Artist")

    def test_empty_artist_raises_error(self):
        """Test that empty artist raises ValueError."""
        with pytest.raises(ValueError, match="artist cannot be empty"):
            Song(title="Test Song", artist="")

    def test_negative_duration_raises_error(self):
        """Test that negative duration raises ValueError."""
        with pytest.raises(ValueError, match="duration must be positive"):
            Song(title="Test", artist="Test", duration_seconds=-10)

    def test_song_is_frozen(self):
        """Test that Song is immutable (frozen dataclass)."""
        song = Song(title="Test", artist="Test")
        with pytest.raises(Exception):  # FrozenInstanceError in Python 3.10+
            song.title = "Changed"


class TestCardGrid:
    """Tests for CardGrid model."""

    def test_create_empty_grid(self):
        """Test creating an empty grid."""
        grid = CardGrid()
        assert len(grid.songs) == 5
        assert all(len(row) == 5 for row in grid.songs)
        assert grid.songs[2][2] is None  # Center is free space

    def test_set_song(self):
        """Test placing a song on the grid."""
        grid = CardGrid()
        song = Song(title="Test", artist="Test")
        grid.set_song(0, 0, song)
        assert grid.get_song(0, 0) == song

    def test_cannot_set_center(self):
        """Test that center position cannot be set."""
        grid = CardGrid()
        song = Song(title="Test", artist="Test")
        with pytest.raises(ValueError, match="Cannot place song in center"):
            grid.set_song(2, 2, song)

    def test_invalid_position(self):
        """Test that invalid positions raise errors."""
        grid = CardGrid()
        song = Song(title="Test", artist="Test")
        with pytest.raises(ValueError, match="Invalid position"):
            grid.set_song(5, 5, song)
        with pytest.raises(ValueError, match="Invalid position"):
            grid.set_song(-1, 0, song)

    def test_duplicate_position_raises_error(self):
        """Test that setting the same position twice raises error."""
        grid = CardGrid()
        song1 = Song(title="Song 1", artist="Artist 1")
        song2 = Song(title="Song 2", artist="Artist 2")
        grid.set_song(0, 0, song1)
        with pytest.raises(ValueError, match="already occupied"):
            grid.set_song(0, 0, song2)

    def test_get_all_songs(self):
        """Test getting all songs from grid."""
        grid = CardGrid()
        songs = [Song(title=f"Song {i}", artist=f"Artist {i}") for i in range(24)]

        # Fill grid (skip center)
        pos = 0
        for row in range(5):
            for col in range(5):
                if row == 2 and col == 2:  # Skip center
                    continue
                grid.set_song(row, col, songs[pos])
                pos += 1

        retrieved = grid.get_all_songs()
        assert len(retrieved) == 24
        assert all(song in retrieved for song in songs)

    def test_is_complete(self):
        """Test checking if grid is complete."""
        grid = CardGrid()
        assert not grid.is_complete()

        # Fill all positions except one
        for row in range(5):
            for col in range(5):
                if row == 2 and col == 2:  # Skip center
                    continue
                if row == 4 and col == 4:  # Leave one empty
                    continue
                grid.set_song(row, col, Song(title=f"Song {row}{col}", artist="Artist"))

        assert not grid.is_complete()

        # Fill the last position
        grid.set_song(4, 4, Song(title="Last Song", artist="Artist"))
        assert grid.is_complete()


class TestQRCodeData:
    """Tests for QRCodeData model."""

    def test_create_qr_data(self):
        """Test creating QR code data."""
        card_id = uuid4()
        game_id = uuid4()
        qr = QRCodeData(card_id=card_id, game_id=game_id)
        assert qr.card_id == card_id
        assert qr.game_id == game_id
        assert len(qr.checksum) == 16  # SHA256 truncated to 16 chars

    def test_qr_to_string(self):
        """Test encoding QR data to string."""
        card_id = uuid4()
        game_id = uuid4()
        qr = QRCodeData(card_id=card_id, game_id=game_id)
        string = qr.to_string()
        assert str(card_id) in string
        assert str(game_id) in string
        assert qr.checksum in string
        assert string.count("|") == 2  # Two separators

    def test_qr_from_string(self):
        """Test decoding QR data from string."""
        card_id = uuid4()
        game_id = uuid4()
        qr1 = QRCodeData(card_id=card_id, game_id=game_id)
        string = qr1.to_string()

        qr2 = QRCodeData.from_string(string)
        assert qr2.card_id == card_id
        assert qr2.game_id == game_id
        assert qr2.checksum == qr1.checksum

    def test_qr_from_invalid_string(self):
        """Test that invalid string raises error."""
        with pytest.raises(ValueError, match="Invalid QR code format"):
            QRCodeData.from_string("invalid")
        with pytest.raises(ValueError, match="Invalid QR code"):
            QRCodeData.from_string("not-a-uuid|also-not|checksum")

    def test_qr_is_valid(self):
        """Test QR code validation."""
        card_id = uuid4()
        game_id = uuid4()
        qr = QRCodeData(card_id=card_id, game_id=game_id)
        assert qr.is_valid()

        # Tampered checksum
        qr_bad = QRCodeData(card_id=card_id, game_id=game_id, checksum="tampered123")
        assert not qr_bad.is_valid()

    def test_qr_round_trip(self):
        """Test encoding and decoding QR data maintains validity."""
        qr1 = QRCodeData(card_id=uuid4(), game_id=uuid4())
        string = qr1.to_string()
        qr2 = QRCodeData.from_string(string)
        assert qr2.is_valid()
        assert qr1.checksum == qr2.checksum


class TestBingoCard:
    """Tests for BingoCard model."""

    def test_create_card(self):
        """Test creating a bingo card."""
        card = BingoCard()
        assert isinstance(card.card_id, UUID)
        assert isinstance(card.game_id, UUID)
        assert isinstance(card.grid, CardGrid)
        assert card.qr_data is not None
        assert card.qr_data.card_id == card.card_id

    def test_add_song_to_card(self):
        """Test adding songs to a card."""
        card = BingoCard()
        song = Song(title="Test Song", artist="Test Artist")
        card.add_song(0, 0, song)
        assert card.grid.get_song(0, 0) == song

    def test_card_is_complete(self):
        """Test checking if card is complete."""
        card = BingoCard()
        assert not card.is_complete()

        # Fill all positions
        for row in range(5):
            for col in range(5):
                if row == 2 and col == 2:  # Skip center
                    continue
                card.add_song(row, col, Song(title=f"Song {row}{col}", artist="Artist"))

        assert card.is_complete()

    def test_get_songs(self):
        """Test getting all songs from card."""
        card = BingoCard()
        songs = [Song(title=f"Song {i}", artist=f"Artist {i}") for i in range(24)]

        # Add songs
        pos = 0
        for row in range(5):
            for col in range(5):
                if row == 2 and col == 2:  # Skip center
                    continue
                card.add_song(row, col, songs[pos])
                pos += 1

        retrieved = card.get_songs()
        assert len(retrieved) == 24

    def test_validate_complete_card(self):
        """Test validating a complete card."""
        card = BingoCard()

        # Fill card
        for row in range(5):
            for col in range(5):
                if row == 2 and col == 2:  # Skip center
                    continue
                card.add_song(row, col, Song(title=f"Song {row}{col}", artist="Artist"))

        assert card.validate()

    def test_validate_incomplete_card_raises_error(self):
        """Test that validating incomplete card raises error."""
        card = BingoCard()
        with pytest.raises(ValueError, match="Card is incomplete"):
            card.validate()

    def test_card_with_same_game_id(self):
        """Test creating multiple cards with same game ID."""
        game_id = uuid4()
        card1 = BingoCard(game_id=game_id)
        card2 = BingoCard(game_id=game_id)

        assert card1.game_id == card2.game_id
        assert card1.card_id != card2.card_id  # Cards should have unique IDs
        assert card1.qr_data.game_id == game_id
        assert card2.qr_data.game_id == game_id
