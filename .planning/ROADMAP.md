# Roadmap: Music Bingo

## Overview

Transform the existing card generator, verification API, and scanner PWA into a complete DJ system for running music bingo at venues. Starting with local deployment infrastructure, we'll add professional card printing, Spotify playback integration, host controls, player display, multiple game modes, and prize tracking. The journey goes from three disconnected tools to one smooth workflow.

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Local Backend Infrastructure** - Run backend on laptop, phone scanner connects via WiFi
- [ ] **Phase 2: Card Printing System** - 4 cards per page with custom branding for venues
- [ ] **Phase 3: Spotify Integration** - OAuth authentication and Web Playback SDK for song clips
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
- [ ] 01-02: Game selector with 8 pre-loaded games
- [ ] 01-03: Scanner PWA connection to local backend

### Phase 2: Card Printing System
**Goal**: Generate professional print-ready PDFs with 4 cards per letter page and venue branding
**Depends on**: Phase 1
**Research**: Unlikely (ReportLab already in codebase)
**Plans**: TBD

Plans:
- [ ] 02-01: 4-up card layout for 8.5x11 pages
- [ ] 02-02: Custom branding (venue logo, DJ contact info)
- [ ] 02-03: Flexible card count generation (50-200+)

### Phase 3: Spotify Integration
**Goal**: Authenticate with Spotify Premium and play song clips via Web Playback SDK
**Depends on**: Phase 1
**Research**: Likely (external API integration)
**Research topics**: Spotify Web Playback SDK current docs, OAuth PKCE flow for desktop/local apps, SDK browser requirements, clip start/duration controls
**Plans**: TBD

Plans:
- [ ] 03-01: Spotify OAuth authentication flow
- [ ] 03-02: Web Playback SDK integration
- [ ] 03-03: Song clip configuration (start point, duration)
- [ ] 03-04: Random song order per game

### Phase 4: Host View
**Goal**: Laptop interface for DJ with playback controls, current song, call board, and game management
**Depends on**: Phase 3
**Research**: Unlikely (React patterns, internal UI)
**Plans**: TBD

Plans:
- [ ] 04-01: Playback controls (play, pause, skip, replay)
- [ ] 04-02: Current song and call board display
- [ ] 04-03: Game management (select game, select pattern, start/end)
- [ ] 04-04: Background music on pause/resume

### Phase 5: Player View
**Goal**: Separate window for venue TV/projector with call board and delayed song title reveal
**Depends on**: Phase 4
**Research**: Unlikely (React patterns, multi-window is standard)
**Plans**: TBD

Plans:
- [ ] 05-01: Separate window for HDMI output
- [ ] 05-02: Call board showing played songs
- [ ] 05-03: Delayed song title reveal (halfway through clip)
- [ ] 05-04: Current winning pattern display

### Phase 6: Game Modes & Patterns
**Goal**: Support multiple bingo patterns and lightning rounds with shorter clips
**Depends on**: Phase 4
**Research**: Unlikely (extending existing validation logic)
**Plans**: TBD

Plans:
- [ ] 06-01: Pattern definitions (5-in-a-row, four corners, X, blackout, frame)
- [ ] 06-02: Pattern selection per round
- [ ] 06-03: Lightning rounds (shorter clips)

### Phase 7: Prize & Winner Tracking
**Goal**: Track winners, handle multiple winners on same song, configure prizes per game
**Depends on**: Phase 4
**Research**: Unlikely (internal data management)
**Plans**: TBD

Plans:
- [ ] 07-01: Winner tracking (multiple winners on same song)
- [ ] 07-02: Prize types configuration (cash, gift cards, drink tickets, physical)
- [ ] 07-03: Winner log for prize distribution

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
| 1. Local Backend Infrastructure | 1/3 | In progress | - |
| 2. Card Printing System | 0/3 | Not started | - |
| 3. Spotify Integration | 0/4 | Not started | - |
| 4. Host View | 0/4 | Not started | - |
| 5. Player View | 0/4 | Not started | - |
| 6. Game Modes & Patterns | 0/3 | Not started | - |
| 7. Prize & Winner Tracking | 0/3 | Not started | - |
| 8. Testing & Quality | 0/5 | Not started | - |
