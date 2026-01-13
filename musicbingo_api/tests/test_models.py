"""Tests for data models."""

from uuid import uuid4

import pytest

from musicbingo_api.models import (
    BingoPattern,
    CardData,
    GameState,
    GameStatus,
    PatternType,
    Song,
)


def test_song_creation():
    """Test creating a song."""
    song = Song(song_id=uuid4(), title="Test Song", artist="Test Artist")
    assert song.title == "Test Song"
    assert song.artist == "Test Artist"
    assert str(song) == "Test Song - Test Artist"


def test_bingo_pattern_row():
    """Test row pattern detection."""
    pattern = BingoPattern(PatternType.ROW, "Row", "Complete a row")

    # Test winning row
    marked = {(0, 0), (0, 1), (0, 2), (0, 3), (0, 4)}
    assert pattern.check_win(marked) is True

    # Test incomplete row
    marked = {(0, 0), (0, 1), (0, 2), (0, 3)}
    assert pattern.check_win(marked) is False


def test_bingo_pattern_column():
    """Test column pattern detection."""
    pattern = BingoPattern(PatternType.COLUMN, "Column", "Complete a column")

    # Test winning column
    marked = {(0, 0), (1, 0), (2, 0), (3, 0), (4, 0)}
    assert pattern.check_win(marked) is True

    # Test incomplete column
    marked = {(0, 0), (1, 0), (2, 0), (3, 0)}
    assert pattern.check_win(marked) is False


def test_bingo_pattern_diagonal():
    """Test diagonal pattern detection."""
    pattern = BingoPattern(PatternType.DIAGONAL, "Diagonal", "Complete a diagonal")

    # Test main diagonal
    marked = {(0, 0), (1, 1), (2, 2), (3, 3), (4, 4)}
    assert pattern.check_win(marked) is True

    # Test anti-diagonal
    marked = {(0, 4), (1, 3), (2, 2), (3, 1), (4, 0)}
    assert pattern.check_win(marked) is True

    # Test incomplete diagonal
    marked = {(0, 0), (1, 1), (2, 2), (3, 3)}
    assert pattern.check_win(marked) is False


def test_bingo_pattern_four_corners():
    """Test four corners pattern detection."""
    pattern = BingoPattern(PatternType.FOUR_CORNERS, "Corners", "Mark all corners")

    # Test winning corners
    marked = {(0, 0), (0, 4), (4, 0), (4, 4)}
    assert pattern.check_win(marked) is True

    # Test incomplete corners
    marked = {(0, 0), (0, 4), (4, 0)}
    assert pattern.check_win(marked) is False


def test_bingo_pattern_five_in_a_row():
    """Test 5 in a row pattern detection (row OR column OR diagonal)."""
    pattern = BingoPattern(
        PatternType.FIVE_IN_A_ROW, "5 in a Row", "Any row, column, or diagonal"
    )

    # Test winning with a row
    marked = {(0, 0), (0, 1), (0, 2), (0, 3), (0, 4)}
    assert pattern.check_win(marked) is True

    # Test winning with a column
    marked = {(0, 0), (1, 0), (2, 0), (3, 0), (4, 0)}
    assert pattern.check_win(marked) is True

    # Test winning with main diagonal
    marked = {(0, 0), (1, 1), (2, 2), (3, 3), (4, 4)}
    assert pattern.check_win(marked) is True

    # Test winning with anti-diagonal
    marked = {(0, 4), (1, 3), (2, 2), (3, 1), (4, 0)}
    assert pattern.check_win(marked) is True

    # Test not winning (incomplete row and column)
    marked = {(0, 0), (0, 1), (0, 2), (1, 0), (2, 0)}
    assert pattern.check_win(marked) is False


def test_card_data_marked_positions():
    """Test getting marked positions from played songs."""
    song1 = uuid4()
    song2 = uuid4()
    song3 = uuid4()

    card = CardData(
        card_id=uuid4(),
        game_id=uuid4(),
        card_number=1,
        song_positions={
            song1: (0, 0),
            song2: (0, 1),
            song3: (1, 0),
        },
    )

    # Test with some songs played
    played = {song1, song2}
    marked = card.get_marked_positions(played)

    # Should include played songs + center free space
    assert (0, 0) in marked
    assert (0, 1) in marked
    assert (2, 2) in marked  # Free space
    assert (1, 0) not in marked  # song3 not played


def test_game_state_creation():
    """Test creating a game state."""
    game_id = uuid4()
    songs = [Song(song_id=uuid4(), title=f"Song {i}", artist="Artist") for i in range(24)]

    game = GameState(
        game_id=game_id,
        status=GameStatus.SETUP,
        playlist=songs,
        current_pattern=PatternType.ROW,
    )

    assert game.game_id == game_id
    assert game.status == GameStatus.SETUP
    assert len(game.playlist) == 24
    assert len(game.played_songs) == 0


def test_game_state_add_played_song():
    """Test adding played songs to game state."""
    songs = [Song(song_id=uuid4(), title=f"Song {i}", artist="Artist") for i in range(24)]
    game = GameState(game_id=uuid4(), status=GameStatus.ACTIVE, playlist=songs)

    # Add first song
    game.add_played_song(songs[0].song_id)
    assert len(game.played_songs) == 1
    assert songs[0].song_id in game.played_songs

    # Add second song
    game.add_played_song(songs[1].song_id)
    assert len(game.played_songs) == 2

    # Adding same song again should not duplicate
    game.add_played_song(songs[0].song_id)
    assert len(game.played_songs) == 2


def test_game_state_add_invalid_song():
    """Test adding a song not in playlist raises error."""
    songs = [Song(song_id=uuid4(), title=f"Song {i}", artist="Artist") for i in range(24)]
    game = GameState(game_id=uuid4(), status=GameStatus.ACTIVE, playlist=songs)

    invalid_song_id = uuid4()
    with pytest.raises(ValueError, match="not in game playlist"):
        game.add_played_song(invalid_song_id)


def test_game_state_verify_card_winner():
    """Test verifying a winning card."""
    # Create game with songs
    songs = [Song(song_id=uuid4(), title=f"Song {i}", artist="Artist") for i in range(24)]
    game = GameState(game_id=uuid4(), status=GameStatus.ACTIVE, playlist=songs)

    # Create a card with first 5 songs in top row
    card = CardData(
        card_id=uuid4(),
        game_id=game.game_id,
        card_number=1,
        song_positions={
            songs[i].song_id: (0, i) for i in range(5)
        },
    )
    game.add_card(card)

    # Play those 5 songs
    for i in range(5):
        game.add_played_song(songs[i].song_id)

    # Verify card is winner (five_in_a_row pattern, detects row)
    is_winner, pattern, card_number = game.verify_card(card.card_id)
    assert is_winner is True
    assert pattern == PatternType.FIVE_IN_A_ROW
    assert card_number == 1


def test_game_state_verify_card_not_winner():
    """Test verifying a non-winning card."""
    # Create game with songs
    songs = [Song(song_id=uuid4(), title=f"Song {i}", artist="Artist") for i in range(24)]
    game = GameState(game_id=uuid4(), status=GameStatus.ACTIVE, playlist=songs)

    # Create a card
    card = CardData(
        card_id=uuid4(),
        game_id=game.game_id,
        card_number=1,
        song_positions={
            songs[i].song_id: (0, i) for i in range(5)
        },
    )
    game.add_card(card)

    # Play only 3 songs (not enough for row)
    for i in range(3):
        game.add_played_song(songs[i].song_id)

    # Verify card is not winner
    is_winner, pattern, card_number = game.verify_card(card.card_id)
    assert is_winner is False
    assert pattern is None
    assert card_number == 1
