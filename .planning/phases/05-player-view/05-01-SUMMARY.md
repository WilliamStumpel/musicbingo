---
phase: 05-player-view
plan: 01
subsystem: ui
tags: [react, react-router-dom, multi-window, css-grid, polling]

# Dependency graph
requires:
  - phase: 04
    provides: Host view with call board, now playing tracking, pattern selection
provides:
  - React Router multi-page navigation (/ and /player routes)
  - PlayerView page with full-screen dark layout for TV output
  - Game state sync via API polling in player view
  - "Open Player View" button for launching external window
  - SongTimer component for tracking song duration
affects: [05-02, 05-03, 05-04]

# Tech tracking
tech-stack:
  added: [react-router-dom]
  patterns:
    - Multi-window architecture with localStorage for game ID sharing
    - Full-viewport fixed layout for TV display
    - CSS Grid for header/main/footer layout

key-files:
  created:
    - musicbingo_host/src/pages/HostView.jsx
    - musicbingo_host/src/pages/HostView.css
    - musicbingo_host/src/pages/PlayerView.jsx
    - musicbingo_host/src/pages/PlayerView.css
    - musicbingo_host/src/components/SongTimer.jsx
    - musicbingo_host/src/components/SongTimer.css
  modified:
    - musicbingo_host/package.json
    - musicbingo_host/src/index.js
    - musicbingo_host/src/App.js
    - musicbingo_host/src/App.css

key-decisions:
  - "Use localStorage to share game ID between host and player windows"
  - "Full viewport (100vw x 100vh) fixed layout for player view"
  - "24px base font size for TV visibility"
  - "Dark background (#0a0a0a) for player view"
  - "2-second polling interval for game state sync"
  - "SongTimer flashes amber at 30-second target"

patterns-established:
  - "Pattern 1: Extract page components to pages/ directory"
  - "Pattern 2: window.open for launching player view with specific dimensions"
  - "Pattern 3: localStorage listener for cross-window communication"

issues-created: []

# Metrics
duration: 3min
completed: 2026-01-19
---

# Phase 5 Plan 01: Player Window Route & Layout Summary

**React Router integration with HostView/PlayerView pages, full-screen dark player layout with API polling, and song duration timer for DJ workflow**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-19T01:43:23Z
- **Completed:** 2026-01-19T01:46:46Z
- **Tasks:** 4/4
- **Files modified:** 10

## Accomplishments

- Installed react-router-dom and configured BrowserRouter with / and /player routes
- Extracted App.js logic to HostView component in pages/ directory
- Created PlayerView page with full-screen dark layout (CSS Grid header/main/footer)
- PlayerView loads game from localStorage and polls API every 2 seconds
- Added "Open Player View" button to host header that opens new window at 1920x1080
- Created SongTimer component with elapsed/target display and amber flash animation

## Task Commits

Each task was committed atomically:

1. **Task 1: Add React Router for multi-page navigation** - `240abf22` (feat)
2. **Task 2: Create PlayerView page with full-screen dark layout** - `df2ed14b` (feat)
3. **Task 3: Add "Open Player View" button to host header** - included in Task 1
4. **Task 4: Add song duration timer to host view** - `f42f4778` (feat)

## Files Created/Modified

- `musicbingo_host/package.json` - Added react-router-dom dependency
- `musicbingo_host/src/index.js` - Wrapped App with BrowserRouter
- `musicbingo_host/src/App.js` - Simplified to Routes with HostView and PlayerView
- `musicbingo_host/src/App.css` - Reduced to base styles only
- `musicbingo_host/src/pages/HostView.jsx` - Extracted host view logic from App.js
- `musicbingo_host/src/pages/HostView.css` - Host view specific styles
- `musicbingo_host/src/pages/PlayerView.jsx` - Full-screen player view with API polling
- `musicbingo_host/src/pages/PlayerView.css` - Dark theme, large fonts for TV
- `musicbingo_host/src/components/SongTimer.jsx` - Elapsed time tracker with flash animation
- `musicbingo_host/src/components/SongTimer.css` - Timer styles with amber flash keyframes

## Decisions Made

- **localStorage for cross-window communication:** Using localStorage to share game filename between host and player views. Simple and reliable, player view listens for storage events.
- **100vw x 100vh fixed layout:** Player view fills entire viewport with overflow:hidden for clean TV display.
- **24px base font / 48px header:** Large readable fonts for venue projection systems.
- **#0a0a0a background:** Very dark (near black) for high contrast in dark venues.
- **30-second default target:** Typical bingo song clip length, configurable via prop.

## Deviations from Plan

None - plan executed exactly as written. Task 3 (Open Player View button) was implemented as part of Task 1 during HostView extraction.

## Issues Encountered

None

## Next Phase Readiness

- Player view route working at /player with dark full-screen layout
- Game state syncs from API via polling
- Host can open player view in new window with button click
- Ready for 05-02: TV-Optimized Call Board (PlayerCallBoard component)

---
*Phase: 05-player-view*
*Completed: 2026-01-19*
