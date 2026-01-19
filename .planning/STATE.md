# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-14)

**Core value:** Smooth host experience — the DJ can focus on the crowd and the energy, not on fighting software.
**Current focus:** Phase 4 — Host View (laptop interface with call board, pattern selection)

## Current Position

Phase: 4 of 8 (Host View)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-01-18 — Completed 04-01 (Now Playing, Call Board & Pattern Selection)

Progress: ██████░░░░ 48%

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

---

**Spotify → Apple Music (2026-01-14)**

Spotify paused new app registrations, blocking Phase 3 implementation. After researching alternatives:
- Tidal: 30-second limit for third-party apps
- Amazon Music: Closed beta
- Deezer: 30-second limit
- YouTube Music: No official playback API

**Decision:** Pivot to Apple Music via MusicKit JS (subsequently pivoted to Manual Playback)

## Performance Metrics

**Velocity:**
- Total plans completed: 11 (Phases 1-3 complete, Phase 4 in progress)
- Average duration: 4.4 min
- Total execution time: 48 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 3/3 | 7 min | 2.3 min |
| 2 | 3/3 | 26 min | 8.7 min |
| 3 | 4/4 | 11 min | 2.8 min |
| 4 | 1/2 | 4 min | 4.0 min |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- CORS regex for private network IPs (allow_origin_regex pattern)
- UDP socket to 8.8.8.8 for reliable local IP detection
- JSON game format matches card generator export structure
- Games directory at project root for easy access
- localStorage for server URL persistence in scanner PWA
- Auto-add http:// protocol for user-entered IP addresses
- 4-up layout uses 0.6 inch cells (fits 3.5x4.5 inch cards in 2x2 grid)
- Card limit increased to 1000 (from 200) for large venue support
- Canvas-based PDF rendering for complex multi-card layouts
- Word wrap + dynamic font sizing for 4-up cells (min 4pt, max 2 lines each for title/artist)
- Image conversion to RGB PNG buffer for reliable rendering (supports JPEG, PNG, etc.)
- **Manual Playback Mode** - DJ uses existing music player, marks songs in app (service-agnostic)
- **Exportify CSV import** - Standard format for playlist import from Spotify exports
- **2-second polling** - Simple sync mechanism between host and scanner apps
- **Song ID generation** - SHA256 hash of lowercase title+artist, truncated to 12 chars
- **Optimistic updates** - Toggle song played status immediately, rollback on API error
- **Game API service pattern** - All backend calls go through gameApi.js
- **30/70 column split** - Call Board 30%, Song Checklist 70% for desktop host view
- **Amber (#ffc107) for now playing** - Distinct from green (played) with pulsing animation
- **Combined click action** - Clicking song sets as now playing AND marks played
- **playedOrder array** - Track play order separate from playedSongs Set for Call Board history

### Deferred Issues

None yet.

### Pending Todos

None yet.

### Blockers/Concerns

None - Manual Playback Mode removes all streaming API dependencies.

## Session Continuity

Last session: 2026-01-18
Stopped at: Completed 04-01-PLAN.md (Now Playing, Call Board & Pattern Selection)
Resume file: None
Next action: Execute 04-02-PLAN.md (Game Controls & Reset API)
