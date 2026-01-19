# UAT Issues: Phase 5 Player View

**Tested:** 2026-01-18
**Source:** .planning/phases/05-player-view/05-*-SUMMARY.md
**Tester:** User via /gsd:verify-work

## Open Issues

[None - all UAT issues resolved]

## Resolved Issues

### UAT-004: Call board grid text still clips/cuts off
**Resolved:** 2026-01-19
**Fix:** Fixed row heights with grid-auto-rows, grid scrolls if needed, fixed font sizes instead of clamp(), min-height on cells
**Commit:** bb4148af, 3e5ddb5c

### UAT-001: Player view popup window doesn't load game
**Resolved:** 2026-01-19
**Fix:** Pass game filename as URL parameter when opening popup; PlayerView checks URL params first, then localStorage
**Commit:** 1190a409

### UAT-002: Call board grid text overflows card boundaries
**Resolved:** 2026-01-19
**Fix:** Added min-width:0 to grid cells, CSS clamp() for dynamic font sizing, word-wrap and overflow-wrap
**Commit:** 9222784a

### UAT-003: Delayed song reveal not working - title shows immediately
**Resolved:** 2026-01-19
**Fix:** PlayerView reads/listens for revealedSongs from localStorage, passes to PlayerCallBoard which shows "?" when not revealed
**Commit:** c6859fa1

---

*Phase: 05-player-view*
*Tested: 2026-01-18*
