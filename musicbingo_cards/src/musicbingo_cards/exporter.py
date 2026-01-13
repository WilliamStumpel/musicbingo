"""Export card data for API integration."""

import json
from pathlib import Path
from typing import List, Union

from .models import BingoCard


class CardExporter:
    """Export generated cards to various formats for API integration."""

    @staticmethod
    def to_json_dict(cards: List[BingoCard]) -> dict:
        """Convert cards to JSON-serializable dictionary.

        Format matches API CardData schema:
        {
            "game_id": "uuid",
            "cards": [
                {
                    "card_id": "uuid",
                    "card_number": 1,
                    "song_positions": {
                        "song_uuid": [row, col],
                        ...
                    }
                }
            ]
        }

        Args:
            cards: List of BingoCard objects

        Returns:
            Dictionary ready for JSON serialization
        """
        if not cards:
            raise ValueError("Cannot export empty card list")

        # All cards should have the same game_id
        game_id = str(cards[0].game_id)

        card_data = []
        for idx, card in enumerate(cards):
            # Build song_positions map
            song_positions = {}
            for row in range(5):
                for col in range(5):
                    if row == 2 and col == 2:  # Skip center free space
                        continue
                    song = card.grid.get_song(row, col)
                    if song:
                        song_positions[str(song.song_id)] = [row, col]

            card_data.append({
                "card_id": str(card.card_id),
                "card_number": idx + 1,  # 1-indexed card numbers
                "song_positions": song_positions
            })

        return {
            "game_id": game_id,
            "cards": card_data
        }

    @staticmethod
    def to_json_string(cards: List[BingoCard], indent: int = 2) -> str:
        """Convert cards to JSON string.

        Args:
            cards: List of BingoCard objects
            indent: JSON indentation level

        Returns:
            JSON string
        """
        data = CardExporter.to_json_dict(cards)
        return json.dumps(data, indent=indent)

    @staticmethod
    def save_json(cards: List[BingoCard], file_path: Union[str, Path], indent: int = 2) -> None:
        """Save cards to JSON file.

        Args:
            cards: List of BingoCard objects
            file_path: Path to output file
            indent: JSON indentation level
        """
        data = CardExporter.to_json_dict(cards)

        file_path = Path(file_path)
        file_path.parent.mkdir(parents=True, exist_ok=True)

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=indent)

    @staticmethod
    def get_summary(cards: List[BingoCard]) -> dict:
        """Get summary statistics about exported cards.

        Args:
            cards: List of BingoCard objects

        Returns:
            Dictionary with summary info
        """
        if not cards:
            return {"card_count": 0}

        return {
            "card_count": len(cards),
            "game_id": str(cards[0].game_id),
            "card_ids": [str(card.card_id) for card in cards],
            "songs_per_card": 24,
        }
