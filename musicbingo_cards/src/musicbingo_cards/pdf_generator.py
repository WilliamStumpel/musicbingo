"""PDF generation for Music Bingo cards."""

import io
from pathlib import Path
from typing import List, Optional, Union

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER

from .models import BingoCard
from .qr_code import QRCodeGenerator


class PDFCardGenerator:
    """Generates printable PDF documents containing bingo cards."""

    def __init__(
        self,
        page_size=letter,
        margin: float = 0.5 * inch,
        qr_size: float = 1.5 * inch,
    ):
        """Initialize PDF card generator.

        Args:
            page_size: Page size tuple (width, height)
            margin: Page margin in points
            qr_size: QR code size in points
        """
        self.page_size = page_size
        self.margin = margin
        self.qr_size = qr_size
        self.qr_generator = QRCodeGenerator(box_size=10, border=2)
        self.styles = getSampleStyleSheet()

        # Create custom styles
        self.title_style = ParagraphStyle(
            'CardTitle',
            parent=self.styles['Heading1'],
            alignment=TA_CENTER,
            fontSize=16,
            spaceAfter=12,
        )
        self.cell_style = ParagraphStyle(
            'CellText',
            parent=self.styles['Normal'],
            alignment=TA_CENTER,
            fontSize=9,
            leading=11,
        )

    def generate_pdf(
        self,
        cards: List[BingoCard],
        output_path: Union[str, Path],
        title: Optional[str] = None,
    ) -> None:
        """Generate a PDF file with multiple bingo cards.

        Args:
            cards: List of BingoCard objects to include
            output_path: Path to save PDF file
            title: Optional title for the document
        """
        doc = SimpleDocTemplate(
            str(output_path),
            pagesize=self.page_size,
            leftMargin=self.margin,
            rightMargin=self.margin,
            topMargin=self.margin,
            bottomMargin=self.margin,
        )

        story = []

        for i, card in enumerate(cards):
            # Add card to story
            card_elements = self._create_card_elements(card, card_number=i + 1)
            story.extend(card_elements)

            # Add page break after each card (except last)
            if i < len(cards) - 1:
                from reportlab.platypus import PageBreak
                story.append(PageBreak())

        doc.build(story)

    def generate_pdf_bytes(
        self,
        cards: List[BingoCard],
        title: Optional[str] = None,
    ) -> bytes:
        """Generate PDF as bytes (for in-memory operations).

        Args:
            cards: List of BingoCard objects
            title: Optional title

        Returns:
            PDF file content as bytes
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=self.page_size,
            leftMargin=self.margin,
            rightMargin=self.margin,
            topMargin=self.margin,
            bottomMargin=self.margin,
        )

        story = []
        for i, card in enumerate(cards):
            card_elements = self._create_card_elements(card, card_number=i + 1)
            story.extend(card_elements)

            if i < len(cards) - 1:
                from reportlab.platypus import PageBreak
                story.append(PageBreak())

        doc.build(story)
        return buffer.getvalue()

    def _create_card_elements(self, card: BingoCard, card_number: int) -> List:
        """Create PDF elements for a single bingo card.

        Args:
            card: BingoCard to render
            card_number: Card number for display

        Returns:
            List of ReportLab flowable elements
        """
        elements = []

        # Card title/number
        title = Paragraph(
            f"<b>Music Bingo Card #{card_number}</b>",
            self.title_style
        )
        elements.append(title)
        elements.append(Spacer(1, 0.2 * inch))

        # Create 5x5 grid
        grid_data = []
        for row in range(5):
            row_data = []
            for col in range(5):
                if row == 2 and col == 2:
                    # Free space
                    cell_content = Paragraph(
                        "<b>FREE<br/>SPACE</b>",
                        self.cell_style
                    )
                else:
                    song = card.grid.get_song(row, col)
                    if song:
                        # Format: Title / Artist
                        text = f"<b>{song.title}</b><br/><i>{song.artist}</i>"
                        cell_content = Paragraph(text, self.cell_style)
                    else:
                        cell_content = Paragraph("", self.cell_style)
                row_data.append(cell_content)
            grid_data.append(row_data)

        # Calculate available space for grid
        page_width = self.page_size[0] - 2 * self.margin
        cell_size = min(page_width / 5, 1.4 * inch)  # Max 1.4 inches per cell

        # Create table
        table = Table(
            grid_data,
            colWidths=[cell_size] * 5,
            rowHeights=[cell_size] * 5,
        )

        # Style the table
        table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 2, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('BACKGROUND', (2, 2), (2, 2), colors.lightgrey),  # Free space
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))

        elements.append(table)
        elements.append(Spacer(1, 0.3 * inch))

        # Add QR code
        qr_bytes = self.qr_generator.get_qr_bytes(card, format="PNG")
        qr_buffer = io.BytesIO(qr_bytes)
        qr_image = Image(qr_buffer, width=self.qr_size, height=self.qr_size)
        elements.append(qr_image)

        # Card ID below QR code
        card_id_text = Paragraph(
            f"<i>Card ID: {str(card.card_id)[:8]}...</i>",
            self.styles['Normal']
        )
        elements.append(card_id_text)

        return elements

    def generate_single_card_pdf(
        self,
        card: BingoCard,
        output_path: Union[str, Path],
    ) -> None:
        """Generate a PDF with a single card.

        Args:
            card: BingoCard to render
            output_path: Path to save PDF
        """
        self.generate_pdf([card], output_path)
