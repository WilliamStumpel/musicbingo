# UAT Issues: Phase 5 Player View

**Tested:** 2026-01-18
**Source:** .planning/phases/05-player-view/05-*-SUMMARY.md
**Tester:** User via /gsd:verify-work

## Open Issues

### UAT-001: Player view popup window doesn't load game

**Discovered:** 2026-01-18
**Phase/Plan:** 05-01
**Severity:** Major
**Feature:** Open Player View button
**Description:** When clicking "Open Player View" button in host header, the popup window opens but does not display the game. A manually opened tab at localhost:3000/player does show the game correctly.
**Expected:** Popup window should load the same game as the host view via localStorage sharing
**Actual:** Popup window shows player view layout but no game data loaded
**Repro:**
1. Open host view at localhost:3000
2. Select a game
3. Click "Open Player View" button
4. Observe popup window has no game data

### UAT-002: Call board grid text overflows card boundaries

**Discovered:** 2026-01-18
**Phase/Plan:** 05-02
**Severity:** Minor
**Feature:** PlayerCallBoard grid
**Description:** Text in the played songs grid cards is overflowing outside the card boundaries
**Expected:** Text should be contained within card boundaries (truncated or wrapped)
**Actual:** Text extends beyond card edges
**Repro:**
1. Mark several songs as played
2. View player view call board grid
3. Observe text overflow on cards with longer titles/artists

### UAT-003: Delayed song reveal not working - title shows immediately

**Discovered:** 2026-01-18
**Phase/Plan:** 05-03
**Severity:** Major
**Feature:** Delayed Song Reveal / Auto-reveal timer
**Description:** Song titles are displayed immediately on the player view instead of being hidden initially and revealed after 15 seconds
**Expected:** When a song is set as "Now Playing", the title should be hidden (showing "?" or placeholder), then auto-revealed after 15 seconds
**Actual:** Title is visible immediately, no delay or hidden state
**Repro:**
1. Set a song as "Now Playing" in host view
2. Observe player view Now Playing section
3. Title shows immediately instead of being hidden

## Resolved Issues

[None yet]

---

*Phase: 05-player-view*
*Tested: 2026-01-18*
