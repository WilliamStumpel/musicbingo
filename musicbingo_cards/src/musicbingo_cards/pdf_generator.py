"""PDF generation for Music Bingo cards."""

import io
import math
from pathlib import Path
from typing import List, Optional, Union

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
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
        venue_logo_path: Optional[Path] = None,
        dj_contact: Optional[str] = None,
    ):
        """Initialize PDF card generator.

        Args:
            page_size: Page size tuple (width, height)
            margin: Page margin in points
            qr_size: QR code size in points
            venue_logo_path: Path to venue logo image (PNG/JPG)
            dj_contact: DJ contact information text
        """
        self.page_size = page_size
        self.margin = margin
        self.qr_size = qr_size
        self.venue_logo_path = venue_logo_path
        self.dj_contact = dj_contact
        self.qr_generator = QRCodeGenerator(box_size=10, border=2)
        self.styles = getSampleStyleSheet()

        # Create custom styles for single-card layout
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

        # Create compact styles for 4-up layout
        self.mini_title_style = ParagraphStyle(
            'MiniCardTitle',
            parent=self.styles['Heading1'],
            alignment=TA_CENTER,
            fontSize=10,
            spaceAfter=4,
        )
        self.mini_cell_style = ParagraphStyle(
            'MiniCellText',
            parent=self.styles['Normal'],
            alignment=TA_CENTER,
            fontSize=7,
            leading=8,
        )

    def generate_pdf(
        self,
        cards: List[BingoCard],
        output_path: Union[str, Path],
        title: Optional[str] = None,
        layout: str = "single",
    ) -> None:
        """Generate a PDF file with multiple bingo cards.

        Args:
            cards: List of BingoCard objects to include
            output_path: Path to save PDF file
            title: Optional title for the document
            layout: "single" (1 card/page) or "4up" (4 cards/page)
        """
        if layout == "4up":
            self._generate_4up_pdf(cards, output_path)
            return

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

    def _generate_4up_pdf(
        self,
        cards: List[BingoCard],
        output_path: Union[str, Path],
    ) -> None:
        """Generate a PDF with 4 cards per page (2x2 grid).

        Layout math for 8.5x11 letter (612x792 points):
        - Usable area with 0.5" margins: 7.5" x 10" (540x720 points)
        - Card size: 3.5" x 4.5" (252x324 points) with 0.25" gutters between
        - Grid: 2 columns x 2 rows per page

        Args:
            cards: List of BingoCard objects
            output_path: Path to save PDF file
        """
        from reportlab.pdfgen import canvas

        output_path = Path(output_path)
        c = canvas.Canvas(str(output_path), pagesize=self.page_size)
        page_width, page_height = self.page_size

        # Layout constants for 4-up
        card_width = 3.5 * inch
        card_height = 4.5 * inch
        gutter = 0.25 * inch

        # Header space for branding
        header_height = 0.75 * inch if (self.venue_logo_path or self.dj_contact) else 0
        footer_height = 0.3 * inch if self.dj_contact else 0

        # Calculate card positions (2x2 grid centered)
        usable_height = page_height - 2 * self.margin - header_height - footer_height
        total_cards_width = 2 * card_width + gutter
        total_cards_height = 2 * card_height + gutter

        x_offset = (page_width - total_cards_width) / 2
        y_offset = self.margin + footer_height + (usable_height - total_cards_height) / 2

        # Card positions: [top-left, top-right, bottom-left, bottom-right]
        positions = [
            (x_offset, y_offset + card_height + gutter),  # Top-left
            (x_offset + card_width + gutter, y_offset + card_height + gutter),  # Top-right
            (x_offset, y_offset),  # Bottom-left
            (x_offset + card_width + gutter, y_offset),  # Bottom-right
        ]

        # Process cards in groups of 4
        num_pages = math.ceil(len(cards) / 4)
        for page_num in range(num_pages):
            # Add header/footer to each page
            self._draw_page_header(c, page_width, page_height, compact=True)
            self._draw_page_footer(c, page_width)

            # Draw up to 4 cards on this page
            start_idx = page_num * 4
            for i, pos_idx in enumerate(range(4)):
                card_idx = start_idx + i
                if card_idx >= len(cards):
                    break

                card = cards[card_idx]
                x, y = positions[pos_idx]
                self._draw_mini_card(c, card, x, y, card_width, card_height, card_idx + 1)

            # Add new page if not the last
            if page_num < num_pages - 1:
                c.showPage()

        c.save()

    def _draw_page_header(
        self,
        canvas,
        page_width: float,
        page_height: float,
        compact: bool = False,
    ) -> None:
        """Draw header with optional venue logo and DJ contact.

        Args:
            canvas: ReportLab canvas
            page_width: Page width in points
            page_height: Page height in points
            compact: Use compact sizing for 4-up layout
        """
        if not self.venue_logo_path and not self.dj_contact:
            return

        header_y = page_height - self.margin - (0.6 * inch if compact else 0.8 * inch)
        max_logo_height = 0.5 * inch if compact else 0.75 * inch

        # Draw venue logo if provided
        if self.venue_logo_path and self.venue_logo_path.exists():
            try:
                from PIL import Image as PILImage

                # Get image dimensions to maintain aspect ratio
                with PILImage.open(self.venue_logo_path) as img:
                    img_width, img_height = img.size
                    aspect_ratio = img_width / img_height

                    # Scale to max height while maintaining aspect ratio
                    logo_height = max_logo_height
                    logo_width = logo_height * aspect_ratio

                    # Cap width at 1.5 inches
                    if logo_width > 1.5 * inch:
                        logo_width = 1.5 * inch
                        logo_height = logo_width / aspect_ratio

                canvas.drawImage(
                    str(self.venue_logo_path),
                    self.margin,
                    header_y,
                    width=logo_width,
                    height=logo_height,
                )
            except Exception:
                pass  # Skip logo if there's an error

        # Draw DJ contact if provided
        if self.dj_contact:
            canvas.setFont("Helvetica", 9 if compact else 10)
            text_width = canvas.stringWidth(self.dj_contact, "Helvetica", 9 if compact else 10)
            canvas.drawString(
                page_width - self.margin - text_width,
                header_y + 0.2 * inch,
                self.dj_contact,
            )

    def _draw_page_footer(self, canvas, page_width: float) -> None:
        """Draw footer with branding text.

        Args:
            canvas: ReportLab canvas
            page_width: Page width in points
        """
        if not self.dj_contact:
            return

        footer_text = f"Music Bingo by {self.dj_contact}"
        canvas.setFont("Helvetica", 8)
        text_width = canvas.stringWidth(footer_text, "Helvetica", 8)
        canvas.drawString(
            (page_width - text_width) / 2,
            self.margin - 0.1 * inch,
            footer_text,
        )

    def _wrap_text(
        self,
        canvas,
        text: str,
        max_width: float,
        font_name: str,
        font_size: int,
    ) -> List[str]:
        """Word-wrap text to fit within a maximum width.

        Args:
            canvas: ReportLab canvas (for measuring text width)
            text: Text to wrap
            max_width: Maximum width in points
            font_name: Font name to use
            font_size: Font size in points

        Returns:
            List of lines that fit within max_width
        """
        words = text.split()
        if not words:
            return []

        lines = []
        current_line = ""

        for word in words:
            test_line = f"{current_line} {word}".strip()
            if canvas.stringWidth(test_line, font_name, font_size) <= max_width:
                current_line = test_line
            else:
                if current_line:
                    lines.append(current_line)
                # Check if the word itself is too long and needs character-level wrap
                if canvas.stringWidth(word, font_name, font_size) > max_width:
                    # Character-level wrapping for very long words
                    chars = ""
                    for char in word:
                        test_chars = chars + char
                        if canvas.stringWidth(test_chars, font_name, font_size) <= max_width:
                            chars = test_chars
                        else:
                            if chars:
                                lines.append(chars)
                            chars = char
                    current_line = chars
                else:
                    current_line = word

        if current_line:
            lines.append(current_line)

        return lines

    def _fit_text_in_cell(
        self,
        canvas,
        text: str,
        max_width: float,
        max_height: float,
        font_name: str,
        base_size: int,
        min_size: int = 4,
        max_lines: int = 2,
    ) -> tuple:
        """Fit text within a cell by wrapping and shrinking font if needed.

        Args:
            canvas: ReportLab canvas
            text: Text to fit
            max_width: Maximum width in points
            max_height: Maximum height in points
            font_name: Font name to use
            base_size: Starting font size
            min_size: Minimum font size to try
            max_lines: Maximum number of lines allowed

        Returns:
            Tuple of (lines_list, final_font_size)
        """
        for font_size in range(base_size, min_size - 1, -1):
            lines = self._wrap_text(canvas, text, max_width, font_name, font_size)
            line_height = font_size * 1.2
            total_height = len(lines) * line_height

            if total_height <= max_height and len(lines) <= max_lines:
                return lines, font_size

        # If still doesn't fit at min size, truncate to max_lines
        lines = self._wrap_text(canvas, text, max_width, font_name, min_size)
        if len(lines) > max_lines:
            lines = lines[:max_lines]
            # Add ellipsis to last line if truncated
            if lines:
                last_line = lines[-1]
                while canvas.stringWidth(last_line + "...", font_name, min_size) > max_width and len(last_line) > 1:
                    last_line = last_line[:-1]
                lines[-1] = last_line + "..."

        return lines, min_size

    def _draw_mini_card(
        self,
        canvas,
        card: BingoCard,
        x: float,
        y: float,
        width: float,
        height: float,
        card_number: int,
    ) -> None:
        """Draw a compact bingo card for 4-up layout.

        Args:
            canvas: ReportLab canvas
            card: BingoCard to render
            x: X position of card (lower-left)
            y: Y position of card (lower-left)
            width: Card width in points
            height: Card height in points
            card_number: Card number for display
        """
        # Cell sizing for 5x5 grid
        cell_size = 0.6 * inch  # ~43 points
        grid_size = cell_size * 5  # ~3 inches
        qr_size = 0.6 * inch  # ~43 points (reduced for compact layout)

        # Calculate positions within card area
        card_center_x = x + width / 2
        grid_x = card_center_x - grid_size / 2
        title_y = y + height - 0.3 * inch
        grid_y = title_y - 0.3 * inch - grid_size
        qr_y = grid_y - 0.15 * inch - qr_size

        # Draw card title
        canvas.setFont("Helvetica-Bold", 10)
        title_text = f"Music Bingo #{card_number}"
        title_width = canvas.stringWidth(title_text, "Helvetica-Bold", 10)
        canvas.drawString(card_center_x - title_width / 2, title_y, title_text)

        # Draw 5x5 grid
        canvas.setStrokeColor(colors.black)
        canvas.setLineWidth(1)

        # Cell content sizing
        cell_padding = 2  # points of padding inside cell
        usable_width = cell_size - 2 * cell_padding
        title_area_height = 20  # points for title (top half)
        artist_area_height = 18  # points for artist (bottom half)

        for row in range(5):
            for col in range(5):
                cell_x = grid_x + col * cell_size
                cell_y = grid_y + (4 - row) * cell_size  # Flip rows (0 at top)

                # Draw cell border
                canvas.rect(cell_x, cell_y, cell_size, cell_size)

                # Fill free space
                if row == 2 and col == 2:
                    canvas.setFillColor(colors.lightgrey)
                    canvas.rect(cell_x, cell_y, cell_size, cell_size, fill=1)
                    canvas.setFillColor(colors.black)
                    canvas.setFont("Helvetica-Bold", 6)
                    canvas.drawCentredString(
                        cell_x + cell_size / 2,
                        cell_y + cell_size / 2 + 3,
                        "FREE"
                    )
                    canvas.drawCentredString(
                        cell_x + cell_size / 2,
                        cell_y + cell_size / 2 - 5,
                        "SPACE"
                    )
                else:
                    # Draw song info with word wrapping
                    song = card.grid.get_song(row, col)
                    if song:
                        canvas.setFillColor(colors.black)

                        # Fit title with word wrapping and dynamic sizing
                        title_lines, title_font = self._fit_text_in_cell(
                            canvas, song.title, usable_width, title_area_height,
                            "Helvetica-Bold", base_size=6, min_size=4, max_lines=2
                        )

                        # Fit artist with word wrapping and dynamic sizing
                        artist_lines, artist_font = self._fit_text_in_cell(
                            canvas, song.artist, usable_width, artist_area_height,
                            "Helvetica", base_size=5, min_size=4, max_lines=2
                        )

                        # Calculate vertical positions
                        cell_center_x = cell_x + cell_size / 2
                        cell_center_y = cell_y + cell_size / 2

                        # Draw title lines (centered in top half of cell)
                        title_line_height = title_font * 1.2
                        title_total_height = len(title_lines) * title_line_height
                        title_start_y = cell_center_y + 2 + (title_area_height - title_total_height) / 2 + title_total_height - title_font

                        canvas.setFont("Helvetica-Bold", title_font)
                        for i, line in enumerate(title_lines):
                            canvas.drawCentredString(
                                cell_center_x,
                                title_start_y - i * title_line_height,
                                line
                            )

                        # Draw artist lines (centered in bottom half of cell)
                        artist_line_height = artist_font * 1.2
                        artist_total_height = len(artist_lines) * artist_line_height
                        artist_start_y = cell_center_y - 2 - (artist_area_height - artist_total_height) / 2 - artist_font

                        canvas.setFont("Helvetica", artist_font)
                        for i, line in enumerate(artist_lines):
                            canvas.drawCentredString(
                                cell_center_x,
                                artist_start_y - i * artist_line_height,
                                line
                            )

        # Draw QR code
        qr_bytes = self.qr_generator.get_qr_bytes(card, format="PNG")
        qr_buffer = io.BytesIO(qr_bytes)
        from reportlab.lib.utils import ImageReader
        qr_image = ImageReader(qr_buffer)
        qr_x = card_center_x - qr_size / 2
        canvas.drawImage(
            qr_image,
            qr_x,
            qr_y,
            width=qr_size,
            height=qr_size,
        )

        # Draw card ID below QR code
        canvas.setFont("Helvetica", 6)
        card_id_text = f"Card ID: {str(card.card_id)[:8]}..."
        id_width = canvas.stringWidth(card_id_text, "Helvetica", 6)
        canvas.drawString(card_center_x - id_width / 2, qr_y - 10, card_id_text)
