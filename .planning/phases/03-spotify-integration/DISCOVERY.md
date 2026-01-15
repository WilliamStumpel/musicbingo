# Phase 3: Spotify Integration - Discovery

**Discovery Level:** 2 (Standard Research)
**Date:** 2026-01-14

## Research Topics

1. Spotify Web Playback SDK - current docs and implementation
2. OAuth PKCE flow for local/desktop apps
3. Playing specific tracks with position control

## Key Findings

### OAuth Authentication (PKCE)

**Critical 2025 Update:** Spotify ends support for implicit grant flow, HTTP redirect URIs, and localhost aliases on November 27, 2025. Must use:
- Authorization Code Flow with PKCE
- HTTPS redirect URIs (except `http://127.0.0.1` which is still allowed)

**PKCE Flow Steps:**
1. Generate code verifier (43-128 character random string)
2. Create code challenge (SHA256 hash, base64url encoded)
3. Redirect to `https://accounts.spotify.com/authorize` with challenge
4. User authorizes, redirected back with authorization code
5. Exchange code + verifier for access_token + refresh_token
6. Use refresh_token to get new access tokens (they expire in 1 hour)

**No client secret needed for PKCE** - safe for browser/client-side apps.

### Required OAuth Scopes

For Music Bingo, we need:
- `streaming` - Required for Web Playback SDK
- `user-read-email` - Required for Web Playback SDK
- `user-read-private` - Required for Web Playback SDK
- `user-modify-playback-state` - Required to start/control playback
- `user-read-playback-state` - Required to read current playback state

### Web Playback SDK

**What it does:** Creates a "Spotify Connect device" in the browser that can play music.

**Requirements:**
- Spotify Premium account (mobile-only premium excluded)
- Modern browser (Chrome, Firefox, Safari, Edge)
- Valid access token with streaming scope

**Key Methods:**
- `new Spotify.Player({ name, getOAuthToken, volume })` - Create player
- `player.connect()` - Connect to Spotify
- `player.disconnect()` - Disconnect
- `player.togglePlay()`, `player.pause()`, `player.resume()` - Playback control
- `player.seek(position_ms)` - Seek to position
- `player.nextTrack()`, `player.previousTrack()` - Track navigation
- `player.setVolume(0-1)`, `player.getVolume()` - Volume control

**Key Events:**
- `ready` - Player connected, provides `device_id`
- `not_ready` - Player disconnected
- `player_state_changed` - Playback state changed
- `authentication_error` - Token invalid
- `account_error` - Not Premium
- `playback_error` - Track failed

### Playing Specific Tracks

Web Playback SDK creates a device, but to play specific tracks you need the Web API:

**Endpoint:** `PUT https://api.spotify.com/v1/me/player/play`

**Request Body:**
```json
{
  "device_id": "player_device_id",
  "uris": ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"],
  "position_ms": 30000
}
```

This is perfect for music bingo - we can:
1. Pass array of song URIs to play
2. Start at `position_ms: 30000` (30 seconds in) by default
3. Target our Web Playback SDK device via `device_id`

### Token Refresh

Access tokens expire in 1 hour. Refresh flow:
```
POST https://accounts.spotify.com/api/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
refresh_token=[stored_refresh_token]
client_id=[client_id]
```

Returns new access_token (and sometimes new refresh_token).

## Architecture Decision

**Use react-spotify-web-playback library?**

Pros:
- Pre-built UI with play/pause, seek, volume
- Handles device switching
- Nice styling options

Cons:
- Fixed UI that may not match our host view design
- We need custom controls for music bingo (next song in our sequence, clip timing)
- Doesn't handle authentication

**Decision: Build custom integration using raw SDK**

Reasons:
1. Music bingo needs specific controls (play clip from offset, auto-stop after duration)
2. Host view needs custom UI with call board, game state
3. We want full control over playback flow
4. Auth handling is the same either way

## Implementation Architecture

```
Frontend (React)
├── SpotifyAuth module
│   ├── generatePKCE() - Create verifier + challenge
│   ├── initiateLogin() - Redirect to Spotify
│   ├── handleCallback() - Exchange code for tokens
│   └── refreshToken() - Refresh before expiry
├── SpotifyPlayer module
│   ├── initializePlayer() - Load SDK, create player
│   ├── connect() / disconnect()
│   └── getDeviceId() - For API calls
└── SpotifyPlayback module
    ├── playSong(uri, position_ms) - Start specific track
    ├── pause() / resume()
    ├── getCurrentState()
    └── seekTo(position_ms)

Backend (FastAPI) - Optional
└── Token storage/refresh could be backend or frontend-only
```

For local-first app, we'll store tokens in localStorage with encryption consideration for refresh tokens.

## Sources

- [Spotify Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk)
- [Getting Started Tutorial](https://developer.spotify.com/documentation/web-playback-sdk/tutorials/getting-started)
- [SDK Reference](https://developer.spotify.com/documentation/web-playback-sdk/reference)
- [Authorization Code with PKCE](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow)
- [OAuth Scopes](https://developer.spotify.com/documentation/web-api/concepts/scopes)
- [Start Playback API](https://developer.spotify.com/documentation/web-api/reference/start-a-users-playback)
- [OAuth Migration Notice](https://developer.spotify.com/blog/2025-10-14-reminder-oauth-migration-27-nov-2025)
