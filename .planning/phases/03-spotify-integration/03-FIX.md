---
phase: 03-spotify-integration
plan: 03-FIX
type: fix
wave: 1
depends_on: ["03-04"]
files_modified:
  - musicbingo_api/src/musicbingo_api/main.py
autonomous: true
---

<objective>
Fix 1 UAT issue from Phase 3 verification.

Source: 03-ISSUES.md
Priority: 0 critical, 1 major, 0 minor

Purpose: Preserve played_songs state when same game is loaded by multiple clients.
Output: Cross-app sync working correctly.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md

**Issues being fixed:**
@.planning/phases/03-spotify-integration/03-ISSUES.md

**Original plan for reference:**
@.planning/phases/03-spotify-integration/03-04-PLAN.md
</context>

<tasks>
<task type="auto">
  <name>Task 1: Fix UAT-003 - Preserve played_songs on game reload</name>
  <files>musicbingo_api/src/musicbingo_api/main.py</files>
  <action>
Modify the `load_game()` endpoint (around lines 120-163) to preserve existing runtime state when reloading a game.

Current behavior (broken):
1. Check if game exists
2. Delete existing game (loses played_songs)
3. Register fresh game from file

New behavior (fixed):
1. Check if game with same game_id already exists in GameService
2. If exists: Return existing game state (preserve played_songs) - don't re-register
3. If not exists: Load from file and register as before

Implementation:
- Before loading from file, check `service.get_game(UUID(game_id_from_file))`
- Actually, we need the game_id before loading the full file. Better approach:
  - Load game from file first (unchanged)
  - Check if game_id already exists in service
  - If exists: DON'T delete/replace. Just return the existing game's state (played_songs preserved)
  - Build response from existing game state instead of fresh game

Key change in load_game():
```python
# Load game from file
game = load_game_from_file(filename)

# Check if already registered (preserve runtime state)
service = get_game_service()
existing = service.get_game(game.game_id)
if existing is not None:
    # Return existing state - don't replace
    game = existing
else:
    # New game - register it
    service._games[game.game_id] = game
```

This way:
- First client loads game: registers it fresh
- Second client loads same game: gets existing state with played_songs intact
- Both clients see same state via polling
  </action>
  <verify>
1. Start backend API
2. In browser 1 (host app): Select game, mark 2-3 songs as played
3. In browser 2 (scanner app): Select same game
4. Browser 1: Verify marks are still there (not reset)
5. Both browsers should show same played songs
  </verify>
  <done>
- Loading same game from second client preserves played_songs
- Both host and scanner apps see consistent state
- Cross-app sync works as designed
  </done>
</task>
</tasks>

<verification>
Before declaring plan complete:
- [ ] UAT-003 is fixed
- [ ] Cross-app sync works: mark in one app, appears in other
- [ ] First client's played songs not lost when second client loads game
- [ ] Backend still works for single-client usage
</verification>

<success_criteria>
- UAT-003 from 03-ISSUES.md addressed
- Both host and scanner can load same game and share state
- Ready for re-verification
</success_criteria>

<output>
After completion, create `.planning/phases/03-spotify-integration/03-FIX-SUMMARY.md`
</output>
