# Game Prep Guide

How to set up Music Bingo games before an event.

## Prerequisites

- Music Bingo installed and working
- Playlists exported as CSV files (use [Exportify](https://exportify.net/) for Spotify)
- Logo image for venue branding (optional, PNG or JPG)

## Step 1: Start the Services

From the `musicbingo` directory:

```bash
./start-venue.sh
```

This starts:
- **API server** on http://localhost:8000
- **ngrok tunnel** (if installed) for HTTPS phone access
- **Host app** on http://localhost:3000

Wait for "All services started!" then open **http://localhost:3000** in your browser.

> **Note:** If you get "permission denied", run `chmod +x start-venue.sh` first.

## Step 2: Create a Venue (First Time Only)

1. Click the **Prep** tab
2. Click **Venues** → **New Venue**
3. Fill in:
   - Venue name
   - Contact info (shown on cards)
   - Upload logo (optional)
4. Save

Venues persist in the database - you only need to create each venue once.

## Step 3: Create a Venue Night

A "Venue Night" represents a single event date.

1. In **Prep** tab, go to **Venue Nights**
2. Click **New Venue Night**
3. Select your venue
4. Set the date
5. Save

The night starts in "draft" status until you add games.

## Step 4: Add Games (Rounds)

Each game is one round of bingo with its own playlist and cards.

1. Click on your venue night to open it
2. Click **Add Game**
3. For each round:
   - Enter game name (e.g., "Round 1 - 80s Hits")
   - Upload CSV playlist file
   - Set card count (50-200 typical)
   - Save
4. Repeat for each round

## Step 5: Generate Cards

For each game:

1. Click **Generate Cards** button
2. Wait for generation to complete
3. **Download PDF** - this is your print-ready file

Each PDF has 4 cards per page with:
- Unique QR code per card
- Venue logo
- Contact info

## Step 6: Print Cards

- Print PDFs on standard letter paper (8.5" x 11")
- Cut into individual cards (4 per page)
- Recommended: 100 cards = 25 pages per round

## Step 7: Test Before the Event

1. Go to **Host** tab
2. Select a game from the dropdown
3. Test scanning:
   - Click QR code icon to show connection code
   - Scan with your phone to open scanner app
   - Scan a printed bingo card
   - Register it to a test name
4. Verify registration appears in the Cards panel
5. **Reset for fresh start:**
   - Click **Reset Round** (clears played songs)
   - Open Cards panel → **Clear All Registrations**

Repeat for each game to verify everything works.

## Day of Event Checklist

- [ ] Run `./start-venue.sh`
- [ ] Verify all games load in Host tab
- [ ] Test scanner connection (QR code)
- [ ] Quick scan test with one card
- [ ] Have printed cards ready
- [ ] ngrok running for phone scanner access

## Troubleshooting

### Games not showing in Host dropdown
The Prep UI stores games separately from Host. After generating cards, games should appear automatically. If not, restart the services.

### Scanner won't connect
- Check ngrok is running (required for HTTPS on phones)
- Verify phone is on same WiFi as laptop
- Try the ngrok URL directly: check terminal output or http://localhost:4040

### QR codes not scanning
- Ensure good lighting
- Hold phone steady
- Try different distance from card
- Check camera permissions in browser

### "Failed to load game" error
Restart services and try again. If persists, check terminal for error messages.

## Between Rounds

1. Load next game from dropdown
2. Cards from previous round stay registered to players
3. If redistributing cards: **Clear All Registrations** first
4. **Reset Round** clears played songs for fresh start
