"""Data models for Music Bingo API."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4


class PatternType(str, Enum):
    """Bingo winning pattern types."""

    FIVE_IN_A_ROW = "five_in_a_row"  # Most common: any row, column, or diagonal
    ROW = "row"
    COLUMN = "column"
    DIAGONAL = "diagonal"
    FOUR_CORNERS = "four_corners"
    FULL_CARD = "full_card"
    X_PATTERN = "x_pattern"


class GameStatus(str, Enum):
    """Game session status."""

    SETUP = "setup"  # Game created, cards being generated
    ACTIVE = "active"  # Game in progress
    PAUSED = "paused"  # Game paused
    COMPLETED = "completed"  # Game finished


@dataclass
class Song:
    """Represents a song in the game playlist."""

    song_id: UUID
    title: str
    artist: str
    album: Optional[str] = None
    duration_seconds: Optional[int] = None

    def __str__(self) -> str:
        return f"{self.title} - {self.artist}"


@dataclass
class BingoPattern:
    """Represents a winning bingo pattern."""

    pattern_type: PatternType
    name: str
    description: str

    def check_win(self, marked_positions: set[tuple[int, int]]) -> bool:
        """Check if marked positions form this winning pattern.

        Args:
            marked_positions: Set of (row, col) tuples that are marked

        Returns:
            True if positions form a winning pattern
        """
        if self.pattern_type == PatternType.FIVE_IN_A_ROW:
            # Classic bingo: any row, column, or diagonal wins
            # Check rows
            for row in range(5):
                if all((row, col) in marked_positions for col in range(5)):
                    return True
            # Check columns
            for col in range(5):
                if all((row, col) in marked_positions for row in range(5)):
                    return True
            # Check diagonals
            main_diagonal = all((i, i) in marked_positions for i in range(5))
            anti_diagonal = all((i, 4 - i) in marked_positions for i in range(5))
            if main_diagonal or anti_diagonal:
                return True
            return False

        elif self.pattern_type == PatternType.ROW:
            # Check all rows
            for row in range(5):
                if all((row, col) in marked_positions for col in range(5)):
                    return True
            return False

        elif self.pattern_type == PatternType.COLUMN:
            # Check all columns
            for col in range(5):
                if all((row, col) in marked_positions for row in range(5)):
                    return True
            return False

        elif self.pattern_type == PatternType.DIAGONAL:
            # Check both diagonals
            main_diagonal = all((i, i) in marked_positions for i in range(5))
            anti_diagonal = all((i, 4 - i) in marked_positions for i in range(5))
            return main_diagonal or anti_diagonal

        elif self.pattern_type == PatternType.FOUR_CORNERS:
            corners = {(0, 0), (0, 4), (4, 0), (4, 4)}
            return corners.issubset(marked_positions)

        elif self.pattern_type == PatternType.X_PATTERN:
            # Both diagonals
            x_positions = {(i, i) for i in range(5)} | {(i, 4 - i) for i in range(5)}
            return x_positions.issubset(marked_positions)

        elif self.pattern_type == PatternType.FULL_CARD:
            # All 24 positions (excluding center free space)
            all_positions = {(r, c) for r in range(5) for c in range(5) if not (r == 2 and c == 2)}
            return all_positions.issubset(marked_positions)

        return False


# Default patterns
DEFAULT_PATTERNS = {
    PatternType.FIVE_IN_A_ROW: BingoPattern(
        PatternType.FIVE_IN_A_ROW,
        "5 in a Row",
        "Complete any row, column, or diagonal (classic bingo)"
    ),
    PatternType.ROW: BingoPattern(PatternType.ROW, "Any Row", "Complete any horizontal row"),
    PatternType.COLUMN: BingoPattern(
        PatternType.COLUMN, "Any Column", "Complete any vertical column"
    ),
    PatternType.DIAGONAL: BingoPattern(
        PatternType.DIAGONAL, "Diagonal", "Complete either diagonal"
    ),
    PatternType.FOUR_CORNERS: BingoPattern(
        PatternType.FOUR_CORNERS, "Four Corners", "Mark all four corner squares"
    ),
    PatternType.X_PATTERN: BingoPattern(PatternType.X_PATTERN, "X", "Complete both diagonals"),
    PatternType.FULL_CARD: BingoPattern(
        PatternType.FULL_CARD, "Blackout", "Mark all 24 squares"
    ),
}


@dataclass
class CardData:
    """Minimal card data needed for verification.

    Full card details are stored separately. This contains just what's needed
    to verify wins quickly.
    """

    card_id: UUID
    game_id: UUID
    card_number: int  # Human-readable card number (1, 2, 3...)
    song_positions: dict[UUID, tuple[int, int]]  # song_id -> (row, col)

    def get_marked_positions(self, played_song_ids: set[UUID]) -> set[tuple[int, int]]:
        """Get positions that should be marked based on played songs.

        Args:
            played_song_ids: Set of song IDs that have been played

        Returns:
            Set of (row, col) positions that are marked
        """
        marked = set()
        for song_id, position in self.song_positions.items():
            if song_id in played_song_ids:
                marked.add(position)
        # Center free space is always marked
        marked.add((2, 2))
        return marked


@dataclass
class GameState:
    """Current state of an active game."""

    game_id: UUID
    status: GameStatus
    playlist: list[Song]  # All songs in the game
    played_songs: list[UUID] = field(default_factory=list)  # Songs played so far (in order)
    revealed_songs: list[UUID] = field(default_factory=list)  # Songs with titles revealed on player view
    current_pattern: PatternType = PatternType.FIVE_IN_A_ROW
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    # Cards in this game (card_id -> CardData)
    cards: dict[UUID, CardData] = field(default_factory=dict)

    def add_played_song(self, song_id: UUID) -> None:
        """Record a song as played.

        Args:
            song_id: UUID of the song that was played
        """
        if song_id not in [s.song_id for s in self.playlist]:
            raise ValueError(f"Song {song_id} not in game playlist")

        if song_id not in self.played_songs:
            self.played_songs.append(song_id)
            self.updated_at = datetime.now()

    def get_played_song_ids(self) -> set[UUID]:
        """Get set of played song IDs for quick lookup."""
        return set(self.played_songs)

    def verify_card(self, card_id: UUID) -> tuple[bool, Optional[PatternType], int]:
        """Verify if a card is a winner.

        Args:
            card_id: UUID of card to verify

        Returns:
            Tuple of (is_winner, pattern_type, card_number)
        """
        if card_id not in self.cards:
            raise ValueError(f"Card {card_id} not found in game")

        card = self.cards[card_id]
        played_song_ids = self.get_played_song_ids()
        marked_positions = card.get_marked_positions(played_song_ids)

        # Check if marked positions form the current winning pattern
        pattern = DEFAULT_PATTERNS[self.current_pattern]
        is_winner = pattern.check_win(marked_positions)

        return (is_winner, self.current_pattern if is_winner else None, card.card_number)

    def add_card(self, card: CardData) -> None:
        """Add a card to this game.

        Args:
            card: CardData to add
        """
        if card.game_id != self.game_id:
            raise ValueError("Card game_id does not match this game")
        self.cards[card.card_id] = card
