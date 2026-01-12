"""Tests for QR code generation."""

import io
import tempfile
from pathlib import Path
from uuid import uuid4

import pytest
from PIL import Image

from musicbingo_cards.models import BingoCard, QRCodeData, Song
from musicbingo_cards.qr_code import (
    QRCodeGenerator,
    decode_qr_string,
    verify_card_qr,
)


class TestQRCodeGenerator:
    """Tests for QRCodeGenerator class."""

    def test_create_generator(self):
        """Test creating a QR code generator."""
        generator = QRCodeGenerator()
        assert generator.version == 1
        assert generator.box_size == 10
        assert generator.border == 4

    def test_create_generator_with_custom_params(self):
        """Test creating generator with custom parameters."""
        generator = QRCodeGenerator(version=2, box_size=5, border=2)
        assert generator.version == 2
        assert generator.box_size == 5
        assert generator.border == 2

    def test_generate_qr_from_string(self):
        """Test generating QR code from string."""
        generator = QRCodeGenerator()
        img = generator.generate_qr_code("test data")

        assert isinstance(img, Image.Image)
        assert img.size[0] > 0
        assert img.size[1] > 0

    def test_generate_qr_from_qrcode_data(self):
        """Test generating QR code from QRCodeData object."""
        qr_data = QRCodeData(card_id=uuid4(), game_id=uuid4())
        generator = QRCodeGenerator()
        img = generator.generate_qr_code(qr_data)

        assert isinstance(img, Image.Image)

    def test_generate_qr_for_card(self):
        """Test generating QR code for a bingo card."""
        card = BingoCard()
        # Fill card with songs
        songs = [Song(title=f"Song {i}", artist=f"Artist {i}") for i in range(24)]
        idx = 0
        for row in range(5):
            for col in range(5):
                if row == 2 and col == 2:  # Skip center
                    continue
                card.add_song(row, col, songs[idx])
                idx += 1

        generator = QRCodeGenerator()
        img = generator.generate_qr_for_card(card)

        assert isinstance(img, Image.Image)

    def test_generate_qr_for_card_without_qr_data(self):
        """Test that generating QR for card without QR data raises error."""
        card = BingoCard()
        card.qr_data = None

        generator = QRCodeGenerator()
        with pytest.raises(ValueError, match="no QR code data"):
            generator.generate_qr_for_card(card)

    def test_qr_code_with_custom_colors(self):
        """Test generating QR code with custom colors."""
        generator = QRCodeGenerator()
        img = generator.generate_qr_code("test", fill_color="red", back_color="yellow")

        assert isinstance(img, Image.Image)

    def test_save_qr_code(self, tmp_path):
        """Test saving QR code to file."""
        generator = QRCodeGenerator()
        img = generator.generate_qr_code("test data")

        file_path = tmp_path / "qr_code.png"
        generator.save_qr_code(img, file_path)

        assert file_path.exists()
        assert file_path.stat().st_size > 0

        # Verify it's a valid image
        saved_img = Image.open(file_path)
        assert saved_img.size == img.size

    def test_save_qr_code_jpeg(self, tmp_path):
        """Test saving QR code as JPEG."""
        generator = QRCodeGenerator()
        img = generator.generate_qr_code("test data")

        file_path = tmp_path / "qr_code.jpg"
        # Convert to RGB for JPEG
        rgb_img = img.convert("RGB")
        generator.save_qr_code(rgb_img, file_path, format="JPEG")

        assert file_path.exists()

    def test_generate_and_save(self, tmp_path):
        """Test generating and saving QR code in one step."""
        card = BingoCard()
        songs = [Song(title=f"Song {i}", artist=f"Artist {i}") for i in range(24)]
        idx = 0
        for row in range(5):
            for col in range(5):
                if row == 2 and col == 2:
                    continue
                card.add_song(row, col, songs[idx])
                idx += 1

        generator = QRCodeGenerator()
        file_path = tmp_path / "card_qr.png"

        img = generator.generate_and_save(card, file_path)

        assert isinstance(img, Image.Image)
        assert file_path.exists()

    def test_get_qr_bytes(self):
        """Test getting QR code as bytes."""
        card = BingoCard()
        songs = [Song(title=f"Song {i}", artist=f"Artist {i}") for i in range(24)]
        idx = 0
        for row in range(5):
            for col in range(5):
                if row == 2 and col == 2:
                    continue
                card.add_song(row, col, songs[idx])
                idx += 1

        generator = QRCodeGenerator()
        qr_bytes = generator.get_qr_bytes(card)

        assert isinstance(qr_bytes, bytes)
        assert len(qr_bytes) > 0

        # Verify bytes can be loaded as image
        img = Image.open(io.BytesIO(qr_bytes))
        assert isinstance(img, Image.Image)

    def test_qr_bytes_different_formats(self):
        """Test getting QR bytes in different formats."""
        card = BingoCard()
        songs = [Song(title=f"Song {i}", artist=f"Artist {i}") for i in range(24)]
        idx = 0
        for row in range(5):
            for col in range(5):
                if row == 2 and col == 2:
                    continue
                card.add_song(row, col, songs[idx])
                idx += 1

        generator = QRCodeGenerator()

        png_bytes = generator.get_qr_bytes(card, format="PNG")
        assert len(png_bytes) > 0

        # For JPEG, need RGB conversion
        img = generator.generate_qr_for_card(card).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        jpeg_bytes = buf.getvalue()
        assert len(jpeg_bytes) > 0


class TestQRCodeDecoding:
    """Tests for QR code decoding and verification."""

    def test_decode_qr_string(self):
        """Test decoding QR string back to QRCodeData."""
        original = QRCodeData(card_id=uuid4(), game_id=uuid4())
        qr_string = original.to_string()

        decoded = decode_qr_string(qr_string)

        assert decoded.card_id == original.card_id
        assert decoded.game_id == original.game_id
        assert decoded.checksum == original.checksum

    def test_decode_invalid_qr_string(self):
        """Test that invalid QR string raises error."""
        with pytest.raises(ValueError):
            decode_qr_string("invalid|format")

    def test_verify_card_qr_valid(self):
        """Test verifying valid card QR code."""
        card = BingoCard()
        scanned_data = card.qr_data.to_string()

        assert verify_card_qr(card, scanned_data) is True

    def test_verify_card_qr_wrong_card_id(self):
        """Test that wrong card ID fails verification."""
        card = BingoCard()
        wrong_qr = QRCodeData(card_id=uuid4(), game_id=card.game_id)
        scanned_data = wrong_qr.to_string()

        assert verify_card_qr(card, scanned_data) is False

    def test_verify_card_qr_wrong_game_id(self):
        """Test that wrong game ID fails verification."""
        card = BingoCard()
        wrong_qr = QRCodeData(card_id=card.card_id, game_id=uuid4())
        scanned_data = wrong_qr.to_string()

        assert verify_card_qr(card, scanned_data) is False

    def test_verify_card_qr_tampered_checksum(self):
        """Test that tampered checksum fails verification."""
        card = BingoCard()
        # Create QR with wrong checksum
        tampered = QRCodeData(
            card_id=card.card_id,
            game_id=card.game_id,
            checksum="tampered123"
        )
        scanned_data = tampered.to_string()

        assert verify_card_qr(card, scanned_data) is False

    def test_verify_card_qr_invalid_format(self):
        """Test that invalid format fails verification."""
        card = BingoCard()
        assert verify_card_qr(card, "invalid data") is False

    def test_qr_roundtrip_with_actual_generation(self):
        """Test full roundtrip: generate QR, read it back, verify."""
        card = BingoCard()
        songs = [Song(title=f"Song {i}", artist=f"Artist {i}") for i in range(24)]
        idx = 0
        for row in range(5):
            for col in range(5):
                if row == 2 and col == 2:
                    continue
                card.add_song(row, col, songs[idx])
                idx += 1

        # Generate QR code
        generator = QRCodeGenerator()
        qr_string = card.qr_data.to_string()

        # Simulate scanning: decode the string
        scanned_qr = decode_qr_string(qr_string)

        # Verify all fields match
        assert scanned_qr.card_id == card.card_id
        assert scanned_qr.game_id == card.game_id
        assert scanned_qr.is_valid()

        # Verify using verification function
        assert verify_card_qr(card, qr_string) is True


class TestQRCodeIntegration:
    """Integration tests for QR codes with cards."""

    def test_multiple_cards_have_unique_qr_codes(self):
        """Test that each card gets a unique QR code."""
        game_id = uuid4()
        cards = [BingoCard(game_id=game_id) for _ in range(10)]

        qr_strings = [card.qr_data.to_string() for card in cards]

        # All QR strings should be unique
        assert len(qr_strings) == len(set(qr_strings))

    def test_cards_in_same_game_share_game_id(self):
        """Test that cards in same game have same game_id in QR."""
        game_id = uuid4()
        cards = [BingoCard(game_id=game_id) for _ in range(5)]

        for card in cards:
            assert card.qr_data.game_id == game_id

    def test_qr_code_size_scaling(self):
        """Test that QR code size can be controlled."""
        card = BingoCard()

        # Small QR code
        small_gen = QRCodeGenerator(box_size=5, border=2)
        small_img = small_gen.generate_qr_for_card(card)

        # Large QR code
        large_gen = QRCodeGenerator(box_size=15, border=4)
        large_img = large_gen.generate_qr_for_card(card)

        # Large should be bigger
        assert large_img.size[0] > small_img.size[0]
        assert large_img.size[1] > small_img.size[1]

    def test_batch_qr_generation(self):
        """Test generating QR codes for multiple cards."""
        cards = [BingoCard() for _ in range(20)]
        generator = QRCodeGenerator()

        qr_images = [generator.generate_qr_for_card(card) for card in cards]

        assert len(qr_images) == 20
        assert all(isinstance(img, Image.Image) for img in qr_images)
