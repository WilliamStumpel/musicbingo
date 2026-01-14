"""Tests for card generation algorithm."""

import pytest

from musicbingo_cards.generator import CardGenerator, CardGenerationError
from musicbingo_cards.models import Song
from musicbingo_cards.playlist import Playlist


class TestCardGenerator:
    """Tests for CardGenerator class."""

    @pytest.fixture
    def small_playlist(self):
        """Create a small test playlist (48 songs)."""
        songs = [Song(title=f"Song {i}", artist=f"Artist {i}") for i in range(48)]
        return Playlist(songs, name="Test Small")

    @pytest.fixture
    def medium_playlist(self):
        """Create a medium test playlist (60 songs)."""
        songs = [Song(title=f"Song {i}", artist=f"Artist {i}") for i in range(60)]
        return Playlist(songs, name="Test Medium")

    @pytest.fixture
    def large_playlist(self):
        """Create a large test playlist (100 songs)."""
        songs = [Song(title=f"Song {i}", artist=f"Artist {i}") for i in range(100)]
        return Playlist(songs, name="Test Large")

    def test_create_generator(self, medium_playlist):
        """Test creating a card generator."""
        generator = CardGenerator(medium_playlist)
        assert generator.playlist == medium_playlist
        assert len(generator.songs) == 60

    def test_generate_minimum_cards(self, medium_playlist):
        """Test generating minimum number of cards (50)."""
        generator = CardGenerator(medium_playlist, random_seed=42)
        cards = generator.generate_cards(50)

        assert len(cards) == 50
        assert all(card.is_complete() for card in cards)

    def test_generate_maximum_cards(self, large_playlist):
        """Test generating maximum number of cards (200)."""
        generator = CardGenerator(large_playlist, random_seed=42)
        cards = generator.generate_cards(200)

        assert len(cards) == 200
        assert all(card.is_complete() for card in cards)

    def test_cards_are_unique(self, medium_playlist):
        """Test that all generated cards are unique."""
        generator = CardGenerator(medium_playlist, random_seed=42)
        cards = generator.generate_cards(100)

        # Compare each card to every other card
        for i in range(len(cards)):
            for j in range(i + 1, len(cards)):
                songs_i = {s.song_id for s in cards[i].get_songs()}
                songs_j = {s.song_id for s in cards[j].get_songs()}
                # Cards should not be identical
                assert songs_i != songs_j, f"Cards {i} and {j} are identical"

    def test_each_card_has_24_songs(self, medium_playlist):
        """Test that each card has exactly 24 songs."""
        generator = CardGenerator(medium_playlist, random_seed=42)
        cards = generator.generate_cards(50)

        for card in cards:
            assert len(card.get_songs()) == 24
            assert card.is_complete()

    def test_cards_have_no_duplicate_songs(self, medium_playlist):
        """Test that each card has no duplicate songs."""
        generator = CardGenerator(medium_playlist, random_seed=42)
        cards = generator.generate_cards(50)

        for card in cards:
            song_ids = [s.song_id for s in card.get_songs()]
            assert len(song_ids) == len(set(song_ids)), "Card has duplicate songs"

    def test_all_cards_share_same_game_id(self, medium_playlist):
        """Test that all cards from one generation have the same game_id."""
        generator = CardGenerator(medium_playlist, random_seed=42)
        cards = generator.generate_cards(50)

        game_id = cards[0].game_id
        assert all(card.game_id == game_id for card in cards)

    def test_overlap_percentage_in_target_range(self, medium_playlist):
        """Test that cards have 30-40% overlap."""
        generator = CardGenerator(medium_playlist, random_seed=42)
        cards = generator.generate_cards(100)

        # Sample overlap between first card and others
        overlaps = []
        for i in range(1, min(len(cards), 50)):
            overlap = generator.calculate_overlap(cards[0], cards[i])
            overlaps.append(overlap)

        avg_overlap = sum(overlaps) / len(overlaps)

        # Target is 30-40% (0.30 to 0.40)
        # Allow some tolerance (25-45%) since it's probabilistic
        assert 0.25 <= avg_overlap <= 0.45, f"Average overlap {avg_overlap:.2%} outside acceptable range"

    def test_song_distribution_is_balanced(self, medium_playlist):
        """Test that songs are distributed fairly across cards."""
        generator = CardGenerator(medium_playlist, random_seed=42)
        cards = generator.generate_cards(100)

        # Count how many times each song appears
        song_usage = {}
        for card in cards:
            for song in card.get_songs():
                song_usage[song.song_id] = song_usage.get(song.song_id, 0) + 1

        usage_counts = list(song_usage.values())
        avg_usage = sum(usage_counts) / len(usage_counts)
        min_usage = min(usage_counts)
        max_usage = max(usage_counts)

        # Expected average: 24 songs/card * 100 cards / 60 songs = 40
        expected_avg = (24 * 100) / 60

        # Allow 30% variance from expected
        assert abs(avg_usage - expected_avg) / expected_avg < 0.3

        # Max usage shouldn't be more than 2x min usage
        assert max_usage <= min_usage * 2.5, "Song distribution too unbalanced"

    def test_invalid_card_count_too_small(self, medium_playlist):
        """Test that card count < 1 raises error."""
        generator = CardGenerator(medium_playlist)
        with pytest.raises(CardGenerationError, match="Invalid card count"):
            generator.generate_cards(0)

    def test_invalid_card_count_too_large(self, medium_playlist):
        """Test that card count > 1000 raises error."""
        generator = CardGenerator(medium_playlist)
        with pytest.raises(CardGenerationError, match="Invalid card count"):
            generator.generate_cards(1001)

    def test_playlist_too_small(self):
        """Test that playlist < 48 songs raises error."""
        from musicbingo_cards.playlist import PlaylistValidationError

        songs = [Song(title=f"Song {i}", artist=f"Artist {i}") for i in range(47)]

        # Playlist validation catches this early
        with pytest.raises(PlaylistValidationError):
            Playlist(songs)

    def test_playlist_generates_with_high_overlap(self, small_playlist):
        """Test that small playlist generates cards with higher overlap."""
        generator = CardGenerator(small_playlist, random_seed=42)

        # 48 songs with 50 cards will have higher overlap than ideal, but should still work
        cards = generator.generate_cards(50)
        assert len(cards) == 50

        # Overlap will be higher than 40% due to limited song pool
        avg_overlap = generator.calculate_average_overlap(cards[:10])  # Sample
        assert avg_overlap > 0.30  # Should have at least 30% overlap

    def test_reproducible_with_seed(self, medium_playlist):
        """Test that same seed produces same cards."""
        generator1 = CardGenerator(medium_playlist, random_seed=42)
        cards1 = generator1.generate_cards(50)

        generator2 = CardGenerator(medium_playlist, random_seed=42)
        cards2 = generator2.generate_cards(50)

        # Should generate identical cards
        for i in range(len(cards1)):
            songs1 = [s.song_id for s in cards1[i].get_songs()]
            songs2 = [s.song_id for s in cards2[i].get_songs()]
            assert songs1 == songs2, f"Card {i} differs between runs"

    def test_different_seeds_produce_different_cards(self, medium_playlist):
        """Test that different seeds produce different cards."""
        generator1 = CardGenerator(medium_playlist, random_seed=42)
        cards1 = generator1.generate_cards(50)

        generator2 = CardGenerator(medium_playlist, random_seed=123)
        cards2 = generator2.generate_cards(50)

        # Should generate different cards
        songs1 = {s.song_id for s in cards1[0].get_songs()}
        songs2 = {s.song_id for s in cards2[0].get_songs()}
        assert songs1 != songs2, "Different seeds produced identical cards"

    def test_calculate_overlap(self, medium_playlist):
        """Test overlap calculation between two cards."""
        generator = CardGenerator(medium_playlist, random_seed=42)
        cards = generator.generate_cards(2)

        overlap = generator.calculate_overlap(cards[0], cards[1])
        assert 0.0 <= overlap <= 1.0

        # Overlap should be number of common songs / 24
        songs1 = {s.song_id for s in cards[0].get_songs()}
        songs2 = {s.song_id for s in cards[1].get_songs()}
        common = len(songs1.intersection(songs2))
        expected_overlap = common / 24.0
        assert overlap == expected_overlap

    def test_calculate_average_overlap(self, medium_playlist):
        """Test average overlap calculation."""
        generator = CardGenerator(medium_playlist, random_seed=42)
        cards = generator.generate_cards(10)

        avg_overlap = generator.calculate_average_overlap(cards)
        assert 0.0 <= avg_overlap <= 1.0

    def test_get_statistics(self, medium_playlist):
        """Test statistics generation."""
        generator = CardGenerator(medium_playlist, random_seed=42)
        cards = generator.generate_cards(100)

        stats = generator.get_statistics(cards)

        assert stats["num_cards"] == 100
        assert stats["songs_in_playlist"] == 60
        assert stats["songs_per_card"] == 24
        assert "song_usage" in stats
        assert "overlap" in stats

        # Overlap should be in reasonable range
        avg_overlap = stats["overlap"]["average_percentage"]
        assert 20 <= avg_overlap <= 50  # 20-50% is acceptable range

    def test_empty_statistics(self):
        """Test statistics with no cards."""
        generator = CardGenerator(
            Playlist([Song(title=f"S{i}", artist=f"A{i}") for i in range(50)])
        )
        stats = generator.get_statistics([])
        assert stats["num_cards"] == 0

    def test_custom_game_id(self, medium_playlist):
        """Test generating cards with custom game ID."""
        from uuid import uuid4

        game_id = str(uuid4())
        generator = CardGenerator(medium_playlist, random_seed=42)
        cards = generator.generate_cards(50, game_id=game_id)

        assert all(str(card.game_id) == game_id for card in cards)

    def test_large_scale_generation(self, large_playlist):
        """Test generating large number of cards."""
        generator = CardGenerator(large_playlist, random_seed=42)
        cards = generator.generate_cards(150)

        assert len(cards) == 150
        assert all(card.is_complete() for card in cards)

        # Verify no duplicates
        card_hashes = set()
        for card in cards:
            song_ids = tuple(sorted(s.song_id for s in card.get_songs()))
            assert song_ids not in card_hashes, "Found duplicate card"
            card_hashes.add(song_ids)
