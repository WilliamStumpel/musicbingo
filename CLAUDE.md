# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Music Bingo** is a professional DJ system for running music bingo games at bars and venues. The system includes:

- **Printed card generation**: Creates unique 5x5 bingo cards from playlists with QR codes
- **QR verification app**: Mobile/tablet PWA for instant (<2 second) win verification
- **Host app**: DJ control interface with song checklist and game management
- **Manual playback mode**: Works with any music player (Spotify, Apple Music, etc.)

**Current Status**: Active development. Phases 1-3 complete (local backend, card printing, manual playback). Work tracked via `.planning/` directory.

## Project Structure

```
musicbingo/
├── .planning/           # Project planning and tracking
│   ├── PROJECT.md       # Project vision and context
│   ├── ROADMAP.md       # Phase structure and progress
│   ├── STATE.md         # Current position and decisions
│   └── phases/          # Phase-specific plans and summaries
├── musicbingo_api/      # FastAPI backend (Python 3.9+)
│   └── src/musicbingo_api/
├── musicbingo_cards/    # Card generation CLI (Python 3.9+)
│   └── src/musicbingo_cards/
├── musicbingo_host/     # Host app (React)
│   └── src/
├── musicbingo_verify/   # Scanner PWA (React)
│   └── src/
├── games/               # Game JSON files
├── AGENTS.md            # Agent workflow guidelines
└── CLAUDE.md            # This file
```

## Key Requirements

### Card Generation
- 5x5 grid: 24 songs + 1 free center space
- Unique QR code per card
- PDF export with custom branding (venue logo, DJ contact)
- 4-up layout (4 cards per letter page)

### Verification System
- Must verify win in <2 seconds
- Works offline (pre-loaded active cards)
- Visual feedback: green (valid) / red (invalid)
- Manual backup code entry option

### Manual Playback Mode
- Import playlists via Exportify CSV
- Song checklist for marking played songs
- Cross-app sync between host and scanner
- Works with any music source (service-agnostic)

## Development Commands

### Backend API (musicbingo_api/)

```bash
# Start API server
cd musicbingo_api
uvicorn musicbingo_api.main:app --reload --host 0.0.0.0 --port 8000
```

### Card Generation (musicbingo_cards/)

```bash
# Install
python3 -m pip install -e "musicbingo_cards/[dev]"

# Generate cards
musicbingo generate <playlist.json> -n 50 -o cards.pdf

# Import CSV playlist
musicbingo import-csv <playlist.csv> --output games/game.json

# Run tests
pytest musicbingo_cards/
```

### Host App (musicbingo_host/)

```bash
cd musicbingo_host
npm install
npm start  # Runs on http://localhost:3000
```

### Scanner PWA (musicbingo_verify/)

```bash
cd musicbingo_verify
npm install
npm start  # Runs on http://localhost:3001
```

## Tech Stack

- **Backend**: Python 3.9+, FastAPI, uvicorn
- **Card Generation**: ReportLab, qrcode, Pillow
- **Frontend**: React, Create React App
- **Testing**: pytest, pytest-cov
- **Code Quality**: black, ruff
