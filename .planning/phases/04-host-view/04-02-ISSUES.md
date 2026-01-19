# UAT Issues: Phase 4 Plan 02

**Tested:** 2026-01-18
**Source:** .planning/phases/04-host-view/04-02-SUMMARY.md
**Tester:** User via /gsd:verify-work

## Open Issues

[None - all issues resolved]

## Resolved Issues

### UAT-001: No way to unmark an accidentally clicked song

**Discovered:** 2026-01-18
**Resolved:** 2026-01-18 - Fixed in 04-02-FIX.md
**Commit:** 169b6b30
**Phase/Plan:** 04-02
**Severity:** Major
**Feature:** Song Checklist / Now Playing
**Description:** If the DJ accidentally clicks the wrong song, there's no way to remove it from the played list or clear the "now playing" state without resetting the entire round.
**Expected:** Ability to unmark a song (click again to toggle, or right-click/long-press to remove)
**Actual:** Clicking a played song does nothing; only Reset Round clears played state
**Fix:** Added toggle behavior - clicking a played song now unmarks it. Red hover state provides visual feedback.

---

*Phase: 04-host-view*
*Plan: 02*
*Tested: 2026-01-18*
