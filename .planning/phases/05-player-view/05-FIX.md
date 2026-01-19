---
phase: 05-player-view
plan: 05-FIX
type: fix
wave: 1
depends_on: ["05-01", "05-02", "05-03"]
files_modified:
  - musicbingo_host/src/pages/HostView.jsx
  - musicbingo_host/src/components/PlayerCallBoard.jsx
  - musicbingo_host/src/components/PlayerCallBoard.css
autonomous: true
---

<objective>
Fix 3 UAT issues from Phase 5 Player View.

Source: 05-ISSUES.md
Priority: 0 critical, 2 major, 1 minor
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md

**Issues being fixed:**
@.planning/phases/05-player-view/05-ISSUES.md

**Relevant source files:**
@musicbingo_host/src/pages/HostView.jsx
@musicbingo_host/src/pages/PlayerView.jsx
@musicbingo_host/src/components/PlayerCallBoard.jsx
@musicbingo_host/src/components/PlayerCallBoard.css
</context>

<tasks>

<task type="auto">
  <name>Fix UAT-001: Player view popup window doesn't load game</name>
  <files>musicbingo_host/src/pages/HostView.jsx</files>
  <action>
The popup window opened via window.open() doesn't see the localStorage values because:
1. localStorage.setItem is called AFTER window.open in same sync block
2. The popup loads before storage is written

Fix by ensuring localStorage is set BEFORE opening the popup:
- Move localStorage.setItem calls to happen BEFORE window.open()
- The current code already does this, but there may be a race condition
- Add a small delay or use synchronous approach to ensure storage is ready

Actually looking at the code more carefully:
- handleOpenPlayerView sets localStorage then opens window
- The popup's loadGameFromStorage runs on mount and reads localStorage

The issue is likely that the popup's loadGameFromStorage runs before localStorage is set due to browser popup timing.

Solution: Add a URL parameter with the game filename as a fallback, so the popup can read it directly:
```javascript
const params = new URLSearchParams({ game: filename });
window.open(`/player?${params.toString()}`, 'player-view', 'width=1920,height=1080');
```

Then in PlayerView, check URL params first, fall back to localStorage.
  </action>
  <verify>
1. Open host view at localhost:3000
2. Select a game
3. Click "Open Player View" button
4. Popup window loads with game data displayed
  </verify>
  <done>Popup window from "Open Player View" button shows game data correctly</done>
</task>

<task type="auto">
  <name>Fix UAT-002: Call board grid text overflows card boundaries</name>
  <files>musicbingo_host/src/components/PlayerCallBoard.css</files>
  <action>
Use dynamic font sizing with word wrap to ensure text fits within card boundaries.

Approach:
1. Add `min-width: 0` to .grid-cell to enable proper grid overflow handling
2. Enable word wrapping with `word-wrap: break-word` and `overflow-wrap: break-word`
3. Use CSS clamp() for dynamic font sizing that scales based on container:
   - Title: clamp(16px, 2vw, 28px) - smaller min, scales with viewport
   - Artist: clamp(12px, 1.5vw, 18px)
4. Limit to 2 lines for title, 1 line for artist using -webkit-line-clamp
5. Ensure cards have consistent height with proper text containment

The goal is readable text that fits, not truncation - let text wrap and shrink rather than cut off.
  </action>
  <verify>
1. Mark songs with long titles/artists as played
2. View player view call board grid
3. Text wraps and sizes dynamically to fit within card boundaries
4. All text remains readable (not too small)
  </verify>
  <done>Text in grid cells dynamically sizes and wraps to fit within card boundaries</done>
</task>

<task type="auto">
  <name>Fix UAT-003: Delayed song reveal not working - title shows immediately</name>
  <files>
musicbingo_host/src/pages/PlayerView.jsx
musicbingo_host/src/components/PlayerCallBoard.jsx
  </files>
  <action>
The PlayerView and PlayerCallBoard components are not reading or using the revealedSongs state from the API/localStorage.

The host view has revealedSongs state and syncs it via localStorage (musicbingo_revealed_songs), but PlayerView doesn't:
1. Read revealedSongs from localStorage
2. Listen for storage events on revealedSongs
3. Pass revealedSongs to PlayerCallBoard
4. PlayerCallBoard doesn't use revealedSongs to conditionally show "?" instead of title

Fix:
1. In PlayerView.jsx:
   - Add revealedSongs state (Set)
   - Read from localStorage on mount: musicbingo_revealed_songs (JSON array)
   - Listen for storage events to update revealedSongs
   - Pass revealedSongs prop to PlayerCallBoard

2. In PlayerCallBoard.jsx:
   - Accept revealedSongs prop
   - In Now Playing section, check if nowPlaying song is revealed
   - If not revealed: show "?" for title and "Listen carefully..." for artist
   - If revealed: show actual title and artist

Check useGameState.js to see the localStorage key used for revealed songs.
  </action>
  <verify>
1. Set a song as "Now Playing" in host view
2. Observe player view Now Playing section shows "?" initially
3. Wait ~15 seconds or click Reveal button in host
4. Player view updates to show actual song title
  </verify>
  <done>Song titles are hidden on player view until revealed via auto-timer or manual button</done>
</task>

</tasks>

<verification>
Before declaring plan complete:
- [ ] Popup window loads game data when opened from host
- [ ] Grid text is contained within card boundaries
- [ ] Song titles are hidden initially in player view
- [ ] Songs reveal after 15 seconds or manual reveal
- [ ] All three UAT issues addressed
</verification>

<success_criteria>
- All UAT issues from 05-ISSUES.md addressed
- Player view functions correctly from popup or direct navigation
- Text overflow properly handled in call board grid
- Delayed reveal feature working as designed
</success_criteria>

<output>
After completion, create `.planning/phases/05-player-view/05-FIX-SUMMARY.md`
</output>
