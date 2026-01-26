---
phase: 07-prize-winner-tracking
plan: 07-FIX
type: fix
wave: 1
depends_on: []
files_modified:
  - musicbingo_host/src/components/CardStatusPanel.jsx
  - musicbingo_host/src/pages/PlayerView.jsx
autonomous: true
---

<objective>
Fix 2 UAT issues from Phase 7 verification testing.

Source: 07-ISSUES.md
Priority: 0 critical, 2 major, 0 minor
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md

**Issues being fixed:**
@.planning/phases/07-prize-winner-tracking/07-ISSUES.md

**Original plans for reference:**
@.planning/phases/07-prize-winner-tracking/07-02-PLAN.md
@.planning/phases/07-prize-winner-tracking/07-03-PLAN.md

**Source files to fix:**
@musicbingo_host/src/components/CardStatusPanel.jsx
@musicbingo_host/src/pages/PlayerView.jsx
@musicbingo_api/src/musicbingo_api/schemas.py
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix UAT-001 - CardStatusPanel progress display field mismatch</name>
  <files>musicbingo_host/src/components/CardStatusPanel.jsx</files>
  <action>
Fix the field name mismatch in CardStatusPanel.jsx that prevents progress bars from displaying.

**Root cause:** The API returns CardStatusInfo schema with fields `matches` and `total_needed`, but CardStatusPanel.jsx uses `card.matches` and `card.required` (line 158).

**Fix:**
1. Line 158: Change `card.required` to `card.total_needed` in the progress bar width calculation:
   ```javascript
   style={{ width: `${(card.matches / card.total_needed) * 100}%` }}
   ```

2. Line 161-162: Change `card.required` to `card.total_needed` in the progress text:
   ```javascript
   {card.matches}/{card.total_needed}
   ```

**Verification:**
- Register a card
- Mark some songs as played
- Open Cards panel
- Card should show progress bar filling and text like "3/5"
  </action>
  <verify>Manual test: Open Cards panel with registered cards and marked songs - progress bar should display correctly</verify>
  <done>CardStatusPanel shows progress bar and text like "3/5" for registered cards</done>
</task>

<task type="auto">
  <name>Task 2: Fix UAT-002 - PlayerView pattern not syncing from Host</name>
  <files>musicbingo_host/src/pages/PlayerView.jsx</files>
  <action>
Fix the pattern sync issue where PlayerView doesn't reflect pattern changes from Host.

**Root cause analysis:**
The PlayerView reads `musicbingo_current_pattern` from localStorage on initial load (line 68-69) and listens for storage events (line 121-122). However, the `storage` event only fires when the change comes from a *different* browsing context (different tab/window). Since the PlayerView is opened as a popup from the Host, it IS a different context, so storage events should work.

The likely issue is that when PlayerView opens, it reads the pattern before Host has set it, OR the polling doesn't re-read the pattern from localStorage.

**Fix:**
1. Add pattern sync in the polling useEffect (around line 81-99). After polling the API, also read the current pattern from localStorage:
   ```javascript
   const poll = async () => {
     const played = await gameApi.pollGameState(gameIdRef.current);
     if (played !== null) {
       setPlayedSongs(new Set(played));
       setPlayedOrder(played);
     }

     // Sync pattern from localStorage (Host sets this)
     const storedPattern = localStorage.getItem('musicbingo_current_pattern');
     if (storedPattern && storedPattern !== currentPattern) {
       setCurrentPattern(storedPattern);
     }
   };
   ```

2. Need to include `currentPattern` in the dependency array or use a ref to avoid stale closure issues.

**Alternative simpler fix:**
Add the pattern read inside the polling interval to continuously sync from localStorage without relying solely on storage events. This ensures pattern stays in sync even if storage events are missed.

**Verification:**
- Open Player View from Host
- Change pattern in Host using PatternSelector
- Player View footer should update to show new pattern
  </action>
  <verify>Manual test: Change pattern in Host - PlayerView pattern display should update within 2 seconds</verify>
  <done>PlayerView pattern display syncs with Host pattern selection</done>
</task>

</tasks>

<verification>
Before declaring plan complete:
- [ ] CardStatusPanel shows progress bars and progress text for registered cards
- [ ] PlayerView pattern syncs when Host changes pattern
- [ ] No React errors in console
- [ ] Build completes without errors
</verification>

<success_criteria>
- All UAT issues from 07-ISSUES.md addressed
- Both fixes tested manually
- Ready for re-verification
</success_criteria>

<output>
After completion, create `.planning/phases/07-prize-winner-tracking/07-FIX-SUMMARY.md`
</output>
