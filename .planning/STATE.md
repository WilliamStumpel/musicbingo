# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-01)

**Core value:** Smooth host experience — the DJ can focus on the crowd and the energy, not on fighting software.
**Current focus:** v1.0 shipped — Ready for Milestone 2 planning

## Current Position

Milestone: 2 of 2 (Data Architecture & Online Mode)
Phase: 11 of 14 (SQLite Migration)
Status: **NOT STARTED**
Last activity: 2026-02-01 — v1.0 milestone archived

Progress: ██████████ 100% (Milestone 1) | ░░░░░░░░░░ 0% (Milestone 2)

## Shipped

**v1.0 Paper Card System** (2026-02-01)
- Complete application for running music bingo with printed paper cards
- 10 phases, 33 plans, 20,442 LOC, 20 days
- See: .planning/MILESTONES.md

## Pivot Notes

**Apple Music → Manual Playback (2026-01-18)**

Apple Developer Program setup blocked progress. User proposed simpler approach:
- DJ plays music directly in Spotify/Apple Music/any player with shuffle on
- App provides sortable/searchable song checklist to mark songs as played
- No streaming API integration required

**Decision:** Pivot to Manual Playback Mode
- Works with ANY music source (service-agnostic)
- No developer accounts or API keys needed
- Import playlists via Exportify CSV export
- Both host and scanner apps can mark songs
- Real-time sync via API polling (2 second interval)

## Performance Metrics

**v1.0 Velocity:**
- Total plans completed: 33
- Average duration: ~7 min
- Total execution time: ~4 hours
- Timeline: 20 days (2026-01-12 → 2026-02-01)

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Key architectural decisions from v1.0:

- Local-first over cloud — no venue WiFi dependencies
- Manual playback mode — service-agnostic, no API registrations
- ngrok for venue HTTPS — iOS camera requires HTTPS
- localStorage for cross-window sync — simple, reliable
- SQLite for Prep data — structured storage for venues, nights, games
- Repository pattern — separate database logic from route handlers

### Deferred Issues

**Prep → Host Integration Bugs (found 2026-01-31):**
1. **Game JSON not exported to games/ folder** - Card generation saves to `data/generated/{id}/game.json` but Host looks in `games/` folder. Workaround: manually copy files.
2. **Exported JSON missing fields** - CardExporter only saves `game_id` and `cards`, but Host also needs `name` and `playlist`. Workaround: augment JSON with database data.
3. **Song ID format mismatch** - Playlist uses 12-char hex IDs, but cards use UUID format (MD5 hash). Workaround: convert playlist IDs to UUID format.

*These issues will be resolved in Milestone 2, Phase 11 (SQLite Migration) which removes the JSON file dependency.*

### Pending Todos

None — Ready for Milestone 2 planning.

### Blockers/Concerns

None — v1.0 complete. Milestone 2 planning can begin when ready.

## Session Continuity

Last session: 2026-02-01
Stopped at: v1.0 milestone archived
Resume file: None
Next action: Milestone 2 planning when ready (`/gsd:discuss-phase` for Phase 11 or `/gsd:plan-phase 11`)
