# UAT Issues: Phase 7 (Prize & Winner Tracking)

**Tested:** 2026-01-25
**Source:** .planning/phases/07-prize-winner-tracking/07-*-SUMMARY.md
**Tester:** User via /gsd:verify-work

## Open Issues

[None]

## Pre-flight Issues Fixed During Testing

### PRE-001: Vercel deployment 39 commits behind

**Discovered:** 2026-01-25
**Resolved:** 2026-01-25 - Pushed to origin/main
**Description:** Vercel auto-deploy wasn't configured, causing deployed Scanner to be outdated
**Fix:** Set up Vercel auto-deploy from GitHub and pushed latest commits

### PRE-002: ESLint build failure (react-hooks/exhaustive-deps)

**Discovered:** 2026-01-25
**Resolved:** 2026-01-25 - Commit 64f2e30a
**Description:** Scanner.jsx had an ESLint warning treated as error in CI
**Fix:** Refactored to use useCallback and ref for handleScan

### PRE-003: ngrok free tier interstitial blocking API calls

**Discovered:** 2026-01-25
**Resolved:** 2026-01-25 - Commit d4b8bbb7
**Description:** ngrok free tier shows a browser warning page that blocks fetch requests
**Fix:** Added 'ngrok-skip-browser-warning' header to all API calls

### PRE-004: CORS blocking Vercel-hosted Scanner

**Discovered:** 2026-01-25
**Resolved:** 2026-01-25 - Commit baea136f
**Description:** API CORS config only allowed localhost/private IPs and GitHub Pages
**Fix:** Added musicbingo-verify.vercel.app to allowed origins

## Resolved Issues

### UAT-001: CardStatusPanel not showing progress for registered cards

**Discovered:** 2026-01-25
**Resolved:** 2026-01-25 - Commit dcad295f
**Phase/Plan:** 07-02
**Severity:** Major
**Feature:** Card status panel in Host app
**Description:** After registering a card and marking songs as played, the Cards panel shows the registered card but does not display a progress indicator showing how many matches the card has toward a win.
**Root Cause:** Field name mismatch - component used `card.required` but API returns `card.total_needed`
**Fix:** Changed `card.required` to `card.total_needed` in CardStatusPanel.jsx

### UAT-002: Player View pattern not syncing with Host pattern selection

**Discovered:** 2026-01-25
**Resolved:** 2026-01-25 - Commit 983dc452
**Phase/Plan:** 07-03 (related to 05-04)
**Severity:** Major
**Feature:** Pattern display sync between Host and Player View
**Description:** The pattern displayed on the Player View (venue TV) does not match the pattern selected in the Host app.
**Root Cause:** PlayerView relied solely on storage events for pattern sync, which only fire across different browsing contexts
**Fix:** Added pattern sync from localStorage during polling interval

---

*Phase: 07-prize-winner-tracking*
*Tested: 2026-01-25*
