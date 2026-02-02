# Roadmap: Music Bingo

## Overview

Transform the existing card generator, verification API, and scanner PWA into a complete DJ system for running music bingo at venues. Starting with local deployment infrastructure, we'll add professional card printing, manual song tracking (DJ plays music in any player), host controls, player display, multiple game modes, and prize tracking. The journey goes from three disconnected tools to one smooth workflow.

## Domain Expertise

None

---

## Milestones

- [v1.0 Paper Card System](milestones/v1.0-ROADMAP.md) (Phases 1-10) — SHIPPED 2026-02-01
- **v2.0 Data Architecture & Online Mode** — Phases 11-14 (planned)

---

## Completed Milestones

<details>
<summary>v1.0 Paper Card System (Phases 1-10) — SHIPPED 2026-02-01</summary>

Complete application for running music bingo for a printed paper card game at venues.

- [x] Phase 1: Local Backend Infrastructure (5/5 plans) — 2026-01-22
- [x] Phase 2: Card Printing System (1/1 plan) — 2026-01-14
- [x] Phase 3: Manual Playback Mode (4/4 plans) — 2026-01-18
- [x] Phase 4: Host View (2/2 plans) — 2026-01-18
- [x] Phase 5: Player View (4/4 plans) — 2026-01-19
- [x] Phase 6: Game Modes & Patterns (1/1 plan) — 2026-01-19
- [x] Phase 7: Prize & Winner Tracking (4/4 plans) — 2026-01-31
- [x] Phase 8: Game Prep UI (5/5 plans) — 2026-01-25
- [x] Phase 9: Testing & Quality (5/5 plans) — 2026-01-31
- [x] Phase 10: Post-Launch Fixes (2/2 plans) — 2026-02-01

**Stats:** 10 phases, 33 plans, 20,442 LOC, 20 days

</details>

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

**Phase Numbering:**
- Integer phases (11, 12, 13): Planned milestone work
- Decimal phases (11.1, 11.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 11: SQLite Migration** - Unified data layer, prize tracking, game state persistence
- [ ] **Phase 12: Online Player Foundation** - Cards as first-class entities, player card assignment
- [ ] **Phase 13: Online Player UI** - Phone player interface, real-time sync
- [ ] **Phase 14: Hybrid Mode** - Mixed paper + online games, card type management

## Phase Details

### Phase 11: SQLite Migration
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

### Phase 12: Online Player Foundation
**Goal**: Cards become first-class database entities, foundation for online play
**Depends on**: Phase 11
**Research**: Unlikely
**Plans**: TBD

Features:
- `cards` table (move from JSON blob to proper entities)
- `player_cards` table for assignment tracking
- Card generation writes to DB
- PDF storage in DB (optional, for reprints)

### Phase 13: Online Player UI
**Goal**: Players can use phones instead of paper cards
**Depends on**: Phase 12
**Research**: Likely (real-time sync at scale, mobile UX patterns)
**Plans**: TBD

Features:
- Phone player interface (view card, mark squares, submit bingo)
- Real-time sync (WebSockets/SSE instead of polling)
- Player session management
- Scalable to 50+ concurrent players

### Phase 14: Hybrid Mode
**Goal**: Support mixed paper + online games at same venue
**Depends on**: Phase 13
**Research**: Unlikely
**Plans**: TBD

Features:
- Configure paper_card_count vs max_cards per game
- First N cards printed for tech-challenged players
- Remaining cards available online
- Unified winner detection across card types

## Progress

**Execution Order:**
Phases execute in numeric order: 11 → 12 → 13 → 14

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 11. SQLite Migration | 0/? | Not Started | — |
| 12. Online Player Foundation | 0/? | Not Started | — |
| 13. Online Player UI | 0/? | Not Started | — |
| 14. Hybrid Mode | 0/? | Not Started | — |
