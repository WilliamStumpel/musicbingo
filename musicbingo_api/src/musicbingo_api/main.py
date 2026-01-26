"""Main FastAPI application for Music Bingo API."""

import json
from uuid import UUID

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .game_loader import list_available_games, load_game_from_file
from .game_service import get_game_service
from .models import CardData, PatternType, Song
from .network import get_local_ip
from .schemas import (
    AddCardRequest,
    AddCardResponse,
    BulkAddCardsRequest,
    BulkAddCardsResponse,
    CardStatusesResponse,
    CardStatusInfo,
    CreateGameRequest,
    CreateGameResponse,
    DetectedWinner,
    ErrorResponse,
    GameListItem,
    GameListResponse,
    GameStateResponse,
    LoadGameResponse,
    MarkSongRequest,
    MarkSongResponse,
    RecordSongRequest,
    RecordSongResponse,
    RegisterCardRequest,
    RegisterCardResponse,
    RegisteredCardInfo,
    RegisteredCardsResponse,
    SetPrizeRequest,
    SetPrizeResponse,
    SongInfo,
    StartGameRequest,
    StartGameResponse,
    VerifyCardResponse,
)

app = FastAPI(
    title="Music Bingo API",
    description="Backend API for Music Bingo game management and verification",
    version="0.1.0",
)

# Enable CORS for web clients
# Pattern matches localhost and private network IP ranges:
# - localhost (for development)
# - 192.168.x.x (most home/small office networks)
# - 10.x.x.x (larger private networks)
# - 172.16-31.x.x (private network range)
# Also matches with or without port number
CORS_ORIGIN_REGEX = r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://williamstumpel.github.io",  # GitHub Pages (deployed scanner PWA)
        "https://musicbingo-verify.vercel.app",  # Vercel (deployed scanner PWA)
    ],
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Music Bingo API",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


# Default port for the server
DEFAULT_PORT = 8000


@app.get("/api/network/info")
async def network_info(request: Request):
    """Get network information for connecting from other devices.

    Returns the local IP address and URL that other devices on the same
    network can use to connect to this server. Useful for the scanner app
    to discover the server URL.
    """
    ip = get_local_ip()
    # Detect protocol from request (handles both HTTP and HTTPS)
    protocol = "https" if request.url.scheme == "https" else "http"
    return {
        "ip": ip,
        "port": DEFAULT_PORT,
        "url": f"{protocol}://{ip}:{DEFAULT_PORT}",
    }


@app.get(
    "/api/games",
    response_model=GameListResponse,
)
async def get_games():
    """List available games from games/ directory.

    Returns list of game files that can be loaded. Games are JSON files
    exported from the card generator.
    """
    games = list_available_games()
    return GameListResponse(
        games=[GameListItem(**g) for g in games]
    )


@app.post(
    "/api/games/load/{filename:path}",
    response_model=LoadGameResponse,
    responses={404: {"model": ErrorResponse}, 400: {"model": ErrorResponse}},
)
async def load_game(filename: str):
    """Load a game file into memory, ready to play.

    Loads game from JSON file in games/ directory, registers it in
    GameService, and sets status to SETUP (needs activation).

    If a game with the same game_id already exists, returns the existing
    game state to preserve runtime data (played_songs, etc.) for cross-app sync.
    """
    try:
        # Load game from file
        game = load_game_from_file(filename)

        # Check if game already registered (preserve runtime state for sync)
        service = get_game_service()
        existing = service.get_game(game.game_id)
        if existing is not None:
            # Use existing game to preserve played_songs state
            game = existing
        else:
            # New game - register it
            service._games[game.game_id] = game

        # Build songs list for checklist display
        songs = [
            SongInfo(
                song_id=str(s.song_id),
                title=s.title,
                artist=s.artist,
                album=s.album
            )
            for s in game.playlist
        ]

        return LoadGameResponse(
            game_id=game.game_id,
            name=filename.replace(".json", "").replace("-", " ").title(),
            status=game.status,
            card_count=len(game.cards),
            songs=songs,
        )

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except (ValueError, KeyError, json.JSONDecodeError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid game file: {e}")


@app.post(
    "/api/game/start",
    response_model=CreateGameResponse,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ErrorResponse}},
)
async def create_game(request: CreateGameRequest):
    """Create a new game session.

    This creates a game in SETUP status. Add cards, then call POST /api/game/{game_id}/activate
    to start playing.
    """
    try:
        service = get_game_service()

        # Convert schema to domain models
        playlist = [
            Song(
                song_id=s.song_id,
                title=s.title,
                artist=s.artist,
                album=s.album,
                duration_seconds=s.duration_seconds,
            )
            for s in request.playlist
        ]

        game = service.create_game(
            game_id=request.game_id,
            playlist=playlist,
            pattern=request.pattern,
        )

        return CreateGameResponse(
            game_id=game.game_id,
            status=game.status,
            playlist_size=len(game.playlist),
            pattern=game.current_pattern,
            created_at=game.created_at,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post(
    "/api/game/{game_id}/card",
    response_model=AddCardResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def add_card(game_id: UUID, request: AddCardRequest):
    """Add a card to a game.

    Cards must be added before activating the game.
    """
    try:
        service = get_game_service()

        card = CardData(
            card_id=request.card_id,
            game_id=game_id,
            card_number=request.card_number,
            song_positions=request.song_positions,
        )

        service.add_card(game_id, card)

        return AddCardResponse(
            success=True,
            card_id=card.card_id,
            game_id=game_id,
            card_number=request.card_number,
        )

    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@app.post(
    "/api/game/{game_id}/cards/bulk",
    response_model=BulkAddCardsResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def bulk_add_cards(game_id: UUID, request: BulkAddCardsRequest):
    """Add multiple cards to a game in bulk.

    This is the main endpoint for loading generated cards into a game.
    Cards must be added before activating the game.
    """
    try:
        service = get_game_service()

        added_cards = []
        for card_request in request.cards:
            card = CardData(
                card_id=card_request.card_id,
                game_id=game_id,
                card_number=card_request.card_number,
                song_positions=card_request.song_positions,
            )

            service.add_card(game_id, card)

            added_cards.append({
                "card_id": str(card.card_id),
                "card_number": card.card_number,
            })

        return BulkAddCardsResponse(
            success=True,
            game_id=game_id,
            cards_added=len(added_cards),
            cards=added_cards,
        )

    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@app.post(
    "/api/game/{game_id}/activate",
    response_model=StartGameResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def activate_game(game_id: UUID):
    """Activate a game to start playing.

    Game must have cards added before activation.
    """
    try:
        service = get_game_service()
        game = service.start_game(game_id)

        return StartGameResponse(
            game_id=game.game_id,
            status=game.status,
            card_count=len(game.cards),
        )

    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@app.post(
    "/api/game/{game_id}/song-played",
    response_model=RecordSongResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def record_played_song(game_id: UUID, request: RecordSongRequest):
    """Record a song as played in the game.

    This updates the game state and affects card verification results.
    """
    try:
        service = get_game_service()
        game = service.record_played_song(game_id, request.song_id)

        return RecordSongResponse(
            game_id=game.game_id,
            song_id=request.song_id,
            total_played=len(game.played_songs),
            updated_at=game.updated_at,
        )

    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@app.post(
    "/api/game/{game_id}/mark-song",
    response_model=MarkSongResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def mark_song(game_id: UUID, request: MarkSongRequest):
    """Mark a song as played or unplayed.

    This endpoint supports toggling - send played=true to mark as played,
    played=false to unmark. Useful for manual song tracking in both
    host and scanner apps.

    The played_songs array in game state is updated and can be polled
    via GET /api/game/{game_id}/state.
    """
    try:
        service = get_game_service()
        game = service.toggle_song_played(game_id, request.song_id, request.played)

        return MarkSongResponse(
            game_id=game.game_id,
            song_id=request.song_id,
            played=request.played,
            total_played=len(game.played_songs),
            updated_at=game.updated_at,
        )

    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@app.get(
    "/api/game/{game_id}/state",
    response_model=GameStateResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_game_state(game_id: UUID):
    """Get current state of a game.

    Returns game status, played songs, pattern, and other state information.
    """
    service = get_game_service()
    game = service.get_game(game_id)

    if game is None:
        raise HTTPException(status_code=404, detail=f"Game {game_id} not found")

    # Convert detected_winners to schema objects
    winners = [
        DetectedWinner(
            card_id=w["card_id"],
            card_number=w["card_number"],
            player_name=w["player_name"],
            pattern=w["pattern"],
            detected_at=w["detected_at"],
            song_id=w.get("song_id"),
        )
        for w in game.detected_winners
    ]

    return GameStateResponse(
        game_id=game.game_id,
        status=game.status,
        playlist_size=len(game.playlist),
        played_songs=game.played_songs,
        played_count=len(game.played_songs),
        revealed_songs=game.revealed_songs,
        current_pattern=game.current_pattern,
        card_count=len(game.cards),
        created_at=game.created_at,
        updated_at=game.updated_at,
        current_prize=game.current_prize,
        detected_winners=winners,
    )


@app.get(
    "/api/verify/{game_id}/{card_id}",
    response_model=VerifyCardResponse,
    responses={404: {"model": ErrorResponse}},
)
async def verify_card(game_id: UUID, card_id: UUID):
    """Verify if a card is a winner.

    Checks the card's songs against played songs and current winning pattern.
    Returns winner status, pattern (if winner), card number, and player name
    (if card is registered).

    This is the main endpoint used by the QR verification app.
    """
    try:
        service = get_game_service()
        is_winner, pattern, card_number, player_name = service.verify_card(game_id, card_id)

        return VerifyCardResponse(
            winner=is_winner,
            pattern=pattern,
            card_number=card_number,
            card_id=card_id,
            game_id=game_id,
            player_name=player_name,
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post(
    "/api/game/{game_id}/pattern",
    response_model=GameStateResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def set_pattern(game_id: UUID, pattern: PatternType):
    """Change the winning pattern for a game."""
    try:
        service = get_game_service()
        game = service.set_pattern(game_id, pattern)

        return GameStateResponse(
            game_id=game.game_id,
            status=game.status,
            playlist_size=len(game.playlist),
            played_songs=game.played_songs,
            played_count=len(game.played_songs),
            revealed_songs=game.revealed_songs,
            current_pattern=game.current_pattern,
            card_count=len(game.cards),
            created_at=game.created_at,
            updated_at=game.updated_at,
        )

    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@app.post(
    "/api/game/{game_id}/reset",
    response_model=GameStateResponse,
    responses={404: {"model": ErrorResponse}},
)
async def reset_round(game_id: UUID):
    """Reset played songs for a new round.

    Clears all played songs but preserves cards and pattern.
    Use when starting a new round with the same game.
    """
    try:
        service = get_game_service()
        game = service.reset_round(game_id)

        return GameStateResponse(
            game_id=game.game_id,
            status=game.status,
            playlist_size=len(game.playlist),
            played_songs=game.played_songs,
            played_count=len(game.played_songs),
            revealed_songs=game.revealed_songs,
            current_pattern=game.current_pattern,
            card_count=len(game.cards),
            created_at=game.created_at,
            updated_at=game.updated_at,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post(
    "/api/game/{game_id}/reveal/{song_id}",
    response_model=GameStateResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def reveal_song(game_id: UUID, song_id: str):
    """Reveal a song title on the player view.

    Marks the song as revealed so its title can be displayed on the player view.
    Used after the song has been playing for a while and players have had a
    chance to recognize it by ear.
    """
    try:
        service = get_game_service()
        game = service.reveal_song(game_id, song_id)

        return GameStateResponse(
            game_id=game.game_id,
            status=game.status,
            playlist_size=len(game.playlist),
            played_songs=game.played_songs,
            played_count=len(game.played_songs),
            revealed_songs=game.revealed_songs,
            current_pattern=game.current_pattern,
            card_count=len(game.cards),
            created_at=game.created_at,
            updated_at=game.updated_at,
        )
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@app.post(
    "/api/game/{game_id}/register-card",
    response_model=RegisterCardResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def register_card(game_id: UUID, request: RegisterCardRequest):
    """Register a card to a player.

    Assigns a player name to a card for winner tracking. Called when
    distributing cards to players at the start of a game.
    """
    try:
        service = get_game_service()
        result = service.register_card(game_id, request.card_id, request.player_name)

        return RegisterCardResponse(
            card_id=result["card_id"],
            card_number=result["card_number"],
            player_name=result["player_name"],
            registered_at=result["registered_at"],
        )

    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@app.get(
    "/api/game/{game_id}/registered-cards",
    response_model=RegisteredCardsResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_registered_cards(game_id: UUID):
    """Get all registered cards for a game.

    Returns a list of all cards that have been assigned to players,
    including player names and registration timestamps.
    """
    try:
        service = get_game_service()
        cards = service.get_registered_cards(game_id)

        return RegisteredCardsResponse(
            game_id=game_id,
            cards=[RegisteredCardInfo(**card) for card in cards],
            total_registered=len(cards),
        )

    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@app.get(
    "/api/game/{game_id}/card-statuses",
    response_model=CardStatusesResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_card_statuses(game_id: UUID):
    """Get status of all registered cards.

    Returns progress toward winning for each registered card,
    including match counts and winner status.
    """
    try:
        service = get_game_service()
        result = service.get_card_statuses(game_id)

        return CardStatusesResponse(
            game_id=result["game_id"],
            current_pattern=result["current_pattern"],
            cards=[CardStatusInfo(**card) for card in result["cards"]],
            winners=[CardStatusInfo(**w) for w in result["winners"]],
        )

    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@app.post(
    "/api/game/{game_id}/prize",
    response_model=SetPrizeResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def set_prize(game_id: UUID, request: SetPrizeRequest):
    """Set the prize for the current game.

    Sets the prize text that can be displayed to players when
    announcing winners.
    """
    try:
        service = get_game_service()
        game = service.set_prize(game_id, request.prize)

        return SetPrizeResponse(
            game_id=game.game_id,
            prize=game.current_prize,
        )

    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors."""
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )
