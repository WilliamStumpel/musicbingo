# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Music Bingo** is a professional DJ system for running music bingo games at bars and venues. The system includes:

- **Printed card generation**: Creates unique 5x5 bingo cards from Spotify playlists with QR codes
- **QR verification app**: Mobile/tablet app for instant (<2 second) win verification
- **Game display system**: TV/projector output with host controls for venue use
- **Music management**: Spotify OAuth integration and local file support

**Current Status**: Active development. Card generation system (Python) in progress. All work tracked via Beads issues in `.beads/issues.jsonl`.

## Issue Tracking with Beads

This project uses **Beads** - an AI-native, CLI-first issue tracking system that lives in the repository.

### Essential Commands

```bash
# View all issues
bd list

# View issue details
bd show <issue-id>

# Create new issues
bd create "Issue title"

# Update issue status
bd update <issue-id> --status in_progress
bd update <issue-id> --status done

# Sync with git (must do before pushing)
bd sync
```

### Issue Storage

- Issues stored in `.beads/issues.jsonl` (JSON Lines format)
- Git-native: syncs automatically with commits
- Custom merge driver handles concurrent edits: `bd merge %A %O %A %B`
- Issue IDs follow pattern: `musicbingo-[alphanumeric]`

## Workflow Requirements

### Session Completion Protocol ("Landing the Plane")

**MANDATORY before ending any work session:**

1. **File issues** - Create issues for any remaining work
2. **Run quality gates** (when code exists) - Tests, linters, builds must pass
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This step is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed (not just local)
7. **Hand off** - Provide context for next session

**Critical Rules:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

## Project Structure

```
musicbingo/
├── .beads/              # Beads issue tracking (git-native)
│   ├── config.yaml      # Beads configuration
│   ├── issues.jsonl     # All project issues (JSONL format)
│   ├── interactions.jsonl
│   ├── beads.db         # SQLite database
│   └── README.md        # Beads documentation
├── musicbingo_cards/    # Card generation system (Python 3.9+)
│   ├── src/musicbingo_cards/
│   │   ├── __init__.py
│   │   └── cli.py       # Click-based CLI interface
│   ├── tests/           # pytest test suite
│   ├── pyproject.toml   # Project config & dependencies
│   └── README.md        # Card generator documentation
├── AGENTS.md            # Agent workflow guidelines
└── CLAUDE.md            # This file
```

## Current Epics

Five main epics define the system architecture:

1. **Music Bingo MVP** (`musicbingo-cgb`) - Complete launch-ready system
2. **Printed Card Generation** (`musicbingo-73a`) - Generate 50-200 unique cards with QR codes, 30-40% song overlap between cards
3. **QR Code Verification System** (`musicbingo-0r8`) - <2 second verification, offline support, green/red feedback
4. **Game Display & Control** (`musicbingo-v2z`) - Venue display with host controls, song clips (30-60s normal, 10-15s lightning)
5. **Playlist & Music Management** (`musicbingo-kq8`) - Spotify OAuth, local files (MP3/M4A), min 48 songs

## Key Requirements

### Card Generation
- 5x5 grid: 24 songs + 1 free center space
- Unique QR code per card
- PDF export with custom branding (venue logo, DJ contact)
- Optimal distribution: 30-40% overlap between cards

### Verification System
- Must verify win in <2 seconds
- Works offline (pre-loaded active cards)
- Visual feedback: green (valid) / red (invalid)
- Manual backup code entry option
- Displays winning card number

### Game Display
- Song clip configuration: start point (default 30s in), duration (30-60s normal, 10-15s lightning)
- Transition time between songs (default 5s)
- Shows: current song, call board (history), active pattern
- Host controls: play/pause, skip, replay, pattern selection

### Playlist Requirements
- Spotify OAuth integration
- Local file support (MP3, M4A)
- Min 48 songs (quick), 60 (standard), 75 (marathon)
- Track played songs and metadata

## Development Commands

### Card Generation System (musicbingo_cards/)

```bash
# Install dependencies (run from project root)
python3 -m pip install -e "musicbingo_cards/[dev]"

# Run CLI (after installation)
/Users/bill/Library/Python/3.9/bin/musicbingo --help
/Users/bill/Library/Python/3.9/bin/musicbingo generate <playlist> -n 50 -o cards.pdf

# Run tests
pytest

# Format code
black src tests

# Lint code
ruff check src tests
```

### Tech Stack
- **Language**: Python 3.9+
- **CLI Framework**: Click
- **PDF Generation**: ReportLab
- **QR Codes**: qrcode + Pillow
- **Testing**: pytest, pytest-cov
- **Code Quality**: black, ruff
