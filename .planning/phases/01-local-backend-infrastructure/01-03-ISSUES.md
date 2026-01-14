# UAT Issues: Phase 01 Plan 03

**Tested:** 2026-01-14
**Source:** .planning/phases/01-local-backend-infrastructure/01-03-SUMMARY.md
**Tester:** User via /gsd:verify-work

## Open Issues

[None]

## Resolved Issues

### UAT-001: Scanner shows "Oops" error immediately on load

**Discovered:** 2026-01-14
**Phase/Plan:** 01-03
**Severity:** Blocker
**Feature:** Scanner PWA after server connection
**Description:** After successfully connecting to the server (entering localhost:8000), the scanner immediately shows an "Oops - Invalid QR Code: empty or non-string value" error screen before the user has scanned anything.
**Expected:** Scanner view should load with camera active, waiting for user to scan a QR code
**Actual:** Error screen appears immediately, clicking "Try Again" briefly shows scanner then loops back to error
**Repro:**
1. Clear localStorage (or fresh browser)
2. Open scanner PWA at localhost:3000
3. Enter `localhost:8000` in server input
4. Click Connect
5. Error screen appears immediately

**Resolved:** 2026-01-14 - Fixed in 01-03-FIX.md
**Commits:** b4fd943d, 7a6d01a6
**Root cause:** App.js incorrectly routed Scanner camera errors through handleScan(null), which tried to parse null as a QR code.
**Fix:** Removed handleScan(null) call, added defensive null check in useScanner.

---

*Phase: 01-local-backend-infrastructure*
*Plan: 03*
*Tested: 2026-01-14*
