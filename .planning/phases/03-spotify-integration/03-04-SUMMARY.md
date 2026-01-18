---
phase: 03-manual-playback
plan: 04
subsystem: api
tags: [fastapi, api, toggle, sync]

# Dependency graph
requires:
  - phase: 03-01
    provides: CSV playlist import creates games with songs array
provides:
  - POST /api/game/{id}/mark-song endpoint for toggling song played status
  - Songs array in LoadGameResponse for checklist display
affects: [03-02, 03-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - String-based song_id in API for flexibility (converted to UUID internally)
    - Toggle pattern for mark/unmark with single endpoint

key-files:
  created: []
  modified:
    - musicbingo_api/src/musicbingo_api/schemas.py
    - musicbingo_api/src/musicbingo_api/game_service.py
    - musicbingo_api/src/musicbingo_api/main.py

key-decisions:
  - "Use string song_id in API request for flexibility with different ID formats"
  - "Include songs array in LoadGameResponse for checklist display"
  - "Single toggle endpoint handles both mark and unmark operations"

patterns-established:
  - "Toggle endpoint pattern: played=true to mark, played=false to unmark"

issues-created: []

# Metrics
duration: 3min
completed: 2026-01-18
---

# Phase 3 Plan 04: API Sync Endpoints Summary

**Mark-song toggle endpoint and songs array for host/scanner checklist sync**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-18T16:30:00Z
- **Completed:** 2026-01-18T16:34:00Z
- **Tasks:** 5
- **Files modified:** 3

## Accomplishments

- Added MarkSongRequest/MarkSongResponse schemas for toggle operations
- Added SongInfo schema for checklist song display
- Updated LoadGameResponse to include songs array
- Added toggle_song_played method to GameService (string to UUID conversion)
- Added POST /api/game/{id}/mark-song endpoint with toggle support
- Verified all endpoints work via curl testing

## Task Commits

1. **All tasks in single commit** - `9b86a7a1` (feat)

## Files Modified

- `musicbingo_api/src/musicbingo_api/schemas.py` - Added MarkSongRequest, MarkSongResponse, SongInfo; updated LoadGameResponse
- `musicbingo_api/src/musicbingo_api/game_service.py` - Added toggle_song_played method
- `musicbingo_api/src/musicbingo_api/main.py` - Added mark-song endpoint, updated load_game to include songs

## Decisions Made

- **String song_id:** API accepts string, converts to UUID internally for flexibility
- **Toggle endpoint:** Single endpoint handles mark (played=true) and unmark (played=false)
- **Songs in load response:** Checklist apps get songs when loading game, no extra request needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

- Host app can now mark songs via /api/game/{id}/mark-song
- Scanner app (03-03) can use same endpoint
- Both can poll /api/game/{id}/state for sync
- LoadGameResponse includes songs array for checklist display

---
*Phase: 03-manual-playback*
*Completed: 2026-01-18*
