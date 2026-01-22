"""Game state management service."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from .models import CardData, GameState, GameStatus, PatternType, Song


class GameService:
    """Service for managing game state.

    Keeps active games in memory for fast access. Can be extended with
    database persistence layer.
    """

    def __init__(self):
        """Initialize game service with empty state."""
        self._games: dict[UUID, GameState] = {}

    def create_game(
        self,
        game_id: UUID,
        playlist: list[Song],
        pattern: PatternType = PatternType.FIVE_IN_A_ROW,
    ) -> GameState:
        """Create a new game session.

        Args:
            game_id: Unique identifier for the game
            playlist: List of songs in the game
            pattern: Winning pattern for this game

        Returns:
            Created GameState

        Raises:
            ValueError: If game_id already exists or playlist is invalid
        """
        if game_id in self._games:
            raise ValueError(f"Game {game_id} already exists")

        if len(playlist) < 24:
            raise ValueError(f"Playlist must have at least 24 songs, got {len(playlist)}")

        game = GameState(
            game_id=game_id,
            status=GameStatus.SETUP,
            playlist=playlist,
            current_pattern=pattern,
        )

        self._games[game_id] = game
        return game

    def get_game(self, game_id: UUID) -> Optional[GameState]:
        """Get game by ID.

        Args:
            game_id: Game identifier

        Returns:
            GameState if found, None otherwise
        """
        return self._games.get(game_id)

    def get_game_or_raise(self, game_id: UUID) -> GameState:
        """Get game by ID or raise error.

        Args:
            game_id: Game identifier

        Returns:
            GameState

        Raises:
            ValueError: If game not found
        """
        game = self.get_game(game_id)
        if game is None:
            raise ValueError(f"Game {game_id} not found")
        return game

    def start_game(self, game_id: UUID) -> GameState:
        """Mark game as active and ready to play.

        Args:
            game_id: Game identifier

        Returns:
            Updated GameState

        Raises:
            ValueError: If game not found or already started
        """
        game = self.get_game_or_raise(game_id)

        if game.status != GameStatus.SETUP:
            raise ValueError(f"Game {game_id} already started")

        if not game.cards:
            raise ValueError(f"Game {game_id} has no cards")

        game.status = GameStatus.ACTIVE
        return game

    def add_card(self, game_id: UUID, card: CardData) -> None:
        """Add a card to a game.

        Args:
            game_id: Game identifier
            card: Card data to add

        Raises:
            ValueError: If game not found
        """
        game = self.get_game_or_raise(game_id)
        game.add_card(card)

    def record_played_song(self, game_id: UUID, song_id: UUID) -> GameState:
        """Record a song as played in the game.

        Args:
            game_id: Game identifier
            song_id: Song identifier

        Returns:
            Updated GameState

        Raises:
            ValueError: If game not found or song not in playlist
        """
        game = self.get_game_or_raise(game_id)

        if game.status not in (GameStatus.ACTIVE, GameStatus.PAUSED):
            raise ValueError(f"Cannot play songs in game with status {game.status}")

        game.add_played_song(song_id)
        return game

    def verify_card(self, game_id: UUID, card_id: UUID) -> tuple[bool, Optional[PatternType], int, Optional[str]]:
        """Verify if a card is a winner.

        Args:
            game_id: Game identifier
            card_id: Card identifier

        Returns:
            Tuple of (is_winner, pattern_type, card_number, player_name)
            player_name is None if card is not registered

        Raises:
            ValueError: If game or card not found
        """
        game = self.get_game_or_raise(game_id)
        is_winner, pattern, card_number = game.verify_card(card_id)

        # Get player name if card is registered
        player_name = None
        if card_id in game.registered_cards:
            player_name = game.registered_cards[card_id].get("player_name")

        return (is_winner, pattern, card_number, player_name)

    def toggle_song_played(self, game_id: UUID, song_id: str, played: bool) -> GameState:
        """Mark a song as played or unplayed.

        Args:
            game_id: The game ID
            song_id: The song ID to toggle (as string, converted to UUID)
            played: True to mark as played, False to unmark

        Returns:
            Updated Game object

        Raises:
            ValueError: If game not found or invalid song_id
        """
        game = self.get_game_or_raise(game_id)

        # Convert string song_id to UUID
        try:
            song_uuid = UUID(song_id)
        except ValueError:
            raise ValueError(f"Invalid song_id format: {song_id}")

        if played:
            # Add to played songs if not already there
            if song_uuid not in game.played_songs:
                game.played_songs.append(song_uuid)
                # Check for new winners after adding a played song
                self.check_for_new_winners(game_id, song_uuid)
        else:
            # Remove from played songs if present
            if song_uuid in game.played_songs:
                game.played_songs.remove(song_uuid)

        game.updated_at = datetime.now()
        return game

    def set_pattern(self, game_id: UUID, pattern: PatternType) -> GameState:
        """Change the winning pattern for a game.

        Args:
            game_id: Game identifier
            pattern: New winning pattern

        Returns:
            Updated GameState

        Raises:
            ValueError: If game not found
        """
        game = self.get_game_or_raise(game_id)
        game.current_pattern = pattern
        return game

    def reset_round(self, game_id: UUID) -> GameState:
        """Reset played songs for a new round.

        Clears played_songs, revealed_songs, and detected_winners but keeps
        cards, pattern, and current_prize.

        Args:
            game_id: Game identifier

        Returns:
            Updated GameState

        Raises:
            ValueError: If game not found
        """
        game = self.get_game_or_raise(game_id)
        game.played_songs = []
        game.revealed_songs = []
        game.detected_winners = []  # Clear winners for new round
        game.updated_at = datetime.now()
        return game

    def reveal_song(self, game_id: UUID, song_id: str) -> GameState:
        """Mark a song as revealed (title can be shown on player view).

        Args:
            game_id: Game identifier
            song_id: Song identifier (as string, converted to UUID)

        Returns:
            Updated GameState

        Raises:
            ValueError: If game not found or invalid song_id
        """
        game = self.get_game_or_raise(game_id)

        try:
            song_uuid = UUID(song_id)
        except ValueError:
            raise ValueError(f"Invalid song_id format: {song_id}")

        if song_uuid not in game.revealed_songs:
            game.revealed_songs.append(song_uuid)
            game.updated_at = datetime.now()
        return game

    def pause_game(self, game_id: UUID) -> GameState:
        """Pause an active game.

        Args:
            game_id: Game identifier

        Returns:
            Updated GameState

        Raises:
            ValueError: If game not found or not active
        """
        game = self.get_game_or_raise(game_id)

        if game.status != GameStatus.ACTIVE:
            raise ValueError(f"Cannot pause game with status {game.status}")

        game.status = GameStatus.PAUSED
        return game

    def resume_game(self, game_id: UUID) -> GameState:
        """Resume a paused game.

        Args:
            game_id: Game identifier

        Returns:
            Updated GameState

        Raises:
            ValueError: If game not found or not paused
        """
        game = self.get_game_or_raise(game_id)

        if game.status != GameStatus.PAUSED:
            raise ValueError(f"Cannot resume game with status {game.status}")

        game.status = GameStatus.ACTIVE
        return game

    def complete_game(self, game_id: UUID) -> GameState:
        """Mark game as completed.

        Args:
            game_id: Game identifier

        Returns:
            Updated GameState

        Raises:
            ValueError: If game not found
        """
        game = self.get_game_or_raise(game_id)
        game.status = GameStatus.COMPLETED
        return game

    def list_games(self) -> list[GameState]:
        """Get all games.

        Returns:
            List of all games
        """
        return list(self._games.values())

    def delete_game(self, game_id: UUID) -> None:
        """Delete a game.

        Args:
            game_id: Game identifier

        Raises:
            ValueError: If game not found
        """
        if game_id not in self._games:
            raise ValueError(f"Game {game_id} not found")
        del self._games[game_id]

    def register_card(self, game_id: UUID, card_id: UUID, player_name: str) -> dict:
        """Register a card to a player.

        Args:
            game_id: Game identifier
            card_id: Card identifier
            player_name: Name of the player

        Returns:
            Dict with card_id, card_number, player_name, registered_at

        Raises:
            ValueError: If game or card not found
        """
        game = self.get_game_or_raise(game_id)

        # Validate card exists
        if card_id not in game.cards:
            raise ValueError(f"Card {card_id} not found in game")

        # Register the card
        registration = game.register_card(card_id, player_name)

        # Get card number
        card = game.cards[card_id]

        return {
            "card_id": card_id,
            "card_number": card.card_number,
            "player_name": registration["player_name"],
            "registered_at": registration["registered_at"],
        }

    def get_registered_cards(self, game_id: UUID) -> list[dict]:
        """Get all registered cards for a game.

        Args:
            game_id: Game identifier

        Returns:
            List of dicts with card_id, card_number, player_name, registered_at

        Raises:
            ValueError: If game not found
        """
        game = self.get_game_or_raise(game_id)

        registered = []
        for card_id, registration in game.registered_cards.items():
            card = game.cards[card_id]
            registered.append({
                "card_id": card_id,
                "card_number": card.card_number,
                "player_name": registration["player_name"],
                "registered_at": registration["registered_at"],
            })

        return registered

    def check_for_new_winners(self, game_id: UUID, triggering_song_id: UUID) -> list[dict]:
        """Check all registered cards for new winners.

        Args:
            game_id: Game identifier
            triggering_song_id: The song that was just played

        Returns:
            List of newly detected winners

        Raises:
            ValueError: If game not found
        """
        game = self.get_game_or_raise(game_id)

        new_winners = game.check_registered_cards_for_winners()

        # Add triggering song_id and store in game state
        for winner in new_winners:
            winner["song_id"] = triggering_song_id
            game.detected_winners.append(winner)

        return new_winners

    def get_card_statuses(self, game_id: UUID) -> dict:
        """Get status info for all registered cards.

        Args:
            game_id: Game identifier

        Returns:
            Dict with game_id, current_pattern, cards list, winners list

        Raises:
            ValueError: If game not found
        """
        game = self.get_game_or_raise(game_id)

        statuses = game.get_card_statuses()
        winners = [s for s in statuses if s["is_winner"]]

        return {
            "game_id": game_id,
            "current_pattern": game.current_pattern,
            "cards": statuses,
            "winners": winners,
        }

    def set_prize(self, game_id: UUID, prize: str) -> GameState:
        """Set the prize for the current game.

        Args:
            game_id: Game identifier
            prize: Prize text

        Returns:
            Updated GameState

        Raises:
            ValueError: If game not found
        """
        game = self.get_game_or_raise(game_id)
        game.current_prize = prize
        game.updated_at = datetime.now()
        return game


# Global service instance
_game_service: Optional[GameService] = None


def get_game_service() -> GameService:
    """Get the global game service instance.

    Returns:
        GameService singleton
    """
    global _game_service
    if _game_service is None:
        _game_service = GameService()
    return _game_service
