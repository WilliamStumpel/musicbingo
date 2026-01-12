"""Data models for Music Bingo card generation."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4


@dataclass(frozen=True)
class Song:
    """Represents a song that can appear on a bingo card.

    Attributes:
        title: Song title
        artist: Artist name
        song_id: Unique identifier for this song (auto-generated)
        album: Album name (optional)
        duration_seconds: Song duration in seconds (optional)
        metadata: Additional metadata (e.g., genre, year)
    """

    title: str
    artist: str
    song_id: UUID = field(default_factory=uuid4)
    album: Optional[str] = None
    duration_seconds: Optional[int] = None
    metadata: dict = field(default_factory=dict)

    def __post_init__(self):
        """Validate song data after initialization."""
        if not self.title or not self.title.strip():
            raise ValueError("Song title cannot be empty")
        if not self.artist or not self.artist.strip():
            raise ValueError("Song artist cannot be empty")
        if self.duration_seconds is not None and self.duration_seconds <= 0:
            raise ValueError("Song duration must be positive")

    def __str__(self) -> str:
        """Human-readable string representation."""
        return f"{self.title} - {self.artist}"


@dataclass
class CardGrid:
    """Represents the 5x5 grid layout of a bingo card.

    The grid is stored as a list of lists (rows), with the center cell (2,2) as free space.
    24 songs are placed in the other positions.

    Attributes:
        songs: 5x5 grid of songs (None in center position for free space)
    """

    songs: list[list[Optional[Song]]] = field(default_factory=lambda: [[None] * 5 for _ in range(5)])

    def __post_init__(self):
        """Validate grid structure."""
        if len(self.songs) != 5:
            raise ValueError("Grid must have exactly 5 rows")
        for i, row in enumerate(self.songs):
            if len(row) != 5:
                raise ValueError(f"Row {i} must have exactly 5 columns")

        # Ensure center is free space
        self.songs[2][2] = None

    def set_song(self, row: int, col: int, song: Song) -> None:
        """Place a song at the specified position.

        Args:
            row: Row index (0-4)
            col: Column index (0-4)
            song: Song to place

        Raises:
            ValueError: If position is invalid or is the center free space
        """
        if not (0 <= row < 5 and 0 <= col < 5):
            raise ValueError(f"Invalid position: ({row}, {col})")
        if row == 2 and col == 2:
            raise ValueError("Cannot place song in center free space")
        if self.songs[row][col] is not None:
            raise ValueError(f"Position ({row}, {col}) already occupied")

        self.songs[row][col] = song

    def get_song(self, row: int, col: int) -> Optional[Song]:
        """Get the song at the specified position.

        Args:
            row: Row index (0-4)
            col: Column index (0-4)

        Returns:
            Song at position, or None if free space or empty
        """
        if not (0 <= row < 5 and 0 <= col < 5):
            raise ValueError(f"Invalid position: ({row}, {col})")
        return self.songs[row][col]

    def get_all_songs(self) -> list[Song]:
        """Get all songs on the card (excluding free space).

        Returns:
            List of 24 songs (or fewer if card not fully populated)
        """
        songs = []
        for row in range(5):
            for col in range(5):
                if row == 2 and col == 2:  # Skip free space
                    continue
                song = self.songs[row][col]
                if song is not None:
                    songs.append(song)
        return songs

    def is_complete(self) -> bool:
        """Check if all 24 song positions are filled.

        Returns:
            True if all positions (except free space) have songs
        """
        return len(self.get_all_songs()) == 24


@dataclass
class QRCodeData:
    """Data encoded in the QR code for card verification.

    Attributes:
        card_id: Unique identifier for this card
        game_id: Identifier for the game/playlist this card belongs to
        checksum: Hash for validation (prevents tampering)
    """

    card_id: UUID
    game_id: UUID
    checksum: str = ""

    def __post_init__(self):
        """Generate checksum if not provided."""
        if not self.checksum:
            # Simple checksum: combine IDs and hash
            import hashlib

            data = f"{self.card_id}:{self.game_id}"
            self.checksum = hashlib.sha256(data.encode()).hexdigest()[:16]

    def to_string(self) -> str:
        """Encode QR data as a compact string.

        Format: card_id|game_id|checksum

        Returns:
            String representation for QR code encoding
        """
        return f"{self.card_id}|{self.game_id}|{self.checksum}"

    @classmethod
    def from_string(cls, data: str) -> "QRCodeData":
        """Decode QR data from string.

        Args:
            data: String in format "card_id|game_id|checksum"

        Returns:
            QRCodeData instance

        Raises:
            ValueError: If string format is invalid
        """
        parts = data.split("|")
        if len(parts) != 3:
            raise ValueError(f"Invalid QR code format: expected 3 parts, got {len(parts)}")

        try:
            card_id = UUID(parts[0])
            game_id = UUID(parts[1])
            checksum = parts[2]
        except (ValueError, IndexError) as e:
            raise ValueError(f"Invalid QR code data: {e}")

        return cls(card_id=card_id, game_id=game_id, checksum=checksum)

    def is_valid(self) -> bool:
        """Verify the checksum is correct.

        Returns:
            True if checksum matches the calculated value
        """
        expected = QRCodeData(card_id=self.card_id, game_id=self.game_id)
        return self.checksum == expected.checksum


@dataclass
class BingoCard:
    """Represents a complete bingo card with songs and QR code.

    Attributes:
        card_id: Unique identifier for this card
        game_id: Identifier for the game/playlist
        grid: 5x5 grid of songs
        qr_data: QR code data for verification
        created_at: Timestamp when card was created
        metadata: Additional card metadata (e.g., branding info)
    """

    card_id: UUID = field(default_factory=uuid4)
    game_id: UUID = field(default_factory=uuid4)
    grid: CardGrid = field(default_factory=CardGrid)
    qr_data: Optional[QRCodeData] = None
    created_at: datetime = field(default_factory=datetime.now)
    metadata: dict = field(default_factory=dict)

    def __post_init__(self):
        """Initialize QR code data if not provided."""
        if self.qr_data is None:
            self.qr_data = QRCodeData(card_id=self.card_id, game_id=self.game_id)

    def add_song(self, row: int, col: int, song: Song) -> None:
        """Add a song to the card at the specified position.

        Args:
            row: Row index (0-4)
            col: Column index (0-4)
            song: Song to place
        """
        self.grid.set_song(row, col, song)

    def is_complete(self) -> bool:
        """Check if the card has all 24 songs placed.

        Returns:
            True if card is complete
        """
        return self.grid.is_complete()

    def get_songs(self) -> list[Song]:
        """Get all songs on this card.

        Returns:
            List of songs (up to 24)
        """
        return self.grid.get_all_songs()

    def validate(self) -> bool:
        """Validate the card structure and QR code.

        Returns:
            True if card is valid

        Raises:
            ValueError: If card structure is invalid
        """
        if not self.is_complete():
            raise ValueError("Card is incomplete: not all song positions filled")
        if self.qr_data is None:
            raise ValueError("Card has no QR code data")
        if not self.qr_data.is_valid():
            raise ValueError("Card QR code checksum is invalid")
        return True
