# UAT Issues: Phase 01 Plan 03

**Tested:** 2026-01-14
**Source:** .planning/phases/01-local-backend-infrastructure/01-03-SUMMARY.md
**Tester:** User via /gsd:verify-work

## Open Issues

None

## Resolved Issues

### UAT-002: Scanner QR detection not triggering verification

**Discovered:** 2026-01-19
**Phase/Plan:** 01-03
**Severity:** Blocker
**Feature:** Scanner QR code detection
**Description:** When positioning a printed bingo card QR code within the scanner camera frame, the scanner shows an outline around the QR code but nothing happens. No verification is triggered.
**Expected:** Scanner should detect the QR code and automatically send it for verification, showing win/lose result
**Actual:** QR code is outlined but no verification occurs. No manual code entry option visible as fallback.
**Repro:**
1. Open scanner PWA at localhost:3001
2. Connect to backend
3. Load a game
4. Point camera at a printed bingo card QR code
5. QR code gets outlined but nothing happens

**Addressed:** 2026-01-20 - Fixed in 01-03-FIX2.md
**Commits:** 4d0b5caf, ded65945
**Fix:**
1. Added debug logging to trace QR scanner callback flow
2. Fixed isScanning initialization (was false, blocking initial scans)
3. Added manual code entry fallback UI for verification when QR detection fails

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
