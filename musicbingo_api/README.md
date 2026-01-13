# Music Bingo API

Backend API for Music Bingo game management and card verification.

## Features

- **Game State Management**: Track active games, played songs, winning patterns
- **Card Verification API**: Instant win verification (<2 seconds)
- **In-Memory + Persistent Storage**: Fast active game state with SQLite persistence
- **RESTful API**: Clean HTTP endpoints for all operations

## Installation

```bash
# Install in development mode
pip install -e .

# Install with dev dependencies
pip install -e ".[dev]"
```

## Usage

```bash
# Start the API server
uvicorn musicbingo_api.main:app --reload

# API will be available at http://localhost:8000
# Docs available at http://localhost:8000/docs
```

## API Endpoints

### Game Management

- `POST /api/game/start` - Create new game session
- `POST /api/game/{game_id}/song-played` - Record a played song
- `GET /api/game/{game_id}/state` - Get current game state

### Card Verification

- `GET /api/verify/{game_id}/{card_id}` - Verify if card is a winner

## Development

```bash
# Run tests
pytest

# Format code
black src tests

# Lint code
ruff check src tests

# Run with hot reload
uvicorn musicbingo_api.main:app --reload
```

## Tech Stack

- **Framework**: FastAPI
- **Database**: SQLite
- **Storage**: In-memory + persistent
- **Testing**: pytest, httpx
