# Architecture

**Analysis Date:** 2026-01-14

## Pattern Overview

**Overall:** Modular Multi-Tier System (Microservices + Presentation)

**Key Characteristics:**
- Three independent but integrated services
- UUID-based identifiers for game/card tracking
- JSON for data interchange between services
- QR codes for verification links

## Layers

**Tier 1: Presentation Layer (React Frontend)**
- Purpose: QR code scanning and win verification UI
- Contains: Scanner UI, Result Display, Error Handling components
- Location: `musicbingo_verify/src/`
- Depends on: API Service via REST calls
- Used by: DJs and venue staff for card verification

**Tier 2: API Service Layer (FastAPI Backend)**
- Purpose: Game state management and card verification
- Contains: Game service, domain models, Pydantic schemas
- Location: `musicbingo_api/src/musicbingo_api/`
- Depends on: In-memory storage (no database yet)
- Used by: Frontend for verification, integration scripts for card loading

**Tier 3: Card Generation Layer (Python Library)**
- Purpose: Generate unique bingo cards with QR codes
- Contains: Generator algorithm, PDF renderer, playlist parser
- Location: `musicbingo_cards/src/musicbingo_cards/`
- Depends on: File system for input/output
- Used by: DJs to create physical bingo cards

## Data Flow

**Card Generation Flow:**
1. User provides playlist file (CSV/JSON/TXT)
2. `PlaylistParser.parse_file()` → Playlist object (`musicbingo_cards/src/musicbingo_cards/playlist.py`)
3. `CardGenerator.generate_cards()` → List[BingoCard] (`musicbingo_cards/src/musicbingo_cards/generator.py`)
4. `PDFCardGenerator.generate_pdf()` → PDF file (`musicbingo_cards/src/musicbingo_cards/pdf_generator.py`)
5. `CardExporter.save_json()` → JSON for API import (`musicbingo_cards/src/musicbingo_cards/exporter.py`)

**Game Setup Flow:**
1. `POST /api/game/start` → Create game with playlist
2. `POST /api/game/{game_id}/cards/bulk` → Load cards from generator JSON
3. `POST /api/game/{game_id}/activate` → Start game
4. `POST /api/game/{game_id}/song-played` → Track played songs during game

**Verification Flow:**
1. QR Scanner detects code (`musicbingo_verify/src/components/Scanner.jsx`)
2. `parseQRData()` extracts cardId, gameId, checksum (`musicbingo_verify/src/services/qrParser.js`)
3. `apiClient.verifyCard(gameId, cardId)` → HTTP GET (`musicbingo_verify/src/services/apiClient.js`)
4. FastAPI `/api/verify/{game_id}/{card_id}` (`musicbingo_api/src/musicbingo_api/main.py`)
5. `GameService.verify_card()` → (is_winner, pattern, card_number) (`musicbingo_api/src/musicbingo_api/game_service.py`)
6. `ResultDisplay` shows green/red feedback (`musicbingo_verify/src/components/ResultDisplay.jsx`)

**State Management:**
- File-based: Generated cards stored as PDF/JSON files
- In-memory: Active game state in Python dict (no persistence)
- Each verification request is stateless on frontend

## Key Abstractions

**Card Generation Service:**
- `Playlist` - Parsed collection of songs with validation (`musicbingo_cards/src/musicbingo_cards/playlist.py`)
- `Song` - Immutable song entity with UUID (`musicbingo_cards/src/musicbingo_cards/models.py`)
- `CardGrid` - 5x5 grid structure with position validation (`musicbingo_cards/src/musicbingo_cards/models.py`)
- `BingoCard` - Complete card with grid, QR code, tracking (`musicbingo_cards/src/musicbingo_cards/models.py`)
- `CardGenerator` - Algorithm for 30-40% overlap generation (`musicbingo_cards/src/musicbingo_cards/generator.py`)

**API Service:**
- `GameState` - Current game with playlist, played songs, cards (`musicbingo_api/src/musicbingo_api/models.py`)
- `CardData` - Minimal card for fast verification (`musicbingo_api/src/musicbingo_api/models.py`)
- `PatternType` - Enum of winning patterns (Row, Column, Diagonal, etc.)
- `BingoPattern` - Pattern matching logic with `check_win()` method
- `GameService` - In-memory game state management (singleton)

**Frontend:**
- `useScanner` - Custom hook for scan state and verification (`musicbingo_verify/src/hooks/useScanner.js`)
- `ApiClient` - HTTP client for backend calls (`musicbingo_verify/src/services/apiClient.js`)
- `parseQRData` - QR code parser and validator (`musicbingo_verify/src/services/qrParser.js`)

## Entry Points

**CLI Entry:**
- Location: `musicbingo_cards/src/musicbingo_cards/cli.py`
- Triggers: `musicbingo generate <playlist>` or `musicbingo validate <qr-string>`
- Responsibilities: Parse args, call generator, export results

**API Server Entry:**
- Location: `musicbingo_api/src/musicbingo_api/main.py`
- Triggers: `uvicorn musicbingo_api.main:app`
- Responsibilities: Route requests, validate input, manage game state

**Frontend Entry:**
- Location: `musicbingo_verify/src/index.js`
- Triggers: Browser loads app
- Responsibilities: Render React app, initialize scanner

## Error Handling

**Strategy:** Throw exceptions at boundaries, catch and display to user

**Patterns:**
- Python: Custom exceptions (`CardGenerationError`), ValueError for validation
- FastAPI: HTTPException for API errors, Pydantic for request validation
- React: Try/catch in async handlers, error state in hooks

**Error Types:**
- Validation errors: Return 400 with message
- Not found: Return 404 (game/card not found)
- Server errors: Return 500, log to console

## Cross-Cutting Concerns

**Logging:**
- Python: No structured logging (print/console)
- React: `console.log/error` for debugging
- No centralized logging service

**Validation:**
- Pydantic schemas at API boundary (`musicbingo_api/src/musicbingo_api/schemas.py`)
- UUID validation in QR parser
- Playlist validation in card generator

**CORS:**
- Configured in FastAPI middleware (`musicbingo_api/src/musicbingo_api/main.py`)
- Allows: localhost:3000, localhost:8000, williamstumpel.github.io

---

*Architecture analysis: 2026-01-14*
*Update when major patterns change*
