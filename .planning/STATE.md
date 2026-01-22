# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-14)

**Core value:** Smooth host experience — the DJ can focus on the crowd and the energy, not on fighting software.
**Current focus:** Phase 7 complete — Prize & Winner Tracking

## Current Position

Phase: 7 of 8 (Prize & Winner Tracking) COMPLETE
Plan: 3/3 complete
Status: Phase 07 complete
Last activity: 2026-01-22 — Completed 07-03-PLAN.md (Winner Display)

Progress: ██████████ 100% (Phase 7)

## Pivot Notes

**Apple Music → Manual Playback (2026-01-18)**

Apple Developer Program setup blocked progress. User proposed simpler approach:
- DJ plays music directly in Spotify/Apple Music/any player with shuffle on
- App provides sortable/searchable song checklist to mark songs as played
- No streaming API integration required

**Decision:** Pivot to Manual Playback Mode
- Works with ANY music source (service-agnostic)
- No developer accounts or API keys needed
- Import playlists via Exportify CSV export
- Both host and scanner apps can mark songs
- Real-time sync via API polling (2 second interval)

---

**Spotify → Apple Music (2026-01-14)**

Spotify paused new app registrations, blocking Phase 3 implementation. After researching alternatives:
- Tidal: 30-second limit for third-party apps
- Amazon Music: Closed beta
- Deezer: 30-second limit
- YouTube Music: No official playback API

**Decision:** Pivot to Apple Music via MusicKit JS (subsequently pivoted to Manual Playback)

## Performance Metrics

**Velocity:**
- Total plans completed: 21 (Phases 1-7)
- Average duration: 7.4 min
- Total execution time: 155 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 5/5 | 57 min | 11.4 min |
| 2 | 3/3 | 26 min | 8.7 min |
| 3 | 4/4 | 11 min | 2.8 min |
| 4 | 2/2 | 7 min | 3.5 min |
| 5 | 4/4 | 11 min | 2.8 min |
| 6 | 1/1 | 8 min | 8.0 min |
| 7 | 3/3 | 35 min | 11.7 min |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- CORS regex for private network IPs (allow_origin_regex pattern)
- UDP socket to 8.8.8.8 for reliable local IP detection
- JSON game format matches card generator export structure
- Games directory at project root for easy access
- localStorage for server URL persistence in scanner PWA
- Auto-add http:// protocol for user-entered IP addresses
- 4-up layout uses 0.6 inch cells (fits 3.5x4.5 inch cards in 2x2 grid)
- Card limit increased to 1000 (from 200) for large venue support
- Canvas-based PDF rendering for complex multi-card layouts
- Word wrap + dynamic font sizing for 4-up cells (min 4pt, max 2 lines each for title/artist)
- Image conversion to RGB PNG buffer for reliable rendering (supports JPEG, PNG, etc.)
- **Manual Playback Mode** - DJ uses existing music player, marks songs in app (service-agnostic)
- **Exportify CSV import** - Standard format for playlist import from Spotify exports
- **2-second polling** - Simple sync mechanism between host and scanner apps
- **Song ID generation** - SHA256 hash of lowercase title+artist, truncated to 12 chars
- **Optimistic updates** - Toggle song played status immediately, rollback on API error
- **Game API service pattern** - All backend calls go through gameApi.js
- **30/70 column split** - Call Board 30%, Song Checklist 70% for desktop host view
- **Amber (#ffc107) for now playing** - Distinct from green (played) with pulsing animation
- **Combined click action** - Clicking song sets as now playing AND marks played
- **playedOrder array** - Track play order separate from playedSongs Set for Call Board history
- **window.confirm for reset** - Simple native dialog for destructive action confirmation
- **Red danger color for reset** - Using #dc3545 to indicate destructive action
- **localStorage for cross-window game sharing** - Host stores game filename, player view reads it
- **Full viewport player layout** - 100vw x 100vh with overflow:hidden for TV display
- **30-second song timer default** - Amber flash animation when target reached
- **localStorage for nowPlaying sync** - Host broadcasts nowPlaying to player view via localStorage
- **4-column responsive grid** - PlayerCallBoard uses 4 columns, responsive down to 2
- **Max 20 visible played songs** - Prevent grid overflow in player view
- **localStorage for pattern sync** - Host broadcasts currentPattern to player view
- **PatternDisplay 5x5 grid** - CSS Grid with green (#1DB954) highlighted cells
- **Pattern change animation** - Scale 1.1x + glow pulse on change (0.3s ease)
- **Connection QR code** - Host app displays server URL as QR code for easy scanner connection
- **Vercel for scanner PWA** - Deployed to https://musicbingo-verify.vercel.app for permanent HTTPS
- **ngrok for venue API** - HTTPS tunnel works at any venue regardless of IP
- **ngrok auto-detection** - Host app queries localhost:4040/api/tunnels to find ngrok URL
- **URL param auto-connect** - Scanner reads ?server= param and connects automatically
- **100dvh for iOS Safari** - Dynamic viewport height fixes mobile Safari layout issues
- **One-click venue startup** - ./start-venue.sh starts API + ngrok + host app
- **Card registration flow** - Show registration modal after closing non-winner result
- **registered_cards dict** - Store {player_name, registered_at} per card_id on GameState
- **Proactive winner detection** - Check all registered cards when songs marked played
- **detected_winners list** - Track winners with card_id, player_name, pattern, detected_at
- **current_prize persists** - Prize survives round reset, only detected_winners cleared
- **Toast notification pattern** - newWinners separate from detectedWinners for UI control
- **10-second auto-dismiss** - Toast notifications dismiss automatically or on click
- **CardStatusPanel slide-out** - Shows all registered cards with progress, polls every 5s
- **PrizeInput inline edit** - Click to edit prize in host header, gold accent styling
- **Prize display alternation** - Show prize in footer when song title is hidden
- **Winner announcement localStorage** - Cross-window sync via musicbingo_winner_announcement key
- **8-second announcement auto-dismiss** - Celebration overlay auto-dismisses or tap to close
- **CSS confetti animation** - 50 pseudo-elements with random delays/colors for performance
- **VerifyCardResponse player_name** - Backend includes player_name for registered cards

### Deferred Issues

None yet.

### Pending Todos

None yet.

### Blockers/Concerns

None - Manual Playback Mode removes all streaming API dependencies.

## Session Continuity

Last session: 2026-01-22
Stopped at: Completed Phase 7 (Prize & Winner Tracking)
Resume file: None
Next action: Phase 8 (if applicable) or project complete
