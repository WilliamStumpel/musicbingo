# UAT Issues: Phase 3 Manual Playback Mode

**Tested:** 2026-01-18
**Source:** .planning/phases/03-spotify-integration/03-*-SUMMARY.md
**Tester:** User via /gsd:verify-work

## Open Issues

[None]

## Resolved Issues

### UAT-003: Loading same game from second app resets played_songs state

**Discovered:** 2026-01-18
**Resolved:** 2026-01-18 - Fixed via 03-FIX.md
**Phase/Plan:** 03-04
**Severity:** Major
**Feature:** Cross-app sync between host and scanner
**Description:** When the scanner app loads "Sample Music Bingo" after the host app has already loaded it and marked songs, the load endpoint replaces the in-memory game state, resetting `played_songs` to empty.
**Fix:** Changed `load_game()` endpoint to return existing game state if already loaded, instead of deleting and re-registering. This preserves `played_songs` for cross-app sync.

### UAT-002: Host app fails to fetch from API (CORS origin mismatch)

**Discovered:** 2026-01-18
**Resolved:** 2026-01-18 - Fixed during UAT session
**Phase/Plan:** 03-02
**Severity:** Blocker
**Feature:** Host app API communication
**Description:** Host app used `127.0.0.1` in API URL while running from `localhost:3000`, causing browser to treat as cross-origin request. CORS regex matched both but not across origins.
**Fix:** Changed default API_BASE in gameApi.js from `http://127.0.0.1:8000` to `http://localhost:8000` for consistency.

### UAT-001: API crashes on malformed game JSON files in games/ directory

**Discovered:** 2026-01-18
**Resolved:** 2026-01-18 - Fixed during UAT session
**Phase/Plan:** 03 (affects API used by 03-02, 03-03, 03-04)
**Severity:** Blocker
**Feature:** GET /api/games endpoint - list available games
**Description:** The API returns 500 Internal Server Error when any JSON file in the games/ directory has an unexpected format (e.g., a list at root level instead of an object). The `games/test-playlist.json` file is a raw array of songs which causes `data.get()` to fail with AttributeError.
**Fix:** Added `AttributeError` and `TypeError` to the except clause in `game_loader.py:list_available_games()` to skip non-dict JSON structures.

---

*Phase: 03-manual-playback*
*Tested: 2026-01-18*
