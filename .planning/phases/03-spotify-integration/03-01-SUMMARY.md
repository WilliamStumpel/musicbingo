---
phase: 03-manual-playback
plan: 01
subsystem: cli
tags: [csv, exportify, playlist-import, python]

# Dependency graph
requires:
  - phase: 02-card-printing-system
    provides: Card generation CLI and PDF export
provides:
  - CSV playlist import from Exportify format
  - Game JSON generation from CSV
  - New import-csv CLI command
affects: [03-02, 03-03, 03-04, card-generation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hash-based song ID generation for consistent identifiers"
    - "Case-insensitive header matching for CSV robustness"

key-files:
  created:
    - musicbingo_cards/src/musicbingo_cards/csv_import.py
    - musicbingo_cards/tests/test_csv_import.py
  modified:
    - musicbingo_cards/src/musicbingo_cards/cli.py

key-decisions:
  - "SHA256 hash of title+artist (lowercase) for song IDs"
  - "24 minimum songs requirement matches bingo card needs (5x5 - 1 free)"
  - "Default output to games/ directory for organization"

patterns-established:
  - "CSV import module pattern for future file format support"

issues-created: []

# Metrics
duration: 2min
completed: 2026-01-18
---

# Phase 3 Plan 01: CSV Playlist Import Summary

**Exportify CSV import with hash-based song IDs and new `import-csv` CLI command**

## Performance

- **Duration:** 2 min 12 sec
- **Started:** 2026-01-18T21:05:56Z
- **Completed:** 2026-01-18T21:08:08Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Created csv_import.py module with Exportify format parsing
- Added `import-csv` CLI command for easy playlist import
- Implemented hash-based song ID generation for consistent identifiers
- Added comprehensive test suite with 11 passing tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CSV import module** - `a3b44c6c` (feat)
2. **Task 2: Add import-csv CLI command** - `7d9435b0` (feat)
3. **Task 3: Add tests for CSV import** - `a89e681c` (test)

## Files Created/Modified

- `musicbingo_cards/src/musicbingo_cards/csv_import.py` - CSV parsing and game JSON creation
- `musicbingo_cards/src/musicbingo_cards/cli.py` - Added import-csv command
- `musicbingo_cards/tests/test_csv_import.py` - 11 tests for CSV import functionality

## Decisions Made

- **Song ID generation:** SHA256 hash of lowercase title+artist, truncated to 12 chars
- **Minimum songs:** 24 required (matches 5x5 bingo grid minus free space)
- **Default output:** games/<sanitized-name>.json for organization

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

- CSV import ready for use with Exportify exports
- Game JSON format compatible with existing card generator
- Ready for Plan 03-02: Host Checklist View

---
*Phase: 03-manual-playback*
*Completed: 2026-01-18*
