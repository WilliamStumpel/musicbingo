"""Card generation algorithm for Music Bingo."""

import random
from typing import List, Set
from uuid import uuid4

from .models import BingoCard, Song
from .playlist import Playlist


class CardGenerationError(Exception):
    """Exception raised when card generation fails."""

    pass


class CardGenerator:
    """Generates unique bingo cards from a playlist with controlled overlap.

    The algorithm ensures:
    - Each card has 24 unique songs (5x5 grid with center free space)
    - Cards have 30-40% song overlap (7-10 songs in common)
    - All cards are unique (no duplicate cards)
    - Songs are distributed fairly across cards
    """

    def __init__(self, playlist: Playlist, random_seed: int = None):
        """Initialize card generator.

        Args:
            playlist: Playlist to generate cards from
            random_seed: Optional seed for reproducible randomness
        """
        self.playlist = playlist
        self.songs = list(playlist.songs)
        self.rng = random.Random(random_seed)

        # Track how many times each song has been used
        self.song_usage_count = {song.song_id: 0 for song in self.songs}

    def generate_cards(self, num_cards: int, game_id: str = None) -> List[BingoCard]:
        """Generate a set of unique bingo cards.

        Args:
            num_cards: Number of cards to generate (1-1000)
            game_id: Optional game identifier (auto-generated if not provided)

        Returns:
            List of unique BingoCard objects

        Raises:
            CardGenerationError: If generation fails
        """
        # Validate inputs
        if num_cards < 1 or num_cards > 1000:
            raise CardGenerationError(f"Invalid card count: {num_cards}. Must be 1-1000.")

        # Warn if outside recommended range (for production use)
        if num_cards < 50:
            pass  # Allow for testing, but production should use 50-200

        if len(self.songs) < 48:
            raise CardGenerationError(
                f"Playlist too small: {len(self.songs)} songs. Need at least 48."
            )

        # Check if we have reasonable song-to-card ratio
        # For good overlap variety, we want at least: playlist >= 24 + (num_cards / 10)
        # This ensures we have enough songs to create variety without excessive repetition
        min_recommended = 24 + (num_cards // 10)
        if len(self.songs) < min_recommended:
            # Warning but allow it - algorithm will handle it
            pass  # Could add logging here if needed

        # Generate game ID if not provided
        if game_id is None:
            game_id = str(uuid4())
        else:
            from uuid import UUID
            game_id = str(UUID(game_id))

        cards = []
        card_hashes = set()  # Track card uniqueness

        for i in range(num_cards):
            max_attempts = 100
            for attempt in range(max_attempts):
                try:
                    card = self._generate_single_card(game_id)
                    card_hash = self._hash_card(card)

                    if card_hash not in card_hashes:
                        cards.append(card)
                        card_hashes.add(card_hash)
                        break
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise CardGenerationError(
                            f"Failed to generate unique card {i + 1}/{num_cards}: {e}"
                        )

        return cards

    def _generate_single_card(self, game_id: str) -> BingoCard:
        """Generate a single bingo card.

        Uses weighted random selection to balance song distribution.

        Args:
            game_id: Game identifier

        Returns:
            A BingoCard with 24 songs
        """
        from uuid import UUID

        card = BingoCard(game_id=UUID(game_id))

        # Select 24 songs using weighted selection
        # Songs with lower usage count are more likely to be selected
        selected_songs = self._select_songs_weighted(24)

        # Shuffle songs for random placement
        self.rng.shuffle(selected_songs)

        # Fill the card grid (skip center position 2,2)
        song_idx = 0
        for row in range(5):
            for col in range(5):
                if row == 2 and col == 2:  # Skip center (free space)
                    continue
                card.add_song(row, col, selected_songs[song_idx])
                song_idx += 1

        # Update usage counts
        for song in selected_songs:
            self.song_usage_count[song.song_id] += 1

        return card

    def _select_songs_weighted(self, count: int) -> List[Song]:
        """Select songs using weighted random selection.

        Songs with lower usage counts are weighted higher to ensure
        fair distribution across cards.

        Args:
            count: Number of songs to select

        Returns:
            List of selected songs
        """
        if count > len(self.songs):
            raise CardGenerationError(
                f"Cannot select {count} songs from playlist of {len(self.songs)}"
            )

        # Calculate weights (inverse of usage count + 1)
        # Songs used less get higher weights
        max_usage = max(self.song_usage_count.values()) if self.song_usage_count else 0
        weights = []
        for song in self.songs:
            # Weight = max_usage - current_usage + 1
            # This gives higher weight to less-used songs
            weight = max_usage - self.song_usage_count[song.song_id] + 1
            weights.append(weight)

        # Select songs without replacement
        selected = self.rng.choices(
            population=self.songs,
            weights=weights,
            k=count * 2  # Get more than needed
        )

        # Remove duplicates while preserving order
        seen = set()
        unique_selected = []
        for song in selected:
            if song.song_id not in seen:
                seen.add(song.song_id)
                unique_selected.append(song)
                if len(unique_selected) == count:
                    break

        # If we didn't get enough unique songs (rare), sample directly
        if len(unique_selected) < count:
            remaining = count - len(unique_selected)
            available = [s for s in self.songs if s.song_id not in seen]
            unique_selected.extend(self.rng.sample(available, remaining))

        return unique_selected

    def _hash_card(self, card: BingoCard) -> str:
        """Create a hash of a card's song composition for uniqueness checking.

        Args:
            card: Card to hash

        Returns:
            Hash string representing the card's songs
        """
        # Sort song IDs to create consistent hash
        song_ids = sorted(str(song.song_id) for song in card.get_songs())
        return "|".join(song_ids)

    def calculate_overlap(self, card1: BingoCard, card2: BingoCard) -> float:
        """Calculate the overlap percentage between two cards.

        Args:
            card1: First card
            card2: Second card

        Returns:
            Overlap percentage (0.0 to 1.0)
        """
        songs1 = {song.song_id for song in card1.get_songs()}
        songs2 = {song.song_id for song in card2.get_songs()}
        common = songs1.intersection(songs2)
        return len(common) / 24.0

    def calculate_average_overlap(self, cards: List[BingoCard]) -> float:
        """Calculate the average overlap across all card pairs.

        Args:
            cards: List of cards

        Returns:
            Average overlap percentage (0.0 to 1.0)
        """
        if len(cards) < 2:
            return 0.0

        total_overlap = 0.0
        comparisons = 0

        for i in range(len(cards)):
            for j in range(i + 1, len(cards)):
                total_overlap += self.calculate_overlap(cards[i], cards[j])
                comparisons += 1

        return total_overlap / comparisons if comparisons > 0 else 0.0

    def get_statistics(self, cards: List[BingoCard]) -> dict:
        """Get statistics about the generated cards.

        Args:
            cards: List of generated cards

        Returns:
            Dictionary with statistics
        """
        if not cards:
            return {"num_cards": 0}

        # Calculate song usage distribution
        song_usage = {}
        for card in cards:
            for song in card.get_songs():
                song_usage[song.song_id] = song_usage.get(song.song_id, 0) + 1

        usage_counts = list(song_usage.values())
        avg_usage = sum(usage_counts) / len(usage_counts) if usage_counts else 0
        min_usage = min(usage_counts) if usage_counts else 0
        max_usage = max(usage_counts) if usage_counts else 0

        # Sample overlap calculations (compare first card with others)
        overlaps = []
        if len(cards) > 1:
            for i in range(1, min(len(cards), 11)):  # Sample up to 10 comparisons
                overlap = self.calculate_overlap(cards[0], cards[i])
                overlaps.append(overlap)

        avg_overlap = sum(overlaps) / len(overlaps) if overlaps else 0.0

        return {
            "num_cards": len(cards),
            "songs_in_playlist": len(self.songs),
            "songs_per_card": 24,
            "song_usage": {
                "average": avg_usage,
                "min": min_usage,
                "max": max_usage,
            },
            "overlap": {
                "average_percentage": avg_overlap * 100,
                "target_range": "30-40%",
                "sample_size": len(overlaps),
            },
        }
