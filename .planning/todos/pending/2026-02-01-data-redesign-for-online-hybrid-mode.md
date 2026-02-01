---
created: 2026-02-01T08:48
title: Data redesign for online and hybrid mode
area: database
files:
  - musicbingo_api/src/musicbingo_api/db_models.py
  - musicbingo_api/src/musicbingo_api/models.py
  - musicbingo_api/src/musicbingo_api/game_service.py
  - musicbingo_api/src/musicbingo_api/game_loader.py
---

## Problem

Current architecture has two disconnected storage systems:
1. **SQLite** - For Game Prep UI (venues, venue_nights, games config)
2. **JSON files** - For runtime game loading (`games/*.json`)

This creates gaps:
- Games created in Prep UI must be manually exported to `games/` folder
- In-memory `GameState` is lost on server restart
- No path to online mode (players on phones instead of paper cards)
- No hybrid mode support (mix of paper + online cards)

Future requirements:
- **Online mode**: Players use phones instead of paper cards
- **Hybrid mode**: First N cards printed for tech-challenged players, rest available online
- **PDF persistence**: Store generated PDFs in DB for easy retrieval and reprinting
- **Scalable sync**: Current 2-second polling won't scale to 50+ online players

## Solution

### SQLite as single source of truth

**New/modified tables:**

```sql
-- Cards become first-class entities (not JSON blob)
CREATE TABLE cards (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL REFERENCES games(id),
    card_number INTEGER NOT NULL,
    song_positions TEXT NOT NULL,  -- JSON: {"song_id": [row, col], ...}
    card_type TEXT NOT NULL DEFAULT 'paper',  -- 'paper' | 'online'
    printed_at TEXT,  -- null for online-only
    created_at TEXT NOT NULL,
    UNIQUE(game_id, card_number)
);

-- Player card assignments (for online mode)
CREATE TABLE player_cards (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL REFERENCES cards(id),
    player_id TEXT,  -- or session token
    game_session_id TEXT,  -- which play session
    assigned_at TEXT NOT NULL
);

-- Game sessions (active instances of a game)
CREATE TABLE game_sessions (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL REFERENCES games(id),
    status TEXT NOT NULL,  -- 'active', 'paused', 'completed'
    current_pattern TEXT,
    current_prize TEXT,
    started_at TEXT,
    completed_at TEXT
);

-- Played songs per session (persisted, not in-memory)
CREATE TABLE played_songs (
    id TEXT PRIMARY KEY,
    game_session_id TEXT NOT NULL REFERENCES game_sessions(id),
    song_id TEXT NOT NULL,
    played_at TEXT NOT NULL,
    play_order INTEGER NOT NULL
);

-- Winners (persisted history)
CREATE TABLE winners (
    id TEXT PRIMARY KEY,
    game_session_id TEXT NOT NULL REFERENCES game_sessions(id),
    card_id TEXT NOT NULL REFERENCES cards(id),
    player_name TEXT,
    pattern TEXT NOT NULL,
    prize TEXT,
    detected_at TEXT NOT NULL,
    announced_at TEXT
);
```

**Modify games table:**

```sql
ALTER TABLE games ADD COLUMN paper_card_count INTEGER DEFAULT 100;
ALTER TABLE games ADD COLUMN max_cards INTEGER DEFAULT 500;
ALTER TABLE games ADD COLUMN pdf_data BLOB;  -- Store PDF binary
ALTER TABLE games ADD COLUMN pdf_generated_at TEXT;
```

### Migration path

1. **Phase 11**: Move Host app to read from SQLite instead of JSON files
2. **Phase 11**: Persist game session state to DB (survives restart)
3. **Future milestone**: Add online player flow (card assignment, phone UI)
4. **Future milestone**: Add real-time sync (WebSockets/SSE instead of polling)

### Hybrid mode flow

1. Create game with playlist
2. Set `paper_card_count=100`, `max_cards=500`
3. Generate all 500 cards at once (ensures uniqueness)
4. Cards 1-100: `type='paper'`, included in PDF
5. Cards 101-500: `type='online'`, assigned on-demand to phone players

### In-memory GameState becomes cache

- Still exists for fast access during play
- Backed by SQLite (hydrate on load, persist on change)
- Server restart = reload from DB, no data loss
