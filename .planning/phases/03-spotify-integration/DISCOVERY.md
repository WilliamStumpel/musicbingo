# Phase 3: Manual Playback Mode - Discovery

**Discovery Level:** 2 (Standard Research)
**Date:** 2026-01-18
**Updated:** Pivoted from streaming integration to manual playback mode

## Why Manual Playback Mode

**Original Plan:** Integrate Spotify/Apple Music APIs for in-app playback.

**Blockers Encountered:**
- Spotify: Paused new app registrations (Jan 2026)
- Apple Music: Requires Apple Developer Program ($99/year) - user setup issues
- Tidal/Deezer: 30-second playback limit for third-party apps
- Amazon Music: Closed beta

**Solution:** Decouple playback from the app entirely.

- DJ plays music in Spotify (or any player) with shuffle enabled
- DJ marks songs as played in Music Bingo app
- App focuses on game management, not music playback

**Benefits:**
- Works with ANY music source (Spotify, Apple Music, YouTube, local files)
- No API keys, developer accounts, or service subscriptions required
- Simpler architecture, faster to ship
- DJs already know how to use their preferred player

## Research Topics

1. Exportify CSV format for playlist import
2. Real-time sync options (WebSocket vs polling)
3. Mobile-friendly sortable list UI patterns

## Key Findings

### Exportify CSV Format

Exportify (https://exportify.net) exports Spotify playlists to CSV with these columns:

**Core columns for Music Bingo:**
| Column | Use |
|--------|-----|
| `Track Name` | Song title for cards and checklist |
| `Artist Name(s)` | Artist for cards and checklist |
| `Album Name` | Optional display |
| `Track Duration (ms)` | Reference info |
| `Album Image URL` | Album art display (optional) |
| `ISRC` | International Standard Recording Code (future cross-service lookup) |

**Other columns (less relevant for our use):**
- Track URI, Artist URI(s), Album URI
- Album Artist URI(s), Album Artist Name(s)
- Album Release Date, Disc Number, Track Number
- Track Preview URL, Explicit, Popularity
- Added By, Added At

**Import strategy:**
- Parse CSV with headers
- Extract Track Name + Artist Name(s) as minimum required fields
- Store ISRC for potential future use (Apple Music lookup)
- Generate unique song_id from hash of title+artist or use ISRC

### Spotify Shuffle Behavior

When using Spotify shuffle for games:
- Turn OFF "Autoplay" in Spotify settings to prevent extra songs
- Play from a playlist (not radio/artist page)
- DJ doesn't know song order - finds song in list when it plays

**UI implications:**
- Need fast song lookup (sort + search)
- No "next song" concept since order is random
- Simple tap to mark as played

### Real-time Sync Options

**Option 1: WebSocket**
- Instant updates between host and scanner
- More complex server implementation
- Requires persistent connection

**Option 2: Polling**
- Scanner polls API every 1-2 seconds
- Simpler implementation
- Slight delay (acceptable for this use case)

**Option 3: Server-Sent Events (SSE)**
- One-way push from server to clients
- Simpler than WebSocket
- Good for "game state changed" notifications

**Decision: Start with polling, upgrade to SSE if needed**
- Polling every 2 seconds is simple and sufficient
- Song marking isn't time-critical (not like chat)
- Can add SSE later for smoother experience

### Mobile Sortable List Patterns

**Sort controls:**
- Dropdown or segmented control for sort field (Title/Artist)
- Toggle button for direction (A-Z / Z-A)
- Keep sort preference in localStorage

**Search/filter:**
- Sticky search box at top
- Filter list as user types
- Clear button to reset

**Played indication:**
- Checkmark icon or filled circle
- Dimmed/grayed text
- Optional: strikethrough title
- Row still tappable to un-mark if needed

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Host App      │     │  Scanner App    │
│   (Laptop)      │     │  (Phone)        │
├─────────────────┤     ├─────────────────┤
│ Song Checklist  │     │ Song Checklist  │
│ - Sort/Search   │     │ - Sort/Search   │
│ - Mark played   │     │ - Mark played   │
│ - See status    │     │ - See status    │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │    Poll / Sync        │
         ▼                       ▼
    ┌─────────────────────────────────┐
    │         Backend API             │
    │  POST /api/game/{id}/mark-song  │
    │  GET /api/game/{id}/state       │
    └─────────────────────────────────┘
```

**Data flow:**
1. DJ hears song on Spotify
2. DJ finds song in checklist (search or scroll)
3. DJ taps to mark played
4. App calls POST /api/game/{id}/mark-song
5. Other device polls GET /api/game/{id}/state
6. UI updates to show song as played
7. QR scanner uses same state for win verification

## Implementation Plan

### Plan 03-01: CSV Playlist Import
- Add CSV import to card generator CLI
- Parse Exportify format (Track Name, Artist Name(s), etc.)
- Generate game JSON with songs array
- Support drag-drop or file picker in future web UI

### Plan 03-02: Host Checklist View
- Replace musicbingo_host player UI with checklist
- Sortable by title or artist (A-Z, Z-A)
- Search/filter box
- Tap to mark played, tap again to unmark
- Poll API for sync with scanner

### Plan 03-03: Scanner Checklist View
- Add song checklist tab/view to scanner PWA
- Same sort/search/mark features as host
- Syncs with host via API polling
- Complements existing QR scan functionality

### Plan 03-04: API Sync Endpoints
- POST /api/game/{id}/mark-song - Toggle song played status
- GET /api/game/{id}/state - Returns played_songs array
- Ensure atomic updates for concurrent access

## Sources

- [Exportify](https://exportify.net) - Spotify playlist export tool
- [Exportify GitHub](https://github.com/watsonbox/exportify) - Source and format details
