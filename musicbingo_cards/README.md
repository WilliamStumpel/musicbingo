# Music Bingo Card Generator

Generate unique 5x5 bingo cards from playlists with QR codes for instant win verification.

## Features

- Generate 50-200 unique bingo cards per game
- 5x5 grid: 24 songs + free center space
- Unique QR code per card for verification
- Optimal song distribution: 30-40% overlap between cards
- PDF export with custom branding (venue logo, DJ contact)
- Playlist support: 48-75 songs (48=quick, 60=standard, 75=marathon)

## Installation

```bash
# Install in development mode
pip install -e .

# Install with dev dependencies
pip install -e ".[dev]"
```

## Usage

```bash
# Generate 50 cards from a playlist
musicbingo generate playlist.txt -n 50 -o cards.pdf

# Add custom branding
musicbingo generate playlist.txt \
  --venue-logo logo.png \
  --dj-contact "DJ Name - 555-1234"

# Validate playlist and setup
musicbingo validate
```

## Development

```bash
# Run tests
pytest

# Format code
black src tests

# Lint code
ruff check src tests

# Run tests with coverage
pytest --cov
```

## Project Status

Currently implementing:
- Task musicbingo-73a.1: Project setup ✅
- Task musicbingo-73a.2: Card data model (next)
- Task musicbingo-73a.3: Playlist input handler (next)

See `.beads/issues.jsonl` for full task breakdown and dependencies.

## Tech Stack

- Python 3.9+
- Click: CLI framework
- ReportLab: PDF generation
- qrcode + Pillow: QR code generation
- pytest: Testing framework
