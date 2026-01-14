# Music Bingo

## What This Is

A professional DJ system for running music bingo games at bars and venues. DJs prepare games in advance, print QR-coded bingo cards, play song clips via Spotify, and instantly verify winners with a phone scanner. Built for smooth host experience with no technical hiccups during live events.

## Core Value

**Smooth host experience** — the DJ can focus on the crowd and the energy, not on fighting software. Every interaction must be fast, reliable, and obvious.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- [x] Card generation with 5x5 grid, 24 songs + free center — existing
- [x] 30-40% song overlap algorithm for optimal card distribution — existing
- [x] QR code generation (unique per card) — existing
- [x] PDF card export — existing
- [x] CLI interface for card generation — existing
- [x] Playlist input parsing (CSV/JSON/TXT) — existing
- [x] Verification API endpoint (GET /api/verify/{game_id}/{card_id}) — existing
- [x] Game state management (in-memory) — existing
- [x] QR scanner PWA with camera access — existing
- [x] QR payload parsing and validation — existing
- [x] Winner validation logic — existing
- [x] Green/red verification result UI — existing
- [x] PWA deployed to GitHub Pages — existing
- [x] Card generator ↔ API integration (JSON export/bulk import) — existing
- [x] 5-in-a-row pattern (row, column, or diagonal) — existing

### Active

<!-- Current scope. Building toward these. -->

**Local Deployment**
- [ ] Run backend on laptop (local network)
- [ ] Phone scanner connects via WiFi to local backend
- [ ] Simple game selector dropdown (switch between 8 pre-loaded games)

**Card Printing**
- [ ] 4 cards per 8.5x11 letter page layout
- [ ] Custom branding (venue logo, DJ contact info)
- [ ] Generate 50-200+ cards per game (flexible per venue size)

**Spotify Playback**
- [ ] Spotify OAuth authentication with Premium account
- [ ] Built-in playback via Spotify Web Playback SDK
- [ ] Randomize song order for each game
- [ ] Configurable clip length (seconds) per game/mode
- [ ] Configurable clip start point (default 30s into song)

**Host View (Laptop)**
- [ ] Full playback controls (play, pause, skip, replay)
- [ ] Current song display
- [ ] Call board (song history)
- [ ] Game management (select game, select pattern, start/end)
- [ ] Pause game → triggers background music playlist
- [ ] Resume game → stops background, continues bingo

**Player View (HDMI Output)**
- [ ] Separate window for external monitor/TV
- [ ] Call board showing played songs
- [ ] Delayed song title reveal (shows halfway through clip)
- [ ] Current winning pattern display

**Game Modes & Patterns**
- [ ] Multiple patterns: 5-in-a-row, four corners, X pattern, blackout, frame
- [ ] Pattern selection per round
- [ ] Lightning rounds (shorter clips)

**Prize & Winner Tracking**
- [ ] Track all winners per game (multiple on same song = all win)
- [ ] Prize types: cash (split if multiple), gift cards, drink tickets, physical
- [ ] Winner log for prize distribution
- [ ] Prize configuration per game

**Testing & Quality**
- [ ] Unit tests for card generation algorithm
- [ ] Unit tests for QR parser and API client
- [ ] Unit tests for React components
- [ ] E2E tests with Playwright
- [ ] Manual device testing on real hardware

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Online/virtual game mode (Zoom/Meet) — v2 feature, focus on in-venue first
- Multi-tenant SaaS deployment — v2+, after proving single-user works
- Subscription system for other DJs/bars — v2+, requires multi-tenant
- Offline verification mode — online verification via local network is sufficient
- Player self-scanning — DJ scans to maintain control and showmanship

## Context

**Current State:**
- Card generator (Python/Click) is functional with PDF export and QR codes
- FastAPI backend handles game state and verification (in-memory, no persistence)
- React PWA for QR scanning deployed to GitHub Pages
- Integration script connects card generator to API
- All three components work independently but need unified workflow

**Workflow Vision:**
1. **Prep (before gig):** Create 8 playlists in Spotify, generate card sets for each, print cards
2. **Setup (at venue):** Start local server, load games, connect phone to WiFi
3. **Play:** Select game, start playback, songs play with delayed reveal on player screen
4. **Bingo:** Pause game (background music starts), scan card, verify, award prize, resume
5. **Repeat:** Multiple rounds with different patterns, lightning rounds to mix it up

**Target User:** Professional DJ running music bingo at bars/venues. Needs reliability over features.

**Future Vision:** SaaS platform where other DJs and bars can subscribe and run their own games.

## Constraints

- **Platform**: Local-first deployment (laptop + phone on same WiFi) — no cloud dependency during games
- **Spotify**: Requires Premium account for Web Playback SDK
- **Print**: Standard 8.5x11 letter paper, 4 cards per page
- **Game Prep**: Support 8 pre-loaded games per gig
- **Tech Stack**: Python backend (FastAPI), React frontend, Spotify Web Playback SDK

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Local-first over cloud | No venue WiFi dependencies, faster verification | — Pending |
| Spotify Web Playback SDK | DJ already has Premium, better than local files | — Pending |
| Delayed song reveal on player screen | Rewards music knowledge, more engaging | — Pending |
| DJ scans (not player self-scan) | Maintains showmanship and prize control | — Pending |
| Background music on pause | No dead air during verification | — Pending |
| Multiple winners on same song | Fair to all who got bingo, standard for cash games | — Pending |

---
*Last updated: 2026-01-14 after initialization (migrated from Beads)*
