# UAT Issues: Phase 2 Plan 1

**Tested:** 2026-01-14 (re-verification)
**Source:** .planning/phases/02-card-printing-system/02-01-SUMMARY.md
**Tester:** User via /gsd:verify-work

## Open Issues

### UAT-005: Card generator workflow doesn't create complete game files

**Discovered:** 2026-01-25 during Phase 7 UAT
**Phase/Plan:** 02-01
**Severity:** Major
**Feature:** Card generation CLI
**Description:** The card generation workflow has a format mismatch that prevents games from loading:

1. `musicbingo import-csv` creates files with `game_name`, `songs`, `song_count` format
2. `musicbingo generate --export-json` only exports card data (`game_id`, `cards`), not the playlist
3. Backend API expects complete files with `game_id`, `playlist`, `cards` together

This requires manual JSON merging to create loadable game files.

**Expected:** Running `musicbingo generate <input.json> --export-json <output.json>` should produce a complete game file that includes both the playlist and cards.

**Workaround:** Manually merge the playlist data from the CSV import with the card data from the generator export.

**Fix needed:** Modify the card exporter to include the playlist in the exported JSON, or add a `--complete-game` flag that merges both.

## Resolved Issues

### UAT-002: Logo layout issues (single and 4-up)

**Discovered:** 2026-01-14 (updated after re-verification)
**Resolved:** 2026-01-14 - Fixed in 02-01-FIX2.md
**Commit:** 2c5f4b1a, a847f4c3
**Phase/Plan:** 02-01
**Severity:** Major
**Feature:** Custom branding - venue logo
**Description:** Logo has multiple layout issues:
1. Logo is too small
2. Logo is not centered on the card
3. Logo causes QR code to run off the page (insufficient space management)
4. **For 4-up layout:** Logo should appear on each individual mini card, not at page level

**Fix:**
- Single layout: Logo centered using table with TA_CENTER, increased to 1.0 inch height, reduced grid cell size to 1.2 inch when branding present
- 4-up layout: Mini logo (0.3 inch) added to top of each individual card

### UAT-003: DJ contact layout issues (single and 4-up)

**Discovered:** 2026-01-14 (updated after re-verification)
**Resolved:** 2026-01-14 - Fixed in 02-01-FIX2.md
**Commit:** 2c5f4b1a, a847f4c3
**Phase/Plan:** 02-01
**Severity:** Major
**Feature:** Custom branding - DJ contact
**Description:** DJ contact has the same layout issues as the logo:
1. DJ contact not centered on the card
2. DJ contact causes QR code to run off the page
3. **For 4-up layout:** DJ contact should appear on each individual mini card, not at page level

**Fix:**
- Single layout: DJ contact centered below logo with TA_CENTER alignment
- 4-up layout: DJ contact (5pt font) added to bottom of each individual card

### UAT-004: Duplicate DJ branding footer causes page overflow (single layout)

**Discovered:** 2026-01-14
**Resolved:** 2026-01-14 - Quick fix
**Commit:** 184c7613
**Phase/Plan:** 02-01
**Severity:** Major
**Feature:** Custom branding - single card layout
**Description:** DJ contact appeared twice (header and footer), causing page overflow
**Fix:** Removed `_create_branding_footer()` call since DJ contact is now in the centered header

### UAT-001: 4-up layout text too small to read

**Discovered:** 2026-01-14
**Resolved:** 2026-01-14 - Fixed in 02-01-FIX.md
**Commit:** a1806967
**Phase/Plan:** 02-01
**Severity:** Major
**Feature:** 4-up card layout
**Description:** Text on mini cards in 4-up layout was too small to be readable due to hard truncation
**Fix:** Implemented word wrapping and dynamic font sizing for 4-up cells (min 4pt, max 2 lines each for title/artist)

---

*Phase: 02-card-printing-system*
*Plan: 01*
*Tested: 2026-01-14*
