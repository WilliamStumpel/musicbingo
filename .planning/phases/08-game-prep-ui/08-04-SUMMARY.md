---
phase: 08-game-prep-ui
plan: 04
subsystem: ui, api, database
tags: [fastapi, react, sqlite, crud, csv]

# Dependency graph
requires:
  - phase: 08-03
    provides: VenueNight CRUD patterns (repository, routes, React component)
provides:
  - Game CRUD API endpoints (/api/prep/games)
  - Game repository layer with CSV parsing
  - GameManager React component with CSV upload and preview
  - Games tab in PrepView
affects: [08-05] # Card generation and PDF export will depend on games

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Game repository with parsed playlist from JSON
    - CSV parsing for Exportify format with song ID generation
    - List/detail view toggle pattern for CRUD UI

key-files:
  created:
    - musicbingo_api/src/musicbingo_api/game_repository.py
    - musicbingo_api/src/musicbingo_api/game_routes.py
    - musicbingo_host/src/components/GameManager.jsx
    - musicbingo_host/src/components/GameManager.css
  modified:
    - musicbingo_api/src/musicbingo_api/main.py
    - musicbingo_host/src/services/prepApi.js
    - musicbingo_host/src/pages/PrepView.jsx

key-decisions:
  - "Parse CSV in API (not client) to ensure consistent song ID generation"
  - "Preview playlist before saving to allow DJ to verify correct file"
  - "Game list shows summary info, detail view loads full playlist"
  - "Venue night selector disabled during edit to prevent orphaning"

patterns-established:
  - "CSV parse endpoint returns preview data before save"
  - "List/detail view toggle in same component (not modal)"
  - "Song list with alternating rows and number/title/artist columns"

issues-created: []

# Metrics
duration: 10min
completed: 2026-01-25
---

# Phase 08 Plan 04: Game CRUD Summary

**Full CRUD for games with Exportify CSV upload, playlist preview, and card count configuration for bingo card generation**

## Performance

- **Duration:** 10 min
- **Started:** 2026-01-25T11:00:00Z
- **Completed:** 2026-01-25T11:10:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Game CRUD API with Exportify CSV parsing and song ID generation
- GameManager component with CSV upload and playlist preview
- Full integration with PrepView Games tab
- Filter by venue night in game list

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Game repository and API routes** - `7f9387c2` (feat)
2. **Task 2: Add Game API functions to prepApi.js** - `3d8a605f` (feat)
3. **Task 3: Create GameManager component** - `0ba6a87d` (feat)

## Files Created/Modified
- `musicbingo_api/src/musicbingo_api/game_repository.py` - Database operations for games with CSV parsing
- `musicbingo_api/src/musicbingo_api/game_routes.py` - REST endpoints at /api/prep/games
- `musicbingo_api/src/musicbingo_api/main.py` - Include game_routes router
- `musicbingo_host/src/services/prepApi.js` - Game API functions including parseCSV
- `musicbingo_host/src/components/GameManager.jsx` - List and detail views with CSV upload
- `musicbingo_host/src/components/GameManager.css` - Dark theme styling matching VenueNightManager
- `musicbingo_host/src/pages/PrepView.jsx` - Render GameManager on Games tab

## Decisions Made
- Parse CSV on server side to ensure consistent song ID generation (SHA256 hash of lowercase title+artist)
- Show playlist preview after CSV upload, require explicit "Use This Playlist" confirmation
- Display song count, card count, and PDF status (Generated/Pending) in game list
- Disable venue night selector when editing to prevent accidentally moving games between nights

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## Next Phase Readiness
- Game CRUD complete, ready for card generation implementation (Plan 08-05)
- Games store playlist, card_count, game_uuid, and pdf_path for card generation
- PDF generation endpoint can update pdf_path after cards are created

---
*Phase: 08-game-prep-ui*
*Plan: 04*
*Completed: 2026-01-25*
