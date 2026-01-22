# Roadmap: Music Bingo

## Overview

Transform the existing card generator, verification API, and scanner PWA into a complete DJ system for running music bingo at venues. Starting with local deployment infrastructure, we'll add professional card printing, manual song tracking (DJ plays music in any player), host controls, player display, multiple game modes, and prize tracking. The journey goes from three disconnected tools to one smooth workflow.

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Local Backend Infrastructure** - Run backend on laptop, phone scanner connects via WiFi
- [ ] **Phase 2: Card Printing System** - 4 cards per page with custom branding for venues
- [ ] **Phase 3: Manual Playback Mode** - CSV playlist import, song checklist for marking played songs
- [ ] **Phase 4: Host View** - Laptop interface with playback controls, call board, game management
- [ ] **Phase 5: Player View** - HDMI output with call board, delayed song reveal, pattern display
- [ ] **Phase 6: Game Modes & Patterns** - Multiple patterns, pattern selection, lightning rounds
- [ ] **Phase 7: Prize & Winner Tracking** - Winner log, prize types, multi-winner handling
- [ ] **Phase 8: Testing & Quality** - Unit tests, E2E tests, manual device testing

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
**Plans**: 3

Plans:
- [ ] 07-01: Card Registration (backend + scanner UI for assigning player names to cards)
- [ ] 07-02: Winner Detection & Prize Config (proactive detection, card statuses, prize setting, host toasts)
- [ ] 07-03: Host Panel & Venue Display (card status slide-out, winner log, prize display, winner announcement)

### Phase 8: Testing & Quality
**Goal**: Comprehensive test coverage and real device validation
**Depends on**: Phases 1-7
**Research**: Unlikely (pytest/Playwright established patterns)
**Plans**: TBD

Plans:
- [ ] 08-01: Unit tests for card generation algorithm
- [ ] 08-02: Unit tests for QR parser and API client
- [ ] 08-03: Unit tests for React components
- [ ] 08-04: E2E tests with Playwright
- [ ] 08-05: Manual device testing protocol

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Local Backend Infrastructure | 5/5 | Complete | 2026-01-22 |
| 2. Card Printing System | 1/1 | Complete | 2026-01-14 |
| 3. Manual Playback Mode | 4/4 | Complete | 2026-01-18 |
| 4. Host View | 2/2 | Complete | 2026-01-18 |
| 5. Player View | 4/4 | Complete | 2026-01-19 |
| 6. Game Modes & Patterns | 1/1 | Complete | 2026-01-19 |
| 7. Card Registration & Winner Tracking | 0/3 | Not started | - |
| 8. Testing & Quality | 0/5 | Not started | - |
