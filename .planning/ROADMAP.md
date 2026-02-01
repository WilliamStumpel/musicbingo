# Roadmap: Music Bingo

## Overview

Transform the existing card generator, verification API, and scanner PWA into a complete DJ system for running music bingo at venues. Starting with local deployment infrastructure, we'll add professional card printing, manual song tracking (DJ plays music in any player), host controls, player display, multiple game modes, and prize tracking. The journey goes from three disconnected tools to one smooth workflow.

## Domain Expertise

None

---

# Milestone 1: Paper Card System (COMPLETE)

Complete DJ system for running music bingo with printed paper cards at venues.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Local Backend Infrastructure** - Run backend on laptop, phone scanner connects via WiFi
- [x] **Phase 2: Card Printing System** - 4 cards per page with custom branding for venues
- [x] **Phase 3: Manual Playback Mode** - CSV playlist import, song checklist for marking played songs
- [x] **Phase 4: Host View** - Laptop interface with playback controls, call board, game management
- [x] **Phase 5: Player View** - HDMI output with call board, delayed song reveal, pattern display
- [x] **Phase 6: Game Modes & Patterns** - Multiple patterns, pattern selection, lightning rounds
- [x] **Phase 7: Prize & Winner Tracking** - Winner log, prize types, multi-winner handling
- [x] **Phase 8: Game Prep UI** - Visual game/venue management, CSV upload, card generation from browser
- [x] **Phase 9: Testing & Quality** - Unit tests, E2E tests, manual device testing
- [x] **Phase 10: Post-Launch Fixes** - Bug fixes from real-world testing

## Phase Details

### Phase 1: Local Backend Infrastructure
**Goal**: Backend runs on DJ's laptop, phone scanner connects via local WiFi for verification
**Depends on**: Nothing (first phase)
**Research**: Unlikely (FastAPI already in codebase, local network is standard)
**Plans**: TBD

Plans:
- [x] 01-01: Local server startup and network discovery
- [x] 01-02: Game selector with 8 pre-loaded games
- [x] 01-03: Scanner PWA connection to local backend (UAT fix applied)
- [x] 01-04: Connection QR code for scanner app
- [x] 01-05: Venue deployment infrastructure (Vercel + ngrok + one-click startup)

### Phase 2: Card Printing System
**Goal**: Generate professional print-ready PDFs with 4 cards per letter page and venue branding
**Depends on**: Phase 1
**Research**: Unlikely (ReportLab already in codebase)
**Plans**: 1

Plans:
- [x] 02-01: Professional card printing (4-up layout, branding, flexible counts)

### Phase 3: Manual Playback Mode
**Goal**: Import playlists via CSV, mark songs as played from host or scanner, sync state via API
**Depends on**: Phase 1
**Research**: Complete (pivoted from streaming APIs due to registration/setup blockers)
**Research topics**: Exportify CSV format, polling vs WebSocket, mobile-friendly sortable lists
**Plans**: 4

Plans:
- [x] 03-01: CSV playlist import (Exportify format)
- [x] 03-02: Host checklist view (sort, search, mark played)
- [x] 03-03: Scanner checklist view (same features, mobile-optimized)
- [x] 03-04: API sync endpoints (mark-song toggle, game state polling)

### Phase 4: Host View
**Goal**: Laptop interface for DJ with now playing tracking, call board, pattern selection, and game controls
**Depends on**: Phase 3
**Research**: Unlikely (React patterns, internal UI)
**Plans**: 2

Plans:
- [x] 04-01: Now Playing, Call Board & Pattern Selection
- [x] 04-02: Game Controls & Reset API

### Phase 5: Player View
**Goal**: Separate window for venue TV/projector with call board and delayed song title reveal
**Depends on**: Phase 4
**Research**: Unlikely (React patterns, multi-window is standard)
**Plans**: 4

Plans:
- [x] 05-01: Player Window Route & Layout (React Router, PlayerView page, open button)
- [x] 05-02: TV-Optimized Call Board (PlayerCallBoard, now playing hero, song grid)
- [x] 05-03: Delayed Song Reveal (revealed_songs API, auto-reveal timer, manual reveal)
- [x] 05-04: Pattern Display (PatternDisplay component, footer integration, animation)

### Phase 6: Game Modes & Patterns
**Goal**: Complete bingo pattern support (8 patterns with backend validation and frontend selection)
**Depends on**: Phase 5
**Research**: None (extending existing validation logic)
**Plans**: 1

Note: Lightning rounds removed - obsolete after Manual Playback pivot (DJ controls music externally).

Plans:
- [x] 06-01: Complete pattern support (add Frame to backend, expose all 8 patterns in UI)

### Phase 7: Card Registration & Winner Tracking
**Goal**: Register cards to players, detect winners proactively, display prizes, celebrate winners on venue TV
**Depends on**: Phase 4
**Research**: None (internal feature work)
**Plans**: 4

Plans:
- [x] 07-01: Card Registration (backend + scanner UI for assigning player names to cards)
- [x] 07-02: Winner Detection & Prize Config (proactive detection, card statuses, prize setting, host toasts)
- [x] 07-03: Host Panel & Venue Display (card status slide-out, winner log, prize display, winner announcement)
- [x] 07-04: Card Recall (unregister single card, clear all registrations)

### Phase 8: Game Prep UI
**Goal**: Visual interface for managing venues, game nights, playlists, and card generation — replacing CLI workflow
**Depends on**: Phase 7
**Research**: None (React patterns, SQLite, existing card generation logic)
**Plans**: TBD

Data model:
- Venue: name, logo, contact info (reusable across nights)
- VenueNight: date, venue, list of games, status
- Game: name, playlist (songs), card count, PDF generation status

Features:
- Prep tab in host app (alongside Host View and Player View)
- Venue manager with logo upload
- Venue night list (sorted by date, status badges)
- Game editor with CSV upload, song preview, card count
- Card generation from browser with PDF download
- Edit existing games/nights

Plans:
- [x] 08-01: SQLite database schema and migrations
- [x] 08-02: Venue CRUD API and UI
- [x] 08-03: Venue Night CRUD API and UI
- [x] 08-04: Game management with CSV upload
- [x] 08-05: Card generation API and PDF download

### Phase 9: Testing & Quality
**Goal**: Comprehensive test coverage and real device validation
**Depends on**: Phases 1-8
**Research**: Unlikely (pytest/Playwright established patterns)
**Plans**: TBD

Plans:
- [x] 09-01: Unit tests for card generation algorithm
- [x] 09-02: Unit tests for QR parser and API client
- [x] 09-03: Unit tests for React components
- [x] 09-04: E2E tests with Playwright
- [x] 09-05: Manual device testing protocol

### Phase 10: Post-Launch Fixes
**Goal**: Fix bugs and UX issues discovered during real-world testing
**Depends on**: Phase 9
**Research**: None
**Plans**: TBD

Issues to address:

1. **Card Progress UI**
   - Progress shows "songs played on card" not "progress toward pattern"
   - Misleading when card has 5 songs played but not in winning pattern
   - Fix: Calculate pattern-aware progress (best line for row/col/diag patterns, fixed cell count for corners/X/frame/blackout)

2. **Player View Winner Indicator**
   - DJ has no way to trigger winner celebration on TV display
   - WinnerAnnouncement component exists but isn't triggered from Host
   - Fix: Add "Announce" button in CardStatusPanel to send winner to PlayerView

Plans:
- [x] 10-01: Pattern-aware card progress display
- [x] 10-02: Player view winner indicator (Announce button triggers TV celebration)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Local Backend Infrastructure | 5/5 | Complete | 2026-01-22 |
| 2. Card Printing System | 1/1 | Complete | 2026-01-14 |
| 3. Manual Playback Mode | 4/4 | Complete | 2026-01-18 |
| 4. Host View | 2/2 | Complete | 2026-01-18 |
| 5. Player View | 4/4 | Complete | 2026-01-19 |
| 6. Game Modes & Patterns | 1/1 | Complete | 2026-01-19 |
| 7. Prize & Winner Tracking | 4/4 | Complete | 2026-01-31 |
| 8. Game Prep UI | 5/5 | Complete | 2026-01-25 |
| 9. Testing & Quality | 5/5 | Complete | 2026-01-31 |
| 10. Post-Launch Fixes | 2/2 | Complete | 2026-02-01 |

**Milestone 1 Complete: 2026-02-01**

---

# Milestone 2: Data Architecture & Online Mode

Unified data architecture enabling prize persistence, online players, and hybrid paper+phone games.

## Overview

Current architecture has two disconnected storage systems (SQLite for Prep, JSON for runtime). This milestone consolidates to SQLite as single source of truth, enabling:
- Prize tracking with persistent winner history
- Server restart resilience (no lost game state)
- Online mode (players use phones instead of paper cards)
- Hybrid mode (mix of paper + online cards)

## Phases

- [ ] **Phase 1: SQLite Migration** - Unified data layer, prize tracking, game state persistence
- [ ] **Phase 2: Online Player Foundation** - Cards as first-class entities, player card assignment
- [ ] **Phase 3: Online Player UI** - Phone player interface, real-time sync
- [ ] **Phase 4: Hybrid Mode** - Mixed paper + online games, card type management

## Phase Details

### Phase 1: SQLite Migration
**Goal**: SQLite as single source of truth with prize tracking and persistent game state
**Depends on**: Milestone 1 complete
**Research**: Likely (WebSocket/SSE for real-time sync, migration strategies)
**Plans**: TBD

Features:
- `winners` table for prize assignment tracking
- `game_sessions` and `played_songs` tables for persistent game state
- Winner history/log in Host view
- Export winner log for record keeping
- Remove JSON file dependency (Prep → Host integration fixed)
- GameState hydrates from DB, persists on change
- Server restart = no data loss

### Phase 2: Online Player Foundation
**Goal**: Cards become first-class database entities, foundation for online play
**Depends on**: Phase 1
**Research**: Unlikely
**Plans**: TBD

Features:
- `cards` table (move from JSON blob to proper entities)
- `player_cards` table for assignment tracking
- Card generation writes to DB
- PDF storage in DB (optional, for reprints)

### Phase 3: Online Player UI
**Goal**: Players can use phones instead of paper cards
**Depends on**: Phase 2
**Research**: Likely (real-time sync at scale, mobile UX patterns)
**Plans**: TBD

Features:
- Phone player interface (view card, mark squares, submit bingo)
- Real-time sync (WebSockets/SSE instead of polling)
- Player session management
- Scalable to 50+ concurrent players

### Phase 4: Hybrid Mode
**Goal**: Support mixed paper + online games at same venue
**Depends on**: Phase 3
**Research**: Unlikely
**Plans**: TBD

Features:
- Configure paper_card_count vs max_cards per game
- First N cards printed for tech-challenged players
- Remaining cards available online
- Unified winner detection across card types

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. SQLite Migration | 0/? | Not Started | — |
| 2. Online Player Foundation | 0/? | Not Started | — |
| 3. Online Player UI | 0/? | Not Started | — |
| 4. Hybrid Mode | 0/? | Not Started | — |
