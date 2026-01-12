"""QR code generation for Music Bingo cards."""

import io
from pathlib import Path
from typing import Optional, Union

import qrcode
from PIL import Image

from .models import BingoCard, QRCodeData


class QRCodeGenerator:
    """Generates QR code images for bingo cards."""

    def __init__(
        self,
        version: int = 1,
        error_correction: int = qrcode.constants.ERROR_CORRECT_M,
        box_size: int = 10,
        border: int = 4,
    ):
        """Initialize QR code generator.

        Args:
            version: QR code version (1-40), controls size. None = auto
            error_correction: Error correction level (L, M, Q, H)
            box_size: Size of each box in pixels
            border: Border size in boxes
        """
        self.version = version
        self.error_correction = error_correction
        self.box_size = box_size
        self.border = border

    def generate_qr_code(
        self,
        data: Union[str, QRCodeData],
        fill_color: str = "black",
        back_color: str = "white",
    ) -> Image.Image:
        """Generate a QR code image.

        Args:
            data: String data or QRCodeData object to encode
            fill_color: QR code foreground color
            back_color: QR code background color

        Returns:
            PIL Image object containing the QR code
        """
        # Convert QRCodeData to string if needed
        if isinstance(data, QRCodeData):
            qr_string = data.to_string()
        else:
            qr_string = str(data)

        # Create QR code
        qr = qrcode.QRCode(
            version=self.version,
            error_correction=self.error_correction,
            box_size=self.box_size,
            border=self.border,
        )
        qr.add_data(qr_string)
        qr.make(fit=True)

        # Generate image
        img = qr.make_image(fill_color=fill_color, back_color=back_color)

        # Convert to PIL Image for consistency
        if hasattr(img, 'get_image'):
            return img.get_image()
        # qrcode returns a PilImage, which has _img attribute
        if hasattr(img, '_img'):
            return img._img
        return img

    def generate_qr_for_card(
        self,
        card: BingoCard,
        fill_color: str = "black",
        back_color: str = "white",
    ) -> Image.Image:
        """Generate a QR code for a bingo card.

        Args:
            card: BingoCard to generate QR code for
            fill_color: QR code foreground color
            back_color: QR code background color

        Returns:
            PIL Image object containing the QR code
        """
        if card.qr_data is None:
            raise ValueError("Card has no QR code data")

        return self.generate_qr_code(card.qr_data, fill_color, back_color)

    def save_qr_code(
        self,
        image: Image.Image,
        file_path: Union[str, Path],
        format: str = "PNG",
    ) -> None:
        """Save QR code image to file.

        Args:
            image: PIL Image to save
            file_path: Path to save image
            format: Image format (PNG, JPEG, etc.)
        """
        image.save(file_path, format=format)

    def generate_and_save(
        self,
        card: BingoCard,
        file_path: Union[str, Path],
        format: str = "PNG",
        fill_color: str = "black",
        back_color: str = "white",
    ) -> Image.Image:
        """Generate and save QR code for a card in one step.

        Args:
            card: BingoCard to generate QR code for
            file_path: Path to save image
            format: Image format
            fill_color: QR code foreground color
            back_color: QR code background color

        Returns:
            PIL Image object that was saved
        """
        img = self.generate_qr_for_card(card, fill_color, back_color)
        self.save_qr_code(img, file_path, format)
        return img

    def get_qr_bytes(
        self,
        card: BingoCard,
        format: str = "PNG",
        fill_color: str = "black",
        back_color: str = "white",
    ) -> bytes:
        """Get QR code as bytes (for embedding in PDFs).

        Args:
            card: BingoCard to generate QR code for
            format: Image format
            fill_color: QR code foreground color
            back_color: QR code background color

        Returns:
            QR code image as bytes
        """
        img = self.generate_qr_for_card(card, fill_color, back_color)
        buf = io.BytesIO()
        img.save(buf, format=format)
        return buf.getvalue()


def decode_qr_string(qr_string: str) -> QRCodeData:
    """Decode a QR code string back to QRCodeData.

    Args:
        qr_string: String read from QR code

    Returns:
        QRCodeData object

    Raises:
        ValueError: If string cannot be decoded
    """
    return QRCodeData.from_string(qr_string)


def verify_card_qr(card: BingoCard, scanned_data: str) -> bool:
    """Verify that scanned QR data matches a card.

    Args:
        card: BingoCard to verify against
        scanned_data: String scanned from QR code

    Returns:
        True if QR code matches card and is valid
    """
    try:
        qr_data = decode_qr_string(scanned_data)

        # Check card ID matches
        if qr_data.card_id != card.card_id:
            return False

        # Check game ID matches
        if qr_data.game_id != card.game_id:
            return False

        # Verify checksum
        if not qr_data.is_valid():
            return False

        return True
    except (ValueError, AttributeError):
        return False
