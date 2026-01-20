# UAT Issues: Phase 1 Plan 04

**Tested:** 2026-01-19
**Source:** .planning/phases/01-local-backend-infrastructure/01-04-SUMMARY.md
**Tester:** User via /gsd:verify-work

## Open Issues

[None]

## Resolved Issues

### UAT-001: QR code URL shows localhost instead of network IP

**Discovered:** 2026-01-19
**Resolved:** 2026-01-19
**Phase/Plan:** 01-04
**Severity:** Major
**Feature:** Connection QR code URL display
**Description:** The URL shown in the ConnectionInfo modal displays localhost instead of the actual network IP address (e.g., 192.168.x.x)
**Expected:** URL should show the network IP address so phones on the same WiFi can connect (e.g., http://192.168.1.100:8000)
**Actual:** URL shows localhost which won't work for external devices
**Repro:**
1. Start host app (npm start)
2. Click QR button in header
3. Observe URL text below QR code
**Resolution:** Added getServerInfo API function and updated ConnectionInfo to fetch real network URL from server-info endpoint

---

*Phase: 01-local-backend-infrastructure*
*Plan: 04*
*Tested: 2026-01-19*
