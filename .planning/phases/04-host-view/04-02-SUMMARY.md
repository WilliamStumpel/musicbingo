---
phase: 04-host-view
plan: 02
subsystem: ui
tags: [react, fastapi, state-management, api]

# Dependency graph
requires:
  - phase: 04-01
    provides: Host view with Call Board, Now Playing, Pattern Selection
provides:
  - Reset Round API endpoint to clear played songs
  - GameControls component with Reset button
  - resetRound action in useGameState hook
affects: [05-player-view, 06-game-modes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Confirmation dialog using window.confirm for destructive actions
    - Optimistic state update with complete state rollback

key-files:
  created:
    - musicbingo_host/src/components/GameControls.jsx
    - musicbingo_host/src/components/GameControls.css
  modified:
    - musicbingo_api/src/musicbingo_api/main.py
    - musicbingo_api/src/musicbingo_api/game_service.py
    - musicbingo_host/src/services/gameApi.js
    - musicbingo_host/src/hooks/useGameState.js
    - musicbingo_host/src/App.js

key-decisions:
  - "Use window.confirm for reset confirmation (simple, no modal library needed)"
  - "Red danger color (#dc3545) for reset button to indicate destructive action"
  - "Reset clears played_songs, playedOrder, and nowPlaying state"

patterns-established:
  - "Pattern 1: Confirmation dialog for destructive actions before API call"

issues-created: []

# Metrics
duration: 3min
completed: 2026-01-18
---

# Phase 4 Plan 02: Game Controls & Reset API Summary

**Added reset round functionality with POST /api/game/{id}/reset endpoint, GameControls component with confirmation dialog, and resetRound action clearing all play state.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-18T20:15:00Z
- **Completed:** 2026-01-18T20:18:00Z
- **Tasks:** 3/3
- **Files modified:** 7

## Accomplishments

- Added reset_round method to GameService that clears played_songs while preserving cards and pattern
- Created POST /api/game/{game_id}/reset endpoint returning GameStateResponse with empty played_songs
- Added resetRound function to gameApi.js service
- Added resetRound action to useGameState hook with optimistic update and rollback
- Created GameControls component with Reset Round button and window.confirm dialog
- Integrated GameControls into App.js header next to PatternSelector

## Task Commits

Each task was committed atomically:

1. **Task 1: Add reset_round endpoint to API** - `704ff2dc` (feat)
2. **Task 2: Add reset action to useGameState hook** - `d8a7c593` (feat)
3. **Task 3: Create GameControls component with Reset button** - `e17b5ce0` (feat)

## Files Created/Modified

- `musicbingo_api/src/musicbingo_api/game_service.py` - Added reset_round method
- `musicbingo_api/src/musicbingo_api/main.py` - Added POST /api/game/{id}/reset endpoint
- `musicbingo_host/src/services/gameApi.js` - Added resetRound API function
- `musicbingo_host/src/hooks/useGameState.js` - Added resetRound action with optimistic update
- `musicbingo_host/src/components/GameControls.jsx` - New component with Reset Round button
- `musicbingo_host/src/components/GameControls.css` - Styling for GameControls (red danger button)
- `musicbingo_host/src/App.js` - Integrated GameControls in header

## Decisions Made

- **window.confirm for confirmation:** Simple native dialog, no need for modal library
- **Red danger color:** Using #dc3545 (Bootstrap danger red) for reset button to indicate destructive action
- **Complete state clear:** Reset clears playedSongs Set, playedOrder array, and nowPlaying state

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

- Phase 4 (Host View) is now complete with all 2 plans finished
- DJ can load games, mark songs as played, see Call Board, select patterns, and reset rounds
- Ready for Phase 5: Player View
- All functionality works across host and scanner apps via API sync

---
*Phase: 04-host-view*
*Completed: 2026-01-18*
