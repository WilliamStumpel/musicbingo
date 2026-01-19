---
phase: 05-player-view
plan: 03
subsystem: api, ui
tags: [reveal, delayed-title, game-state, localStorage, auto-timer]

# Dependency graph
requires:
  - phase: 05-01
    provides: Player window route and layout
provides:
  - revealed_songs API endpoint
  - Auto-reveal timer (15 second delay)
  - Manual reveal button in host view
  - revealedSongs state sync via polling and localStorage
affects: [05-04, player-view]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "localStorage for cross-window sync (revealedSongs, nowPlaying)"
    - "Auto-reveal timer with cancel on song change"

key-files:
  created: []
  modified:
    - musicbingo_api/src/musicbingo_api/models.py
    - musicbingo_api/src/musicbingo_api/game_service.py
    - musicbingo_api/src/musicbingo_api/schemas.py
    - musicbingo_api/src/musicbingo_api/main.py
    - musicbingo_host/src/services/gameApi.js
    - musicbingo_host/src/hooks/useGameState.js
    - musicbingo_host/src/pages/HostView.jsx
    - musicbingo_host/src/components/SongChecklist.jsx
    - musicbingo_host/src/components/SongChecklist.css

key-decisions:
  - "15 second auto-reveal delay - gives players time to recognize songs by ear"
  - "Manual reveal button only for now-playing song - prevents accidental reveals"
  - "Revealed state synced via localStorage for player view"

patterns-established:
  - "Auto-timer pattern: start on action, cancel on change/reset"

issues-created: []

# Metrics
duration: 6min
completed: 2026-01-19
---

# Phase 5 Plan 03: Delayed Song Reveal Summary

**Delayed song reveal with 15-second auto-timer, manual reveal button, and cross-window sync via localStorage**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-19T02:14:30Z
- **Completed:** 2026-01-19T02:20:49Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- API support for revealed_songs state with reveal endpoint
- Auto-reveal timer (15 seconds) when song set as now playing
- Manual reveal button in host checklist for immediate reveal
- Visual indicators showing reveal state (? for hidden, "Revealed" for visible)
- Cross-window sync via localStorage for player view integration

## Task Commits

Each task was committed atomically:

1. **Task 1: Add revealed_songs to game state and API** - `dbc33d16` (feat)
2. **Task 2: Add reveal functionality to useGameState hook** - `c383a164` (feat)
3. **Task 3: Add manual reveal button to host view** - `a59899e9` (feat)

## Files Created/Modified

- `musicbingo_api/src/musicbingo_api/models.py` - Added revealed_songs field to GameState
- `musicbingo_api/src/musicbingo_api/game_service.py` - Added reveal_song method, updated reset_round
- `musicbingo_api/src/musicbingo_api/schemas.py` - Added revealed_songs to GameStateResponse
- `musicbingo_api/src/musicbingo_api/main.py` - Added POST /api/game/{id}/reveal/{song_id} endpoint
- `musicbingo_host/src/services/gameApi.js` - Added revealSong API function
- `musicbingo_host/src/hooks/useGameState.js` - Added revealedSongs state, auto-reveal timer, revealSong action
- `musicbingo_host/src/pages/HostView.jsx` - Pass revealedSongs and revealSong to SongChecklist
- `musicbingo_host/src/components/SongChecklist.jsx` - Show reveal button and indicators
- `musicbingo_host/src/components/SongChecklist.css` - Styles for reveal button and indicators

## Decisions Made

- **15 second reveal delay** - Gives players enough time to recognize songs by ear before title appears
- **Manual reveal only for now-playing** - Prevents accidental reveals of future songs
- **localStorage sync** - Enables player view to react to reveal state without direct API calls

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

- Reveal state ready for player view to consume via localStorage
- Ready for 05-04 (Pattern Display)

---
*Phase: 05-player-view*
*Completed: 2026-01-19*
