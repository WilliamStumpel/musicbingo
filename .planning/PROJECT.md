# Music Bingo

## What This Is

A professional DJ system for running music bingo games at bars and venues. DJs prepare games in a browser-based UI, print QR-coded bingo cards, play music via any player (Spotify, Apple Music, etc.), and instantly verify winners with a phone scanner. Includes host controls, TV player display with delayed song reveal, and winner celebration announcements.

## Core Value

**Smooth host experience** — the DJ can focus on the crowd and the energy, not on fighting software. Every interaction must be fast, reliable, and obvious.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- Card generation with 5x5 grid, 24 songs + free center — v1.0
- 30-40% song overlap algorithm for optimal card distribution — v1.0
- QR code generation (unique per card) — v1.0
- PDF card export with 4-up layout and venue branding — v1.0
- Playlist input parsing (CSV/JSON) — v1.0
- Verification API endpoint — v1.0
- Game state management (in-memory) — v1.0
- QR scanner PWA with camera access — v1.0
- Green/red verification result UI — v1.0
- Local backend deployment (laptop + phone on WiFi) — v1.0
- One-click venue startup with ngrok HTTPS — v1.0
- Manual playback mode (service-agnostic) — v1.0
- Host view with call board, pattern selection, game controls — v1.0
- Player view with delayed song reveal and pattern display — v1.0
- 8 bingo patterns (row, column, diagonal, corners, X, frame, blackout, any line) — v1.0
- Card registration to players — v1.0
- Proactive winner detection — v1.0
- Prize configuration and winner celebration on TV — v1.0
- Browser-based Game Prep UI (venues, nights, games, CSV upload) — v1.0
- Card generation from browser with PDF download — v1.0
- Unit tests for card generation, QR parser, React components — v1.0
- E2E tests with Playwright — v1.0

### Active

<!-- Current scope. Building toward these. -->

**Milestone 2: Data Architecture & Online Mode**
- [ ] SQLite as single source of truth (replace JSON files)
- [ ] Prize tracking with persistent winner history
- [ ] Server restart resilience (no lost game state)
- [ ] Cards as first-class database entities
- [ ] Online player mode (phones instead of paper cards)
- [ ] Real-time sync (WebSockets/SSE instead of polling)
- [ ] Hybrid mode (mix paper + online cards)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Streaming API integration (Spotify/Apple Music SDK) — Manual playback works better, no developer accounts needed
- Online/virtual game mode (Zoom/Meet) — Focus on in-venue first
- Multi-tenant SaaS deployment — After proving single-user works
- Subscription system for other DJs/bars — Requires multi-tenant
- Offline verification mode — Online verification via local network is sufficient
- Player self-scanning — DJ scans to maintain control and showmanship

## Context

**Current State:**
- v1.0 shipped with complete paper card game workflow
- 20,442 lines of Python + JavaScript/React
- Tech stack: FastAPI, React, SQLite (Prep), ReportLab, Playwright
- Manual playback mode works with any music source
- Two disconnected storage systems need consolidation (Milestone 2)

**Known Issues:**
- Prep → Host integration requires manual JSON file copy
- Game state lost on server restart (in-memory only)
- Will be resolved in Milestone 2 SQLite migration

**Target User:** Professional DJ running music bingo at bars/venues. Needs reliability over features.

## Constraints

- **Platform**: Local-first deployment (laptop + phone on same WiFi) — no cloud dependency during games
- **Print**: Standard 8.5x11 letter paper, 4 cards per page
- **Tech Stack**: Python backend (FastAPI), React frontend, SQLite database

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Local-first over cloud | No venue WiFi dependencies, faster verification | Good |
| Manual playback mode | Works with any music source, no API registrations | Good |
| Delayed song reveal on player screen | Rewards music knowledge, more engaging | Good |
| DJ scans (not player self-scan) | Maintains showmanship and prize control | Good |
| Background music on pause | No dead air during verification | Pending |
| Multiple winners on same song | Fair to all who got bingo, standard for cash games | Good |
| ngrok for venue HTTPS | iOS camera requires HTTPS, works at any venue | Good |
| localStorage for cross-window sync | Simple, reliable for host/player coordination | Good |
| SQLite for Prep data | Structured storage for venues, nights, games | Good |
| CSV playlist import (Exportify) | Standard format, no Spotify API needed | Good |

---
*Last updated: 2026-02-01 after v1.0 milestone*
