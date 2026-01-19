# External Integrations

**Analysis Date:** 2026-01-14

## APIs & External Services

**REST API (Internal):**
- Music Bingo API - Game state management and card verification
  - Base URL: `http://localhost:8000` (dev), `https://api.musicbingo.example.com` (prod)
  - Client: Browser fetch API (`musicbingo_verify/src/services/apiClient.js`)
  - Auth: None (public endpoints)

**Endpoints Used:**
- `POST /api/game/start` - Create game sessions
- `POST /api/game/{game_id}/cards/bulk` - Bulk card loading
- `POST /api/game/{game_id}/activate` - Start game
- `POST /api/game/{game_id}/song-played` - Record played songs
- `GET /api/game/{game_id}/state` - Get game state
- `GET /api/verify/{game_id}/{card_id}` - Card win verification (<2s target)
- `GET /health` - Health check

**Spotify Integration (Planned):**
- Epic `musicbingo-kq8` - OAuth integration for playlist management
- Not yet implemented

## Data Storage

**Databases:**
- In-Memory Storage (Current) - All game state in Python dict
  - Location: `musicbingo_api/src/musicbingo_api/game_service.py`
  - Limitation: Data lost on server restart
- SQLite (Planned) - Future persistence layer

**File Storage:**
- Local File System - Generated PDF cards and JSON exports
  - PDF output: User-specified path
  - JSON export: For API bulk import (`integration_example.py`)

**Caching:**
- None currently

## Authentication & Identity

**Auth Provider:**
- None implemented
- Game verification is public (anyone with QR code can verify)

**OAuth Integrations:**
- Spotify OAuth (Planned) - For playlist import
  - Not yet implemented

## Monitoring & Observability

**Error Tracking:**
- Console logging only (no Sentry or similar)
- `console.error` in frontend (`musicbingo_verify/src/`)

**Analytics:**
- web-vitals 2.1.4 - Performance metrics (`musicbingo_verify/package.json`)
- No external analytics service

**Logs:**
- stdout/stderr only
- No structured logging framework

## CI/CD & Deployment

**Hosting:**
- Frontend: GitHub Pages (`musicbingo_verify/package.json` - gh-pages script)
  - Build: `npm run build`
  - Deploy: `npm run deploy`
- Backend: Railway/Render/Fly.io recommended (`musicbingo_api/DEPLOYMENT.md`)

**CI Pipeline:**
- Not configured (no `.github/workflows/` found)
- Manual testing and deployment

## Environment Configuration

**Development:**
- Required env vars: `REACT_APP_API_URL` (optional, defaults to localhost)
- Secrets location: `.env.development` (gitignored)
- Mock/stub services: None (uses real API)

**Production:**
- Frontend: `musicbingo_verify/.env.production` - `REACT_APP_API_URL`
- Backend: Environment variables on hosting platform
- Secrets management: Platform-specific (Railway/Render dashboard)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Third-Party Libraries for Specific Features

**PDF Generation:**
- ReportLab - Complete PDF generation for bingo cards
  - `reportlab.lib.pagesizes`, `reportlab.lib.colors`
  - `reportlab.platypus` - Page layout
  - Used in: `musicbingo_cards/src/musicbingo_cards/pdf_generator.py`

**QR Code Generation/Scanning:**
- qrcode (Python) - Generate QR codes from card IDs
  - Used in: `musicbingo_cards/src/musicbingo_cards/qr_code.py`
- qr-scanner (JavaScript) - Camera-based QR scanning
  - Used in: `musicbingo_verify/src/components/Scanner.jsx`

**Image Processing:**
- Pillow/PIL - QR code image creation
  - Used in: `musicbingo_cards/src/musicbingo_cards/qr_code.py`

## File Format Support

**Playlist Input:**
- CSV: `title,artist,album,duration` (`musicbingo_cards/src/musicbingo_cards/playlist.py`)
- JSON: Structured format with metadata
- TXT: "Title - Artist" or "Title by Artist" format

**Card Export:**
- PDF: Multi-card documents with ReportLab
- JSON: Card data for API integration (`musicbingo_cards/src/musicbingo_cards/exporter.py`)

## PWA & Mobile

**Progressive Web App:**
- Manifest configured (`musicbingo_verify/public/manifest.json`)
  - App name: "Music Bingo Verification"
  - Display: standalone (full-screen)
  - Orientation: portrait
  - Theme: #2196F3

---

*Integration audit: 2026-01-14*
*Update when adding/removing external services*
