---
phase: 01-local-backend-infrastructure
plan: 05
subsystem: deployment
tags: [vercel, ngrok, https, ios, venue, startup]

# Dependency graph
requires:
  - phase: 01-local-backend-infrastructure
    provides: QR code modal, scanner PWA, API server
provides:
  - One-click venue startup
  - iOS camera support via HTTPS
  - Scanner PWA on Vercel
  - ngrok auto-detection
affects: [scanner-app, host-app, api, deployment]

# Tech tracking
tech-stack:
  added: [vercel, ngrok]
  patterns: [auto-detect external service URL, URL param for auto-connect]

key-files:
  created:
    - start-venue.sh
  modified:
    - musicbingo_host/src/components/ConnectionInfo.jsx
    - musicbingo_host/src/components/ConnectionInfo.css
    - musicbingo_host/src/services/gameApi.js
    - musicbingo_verify/src/App.js
    - musicbingo_verify/src/App.css
    - musicbingo_verify/src/components/Scanner.css
    - musicbingo_api/src/musicbingo_api/main.py

key-decisions:
  - "Deploy scanner to Vercel for permanent HTTPS (no cert management)"
  - "Use ngrok for API at venues (works with any IP)"
  - "Auto-detect ngrok via localhost:4040/api/tunnels"
  - "URL param ?server= for auto-connect"
  - "Use 100dvh for iOS Safari viewport"

patterns-established:
  - "External service auto-detection pattern (ngrok)"
  - "URL param for app initialization"

issues-created: []

# Metrics
duration: ~45min
completed: 2026-01-22
---

# Plan 01-05: Venue Deployment Infrastructure Summary

**One-click venue startup with iOS camera support via Vercel + ngrok**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-01-22
- **Completed:** 2026-01-22
- **Tasks:** 7
- **Files modified:** 7 + 1 new

## Accomplishments

1. **Fixed API endpoint bug** - Changed `/api/server-info` to `/api/network/info`
2. **Scanner auto-connect** - Reads `?server=` URL param and connects automatically
3. **iOS Safari fixes** - Added `100dvh` viewport, fixed flex layout for tabs
4. **Deployed scanner to Vercel** - https://musicbingo-verify.vercel.app (permanent HTTPS)
5. **ngrok auto-detection** - Host app detects ngrok URL from localhost:4040
6. **Protocol detection in API** - Returns https:// when accessed via HTTPS
7. **One-click startup script** - `./start-venue.sh` starts everything

## DJ Workflow

```bash
# At any venue:
./start-venue.sh

# Then:
# 1. Wait for "All services started!"
# 2. Click QR button in host app (ngrok auto-detected)
# 3. Players scan QR → auto-connects → camera works!
```

## Files Created

| File | Purpose |
|------|---------|
| `start-venue.sh` | One-click startup script for venues |

## Files Modified

| File | Change |
|------|--------|
| `musicbingo_host/src/components/ConnectionInfo.jsx` | Vercel URL, ngrok toggle, auto-detection |
| `musicbingo_host/src/components/ConnectionInfo.css` | ngrok input styling |
| `musicbingo_host/src/services/gameApi.js` | Fixed endpoint to `/api/network/info` |
| `musicbingo_verify/src/App.js` | Auto-connect from URL param |
| `musicbingo_verify/src/App.css` | iOS Safari viewport fix (100dvh) |
| `musicbingo_verify/src/components/Scanner.css` | Flex layout fix |
| `musicbingo_api/src/musicbingo_api/main.py` | HTTPS protocol detection |

## External Services

| Service | Purpose | URL |
|---------|---------|-----|
| Vercel | Scanner PWA hosting | https://musicbingo-verify.vercel.app |
| ngrok | API HTTPS tunnel | Dynamic per-venue |

## Decisions Made

1. **Vercel for scanner** - Free, permanent HTTPS, no cert management
2. **ngrok for API** - Works at any venue, no IP/cert issues
3. **Auto-detect ngrok** - Query localhost:4040/api/tunnels for URL
4. **URL param auto-connect** - `?server=` param triggers automatic connection
5. **100dvh for iOS** - Dynamic viewport height fixes Safari issues

## Verification

- [x] One-click startup works
- [x] ngrok auto-detected in QR modal
- [x] Scanner deployed to Vercel
- [x] Full flow tested on iPhone
- [x] Camera permission granted (HTTPS working)

## Next Steps

- Phase 1 complete with all infrastructure
- Ready for Phase 7: Prize & Winner Tracking

---
*Phase: 01-local-backend-infrastructure*
*Plan: 05*
*Completed: 2026-01-22*
