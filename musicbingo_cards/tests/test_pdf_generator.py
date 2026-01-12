"""Tests for PDF generation."""

import io
from pathlib import Path

import pytest
from pypdf import PdfReader

from musicbingo_cards.generator import CardGenerator
from musicbingo_cards.models import BingoCard, Song
from musicbingo_cards.pdf_generator import PDFCardGenerator
from musicbingo_cards.playlist import Playlist


class TestPDFCardGenerator:
    """Tests for PDFCardGenerator class."""

    @pytest.fixture
    def sample_card(self):
        """Create a sample bingo card with songs."""
        card = BingoCard()
        songs = [Song(title=f"Song {i}", artist=f"Artist {i}") for i in range(24)]
        idx = 0
        for row in range(5):
            for col in range(5):
                if row == 2 and col == 2:  # Skip center
                    continue
                card.add_song(row, col, songs[idx])
                idx += 1
        return card

    @pytest.fixture
    def sample_cards(self):
        """Create multiple sample bingo cards."""
        cards = []
        for card_num in range(5):
            card = BingoCard()
            songs = [
                Song(title=f"Song {i}-{card_num}", artist=f"Artist {i}-{card_num}")
                for i in range(24)
            ]
            idx = 0
            for row in range(5):
                for col in range(5):
                    if row == 2 and col == 2:
                        continue
                    card.add_song(row, col, songs[idx])
                    idx += 1
            cards.append(card)
        return cards

    def test_create_pdf_generator(self):
        """Test creating a PDF generator."""
        generator = PDFCardGenerator()
        assert generator is not None
        assert generator.page_size is not None

    def test_generate_single_card_pdf(self, sample_card, tmp_path):
        """Test generating PDF with single card."""
        generator = PDFCardGenerator()
        output_file = tmp_path / "single_card.pdf"

        generator.generate_single_card_pdf(sample_card, output_file)

        assert output_file.exists()
        assert output_file.stat().st_size > 0

    def test_generate_multiple_cards_pdf(self, sample_cards, tmp_path):
        """Test generating PDF with multiple cards."""
        generator = PDFCardGenerator()
        output_file = tmp_path / "multiple_cards.pdf"

        generator.generate_pdf(sample_cards, output_file)

        assert output_file.exists()
        assert output_file.stat().st_size > 0

    def test_pdf_is_valid(self, sample_card, tmp_path):
        """Test that generated PDF is valid and readable."""
        generator = PDFCardGenerator()
        output_file = tmp_path / "valid_test.pdf"

        generator.generate_single_card_pdf(sample_card, output_file)

        # Try to read the PDF
        reader = PdfReader(output_file)
        assert len(reader.pages) == 1

    def test_multiple_cards_have_multiple_pages(self, sample_cards, tmp_path):
        """Test that multiple cards create multiple pages."""
        generator = PDFCardGenerator()
        output_file = tmp_path / "multi_page.pdf"

        generator.generate_pdf(sample_cards, output_file)

        reader = PdfReader(output_file)
        assert len(reader.pages) == len(sample_cards)

    def test_generate_pdf_bytes(self, sample_card):
        """Test generating PDF as bytes."""
        generator = PDFCardGenerator()
        pdf_bytes = generator.generate_pdf_bytes([sample_card])

        assert isinstance(pdf_bytes, bytes)
        assert len(pdf_bytes) > 0

        # Verify it's a valid PDF
        reader = PdfReader(io.BytesIO(pdf_bytes))
        assert len(reader.pages) == 1

    def test_pdf_bytes_multiple_cards(self, sample_cards):
        """Test generating multi-card PDF as bytes."""
        generator = PDFCardGenerator()
        pdf_bytes = generator.generate_pdf_bytes(sample_cards)

        reader = PdfReader(io.BytesIO(pdf_bytes))
        assert len(reader.pages) == len(sample_cards)

    def test_pdf_contains_text(self, sample_card, tmp_path):
        """Test that PDF contains expected text."""
        generator = PDFCardGenerator()
        output_file = tmp_path / "text_test.pdf"

        generator.generate_single_card_pdf(sample_card, output_file)

        reader = PdfReader(output_file)
        page = reader.pages[0]
        text = page.extract_text()

        # Should contain card title
        assert "Music Bingo Card" in text or "Card" in text
        # Should contain "FREE" for free space
        assert "FREE" in text

    def test_custom_page_size(self, sample_card, tmp_path):
        """Test PDF generation with custom page size."""
        from reportlab.lib.pagesizes import A4

        generator = PDFCardGenerator(page_size=A4)
        output_file = tmp_path / "a4_card.pdf"

        generator.generate_single_card_pdf(sample_card, output_file)

        assert output_file.exists()

    def test_custom_qr_size(self, sample_card, tmp_path):
        """Test PDF generation with custom QR code size."""
        from reportlab.lib.units import inch

        generator = PDFCardGenerator(qr_size=2.0 * inch)
        output_file = tmp_path / "large_qr.pdf"

        generator.generate_single_card_pdf(sample_card, output_file)

        assert output_file.exists()

    def test_empty_card_list(self, tmp_path):
        """Test that empty card list creates empty PDF."""
        generator = PDFCardGenerator()
        output_file = tmp_path / "empty.pdf"

        generator.generate_pdf([], output_file)

        # Should create file but with no pages
        assert output_file.exists()


class TestPDFIntegration:
    """Integration tests for PDF generation with real cards."""

    @pytest.fixture
    def generated_cards(self):
        """Generate cards using the card generator."""
        songs = [Song(title=f"Song {i}", artist=f"Artist {i}") for i in range(60)]
        playlist = Playlist(songs, name="Test Playlist")
        generator = CardGenerator(playlist, random_seed=42)
        return generator.generate_cards(50)

    def test_pdf_from_generated_cards(self, generated_cards, tmp_path):
        """Test creating PDF from cards generated by CardGenerator."""
        pdf_gen = PDFCardGenerator()
        output_file = tmp_path / "generated_cards.pdf"

        pdf_gen.generate_pdf(generated_cards, output_file)

        assert output_file.exists()

        reader = PdfReader(output_file)
        assert len(reader.pages) == 50

    def test_all_cards_have_qr_codes(self, generated_cards):
        """Test that all generated cards have QR codes."""
        for card in generated_cards:
            assert card.qr_data is not None
            assert card.qr_data.is_valid()

    def test_pdf_generation_batch(self, generated_cards, tmp_path):
        """Test generating multiple PDFs in batch."""
        pdf_gen = PDFCardGenerator()

        # Generate 5 PDFs with 10 cards each
        for batch in range(5):
            start = batch * 10
            end = start + 10
            batch_cards = generated_cards[start:end]

            output_file = tmp_path / f"batch_{batch + 1}.pdf"
            pdf_gen.generate_pdf(batch_cards, output_file)

            assert output_file.exists()
            reader = PdfReader(output_file)
            assert len(reader.pages) == 10

    def test_pdf_file_size_reasonable(self, generated_cards, tmp_path):
        """Test that PDF file size is reasonable."""
        pdf_gen = PDFCardGenerator()
        output_file = tmp_path / "size_test.pdf"

        # 50 cards should be less than 10MB
        pdf_gen.generate_pdf(generated_cards, output_file)

        file_size = output_file.stat().st_size
        assert file_size < 10 * 1024 * 1024  # Less than 10MB

    def test_pdf_with_long_song_titles(self, tmp_path):
        """Test PDF handles long song titles gracefully."""
        card = BingoCard()
        songs = [
            Song(
                title=f"Very Long Song Title That Goes On And On {i}",
                artist=f"Artist With A Really Long Name {i}"
            )
            for i in range(24)
        ]
        idx = 0
        for row in range(5):
            for col in range(5):
                if row == 2 and col == 2:
                    continue
                card.add_song(row, col, songs[idx])
                idx += 1

        pdf_gen = PDFCardGenerator()
        output_file = tmp_path / "long_titles.pdf"

        pdf_gen.generate_pdf([card], output_file)

        assert output_file.exists()

    def test_pdf_with_special_characters(self, tmp_path):
        """Test PDF handles special characters in song titles."""
        card = BingoCard()
        songs = [
            Song(title=f"Song & Title's #{{i}}", artist=f"Artíst Naïve {i}")
            for i in range(24)
        ]
        idx = 0
        for row in range(5):
            for col in range(5):
                if row == 2 and col == 2:
                    continue
                card.add_song(row, col, songs[idx])
                idx += 1

        pdf_gen = PDFCardGenerator()
        output_file = tmp_path / "special_chars.pdf"

        # Should not raise an error
        pdf_gen.generate_pdf([card], output_file)

        assert output_file.exists()
