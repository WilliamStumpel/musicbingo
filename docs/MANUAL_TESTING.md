# Manual Device Testing Protocol

Comprehensive testing protocol for validating Music Bingo on real hardware before gigs.

## Prerequisites

### Devices Needed
- **Laptop** (macOS, Windows, or Linux) - Runs API server and Host app
- **Phone or Tablet** - Runs Scanner PWA for QR verification
- **TV/Monitor with HDMI** - Displays Player View for audience

### Network Setup
- All devices must be on the **same WiFi network**
- If using HTTPS (required for camera access):
  - Run `ngrok http 8000` to create HTTPS tunnel
  - Or use `./start-venue.sh` for automatic setup
- Scanner connects to API via QR code displayed in Host app

### Test Data
- Sample games in `games/` directory
- At least one printed card page for scanning tests
- Playlist CSV files for import testing

---

## Pre-Gig Checklist (30 minutes before)

Quick verification that everything works at the venue.

### Server Startup
- [ ] Start API server: `cd musicbingo_api && uvicorn musicbingo_api.main:app --host 0.0.0.0 --port 8000`
- [ ] Start Host app: `cd musicbingo_host && npm start`
- [ ] Verify Host app loads at http://localhost:3000
- [ ] If using ngrok: Verify tunnel status at http://localhost:4040

### Scanner Connection
- [ ] Open Host app on laptop
- [ ] Click "Show Connection QR"
- [ ] Scan QR code with phone camera (native camera app)
- [ ] Scanner PWA should open and connect automatically
- [ ] Verify "Connected" status appears in Scanner

### Quick Verification Test
- [ ] Load a test game from dropdown
- [ ] Mark 3-4 songs as played
- [ ] Scan a printed card with phone
- [ ] Confirm result displays (green/red)
- [ ] Reset round to clear state

**Estimated time: 10-15 minutes**

---

## Full Test Scenarios

### Scenario A: Game Prep (on laptop)

Tests the preparation workflow before a gig.

**Estimated time: 15 minutes**

#### Steps

1. **Create Venue**
   - [ ] Navigate to Prep tab
   - [ ] Click "Add Venue"
   - [ ] Enter venue name (e.g., "Test Bar")
   - [ ] Upload venue logo (JPG/PNG)
   - [ ] Save venue
   - [ ] Verify venue appears in list

2. **Create Venue Night**
   - [ ] Select venue from dropdown
   - [ ] Click "Add Night"
   - [ ] Set date and details
   - [ ] Save venue night
   - [ ] Verify night appears with "draft" status

3. **Add Game with Playlist**
   - [ ] Select venue night
   - [ ] Click "Add Game"
   - [ ] Upload CSV playlist (from Exportify export)
   - [ ] Verify playlist preview shows correct songs
   - [ ] Enter game name
   - [ ] Save game
   - [ ] Verify game appears in list

4. **Generate Cards**
   - [ ] Select game
   - [ ] Set card count (e.g., 50)
   - [ ] Click "Generate Cards"
   - [ ] Wait for generation to complete
   - [ ] Download PDF
   - [ ] Open PDF and verify:
     - [ ] 4 cards per page layout
     - [ ] Venue logo appears
     - [ ] QR codes are visible and clear
     - [ ] Song titles are readable

5. **Print Sample**
   - [ ] Print one page of cards
   - [ ] Verify print quality
   - [ ] Test QR code scans with phone camera

---

### Scenario B: Game Hosting (on laptop)

Tests the live game flow during a gig.

**Estimated time: 10 minutes**

#### Steps

1. **Load Game**
   - [ ] Navigate to Host tab
   - [ ] Select game from dropdown
   - [ ] Verify song list loads
   - [ ] Verify Call Board is empty

2. **Mark Songs as Played**
   - [ ] Click on 5 different songs
   - [ ] Verify each song:
     - [ ] Highlights in green (played)
     - [ ] Appears in Call Board
     - [ ] Shows in correct play order
   - [ ] Verify "Now Playing" indicator (amber) on last clicked

3. **Call Board Updates**
   - [ ] Confirm Call Board shows all 5 songs
   - [ ] Confirm songs are in order played
   - [ ] Confirm current song is highlighted

4. **Pattern Selection**
   - [ ] Click pattern selector
   - [ ] Change to "Four Corners"
   - [ ] Verify pattern display updates
   - [ ] Change to other patterns and verify each

5. **Prize Configuration**
   - [ ] Click prize field in header
   - [ ] Enter prize (e.g., "$50 Cash")
   - [ ] Verify prize displays
   - [ ] Verify prize appears in Player View footer

6. **Round Reset**
   - [ ] Click "Reset Round" button
   - [ ] Confirm dialog appears (destructive action warning)
   - [ ] Click confirm
   - [ ] Verify:
     - [ ] All songs cleared (back to unmarked)
     - [ ] Call Board cleared
     - [ ] Pattern retained
     - [ ] Prize retained

---

### Scenario C: Scanner Verification (on phone/tablet)

Tests the scanner PWA for win verification.

**Estimated time: 10 minutes**

#### Steps

1. **Connect to Server**
   - [ ] If not connected, scan connection QR from Host app
   - [ ] Verify "Connected to [server URL]" message
   - [ ] Verify connection persists after tab switch

2. **Scan Winning Card**
   - [ ] Mark enough songs in Host to create a winner
   - [ ] Scan the winning card QR
   - [ ] Verify:
     - [ ] Green "WINNER!" display
     - [ ] Confetti animation (if enabled)
     - [ ] Player name shows (if registered)
     - [ ] Pattern name displays

3. **Scan Non-Winning Card**
   - [ ] Scan a different card (not a winner)
   - [ ] Verify:
     - [ ] Red "Not Yet" display
     - [ ] Shows how many songs matched
     - [ ] Registration option appears

4. **Register Card to Player**
   - [ ] After non-winner scan, tap "Register Card"
   - [ ] Enter player name
   - [ ] Save registration
   - [ ] Verify in Host app:
     - [ ] Card appears in Card Status Panel
     - [ ] Player name shown
     - [ ] Progress indicator displays

5. **Manual Entry Fallback**
   - [ ] Switch to Manual Entry tab
   - [ ] Enter card code from printed card
   - [ ] Tap verify
   - [ ] Confirm result matches QR scan

6. **Song Checklist Sync**
   - [ ] Switch to Songs tab in Scanner
   - [ ] Verify played songs are highlighted
   - [ ] Mark a song in Host app
   - [ ] Verify Scanner updates within 2 seconds
   - [ ] Scroll through list - verify smooth performance

---

### Scenario D: Player View (on TV/monitor via HDMI)

Tests the audience display.

**Estimated time: 10 minutes**

#### Steps

1. **Open Player View**
   - [ ] In Host app, click "Open Player View"
   - [ ] New window opens
   - [ ] Drag window to external monitor
   - [ ] Maximize/full-screen

2. **Call Board Display**
   - [ ] Verify empty state message shows
   - [ ] Mark 3 songs in Host
   - [ ] Verify songs appear in Player View grid
   - [ ] Verify 4-column responsive layout
   - [ ] Mark more songs - verify max 20 visible

3. **Delayed Song Reveal**
   - [ ] Observe timer countdown when song marked
   - [ ] Verify song title hidden initially
   - [ ] After ~30 seconds, verify title reveals
   - [ ] Verify amber flash animation at reveal

4. **Pattern Display**
   - [ ] Verify pattern grid shows in corner
   - [ ] Change pattern in Host app
   - [ ] Verify Player View updates
   - [ ] Verify animation on change (scale/glow)

5. **Prize Display**
   - [ ] Set prize in Host app
   - [ ] Verify prize shows in Player View footer
   - [ ] When song title hidden, verify prize shows more prominently

6. **Winner Announcement**
   - [ ] Trigger winner in Host app (click "Announce Winner")
   - [ ] Verify celebration overlay:
     - [ ] Full screen
     - [ ] Winner name displays
     - [ ] Prize displays
     - [ ] Confetti animation
   - [ ] Tap or wait 8 seconds
   - [ ] Verify overlay dismisses
   - [ ] Verify return to Call Board

---

## Troubleshooting

### Scanner Won't Connect

**Symptoms:**
- QR scan opens blank page
- "Failed to connect" error
- Timeout on connection

**Solutions:**
1. **Check network:** Ensure phone and laptop are on same WiFi
2. **Check CORS:** API must allow scanner origin
3. **Check ngrok:** If using HTTPS tunnel, verify it's running at http://localhost:4040
4. **Check firewall:** Laptop firewall may block port 8000
5. **Retry:** Close Scanner completely, re-scan QR code

### QR Code Not Scanning

**Symptoms:**
- Camera sees QR but nothing happens
- "Invalid QR code" error
- Slow/inconsistent scanning

**Solutions:**
1. **Lighting:** Ensure good lighting on printed card
2. **Focus:** Hold phone steady, let camera focus
3. **Distance:** Try different distances (6-12 inches typical)
4. **Print quality:** Reprint if QR is smudged/faded
5. **Camera permission:** Check browser has camera access

### Slow Verification

**Symptoms:**
- Verification takes >2 seconds
- Spinner hangs
- Timeout errors

**Solutions:**
1. **Network:** Check WiFi signal strength on phone
2. **API logs:** Check terminal for errors
3. **Load test:** Try with fewer marked songs
4. **Restart API:** Kill and restart the server
5. **Memory:** Close other apps on phone

### Player View Not Syncing

**Symptoms:**
- Call Board doesn't update
- Pattern change doesn't reflect
- Winner announcement doesn't trigger

**Solutions:**
1. **Same browser:** Player View must be in same browser as Host
2. **localStorage:** Clear localStorage and refresh both windows
3. **Window focus:** Click on Player View window to ensure it's active
4. **Reopen:** Close Player View, reopen from Host app

### Host App Not Loading

**Symptoms:**
- Blank page at localhost:3000
- "Failed to compile" error
- Missing dependencies

**Solutions:**
1. **Install deps:** Run `npm install` in musicbingo_host/
2. **Port conflict:** Check if port 3000 is in use
3. **Node version:** Ensure Node.js 16+ installed
4. **Clear cache:** Delete node_modules and reinstall

---

## Test Sign-Off

| Scenario | Tested By | Date | Pass/Fail | Notes |
|----------|-----------|------|-----------|-------|
| A: Game Prep | | | | |
| B: Game Hosting | | | | |
| C: Scanner Verification | | | | |
| D: Player View | | | | |
| Pre-Gig Checklist | | | | |

---

*Last updated: 2026-01-31*
