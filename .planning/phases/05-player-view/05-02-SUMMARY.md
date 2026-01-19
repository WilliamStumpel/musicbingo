---
phase: 05-player-view
plan: 02
subsystem: ui
tags: [react, css-grid, css-animations, localStorage, polling]

# Dependency graph
requires:
  - phase: 05-01
    provides: PlayerView page with full-screen dark layout and API polling
provides:
  - PlayerCallBoard component with TV-optimized grid layout
  - Now Playing hero section with pulsing amber glow animation
  - localStorage-based nowPlaying sync between host and player windows
  - playedOrder tracking for reverse chronological display
affects: [05-03, 05-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - localStorage for cross-window state sync (nowPlaying)
    - CSS keyframes for pulsing glow animation
    - CSS Grid responsive columns (4 -> 3 -> 2)

key-files:
  created:
    - musicbingo_host/src/components/PlayerCallBoard.jsx
    - musicbingo_host/src/components/PlayerCallBoard.css
  modified:
    - musicbingo_host/src/pages/PlayerView.jsx
    - musicbingo_host/src/pages/PlayerView.css
    - musicbingo_host/src/hooks/useGameState.js

key-decisions:
  - "localStorage for nowPlaying sync between host and player windows"
  - "4-column responsive grid for played songs (down to 2 on smaller screens)"
  - "Max 20 visible played songs to prevent overflow"
  - "Green accent border (#4caf50) for played song cards"
  - "Amber pulsing glow animation for Now Playing hero section"

patterns-established:
  - "Pattern 1: TV-readable font sizes (28-64px titles, 18-40px artists)"
  - "Pattern 2: Card-based grid cells with left accent border"
  - "Pattern 3: localStorage events for cross-window real-time sync"

issues-created: []

# Metrics
duration: 2min
completed: 2026-01-19
---

# Phase 5 Plan 02: TV-Optimized Call Board Summary

**PlayerCallBoard component with Now Playing hero section featuring pulsing amber glow, 4-column responsive grid of played songs with green accent borders, and localStorage-based nowPlaying sync between host and player windows**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-19T01:49:36Z
- **Completed:** 2026-01-19T01:51:58Z
- **Tasks:** 3/3
- **Files modified:** 5

## Accomplishments

- Created PlayerCallBoard component with TV-readable large text (28-64px titles)
- Now Playing hero section with pulsing amber glow animation and fade-in transitions
- Responsive grid layout: 4 columns at 1920px, 3 at 1280px, 2 at 960px
- Played songs displayed in reverse chronological order (most recent first, max 20)
- Card-based grid cells with green (#4caf50) left accent border
- localStorage sync for nowPlaying state between host and player windows

## Task Commits

Each task was committed atomically:

1. **Task 1 & 2: PlayerCallBoard with Now Playing hero** - `fcbccaad` (feat)
2. **Task 3: Integrate PlayerCallBoard into PlayerView** - `45df5b16` (feat)

## Files Created/Modified

- `musicbingo_host/src/components/PlayerCallBoard.jsx` - TV-optimized call board component
- `musicbingo_host/src/components/PlayerCallBoard.css` - Responsive grid and animation styles
- `musicbingo_host/src/pages/PlayerView.jsx` - Integrated PlayerCallBoard, added playedOrder state
- `musicbingo_host/src/pages/PlayerView.css` - Simplified main area layout
- `musicbingo_host/src/hooks/useGameState.js` - Added localStorage sync for nowPlaying

## Decisions Made

- **localStorage for nowPlaying sync:** Extended existing localStorage pattern (already used for game filename) to sync nowPlaying between host and player windows. Simple and reliable, player view listens for storage events.
- **Combined Tasks 1 & 2:** Now Playing hero section and grid layout implemented together in single component since they're logically coupled.
- **Green accent border for played songs:** Using #4caf50 (Material green) to indicate played status, consistent with overall "played = green" convention.
- **Max 20 visible songs:** Prevents grid overflow while showing enough history for players to track.

## Deviations from Plan

None - plan executed exactly as written. Tasks 1 and 2 were combined into a single commit since the Now Playing hero and grid are part of the same component.

## Issues Encountered

None

## Next Phase Readiness

- PlayerCallBoard renders on player view with TV-optimized layout
- Now Playing section shows current song with pulsing animation
- Grid shows played songs in reverse chronological order
- Text is readable at TV distance (large fonts: 28-64px)
- Syncs correctly when host marks new songs via localStorage
- Ready for 05-03: Delayed Reveal animation

---
*Phase: 05-player-view*
*Completed: 2026-01-19*
