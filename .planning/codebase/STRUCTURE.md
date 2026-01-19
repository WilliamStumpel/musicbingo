# Codebase Structure

**Analysis Date:** 2026-01-14

## Directory Layout

```
musicbingo/
├── .planning/                       # GSD planning documents
│   └── codebase/                    # Codebase analysis (this folder)
├── musicbingo_api/                  # FastAPI backend service
│   ├── src/musicbingo_api/          # Python source
│   ├── tests/                       # pytest tests
│   └── pyproject.toml               # Package config
├── musicbingo_cards/                # Card generation CLI
│   ├── src/musicbingo_cards/        # Python source
│   ├── tests/                       # pytest tests
│   └── pyproject.toml               # Package config
├── musicbingo_verify/               # React QR verification app
│   ├── src/                         # React source
│   ├── public/                      # Static assets
│   └── package.json                 # npm config
├── integration_example.py           # End-to-end example script
├── CLAUDE.md                        # Project instructions
└── AGENTS.md                        # Agent workflow guidelines
```

## Directory Purposes

**musicbingo_api/src/musicbingo_api/**
- Purpose: FastAPI REST API for game management
- Contains: main.py, game_service.py, models.py, schemas.py
- Key files:
  - `main.py` - FastAPI app, route handlers (~330 lines)
  - `game_service.py` - Game state management (~200 lines)
  - `models.py` - Domain objects, enums (~234 lines)
  - `schemas.py` - Pydantic request/response schemas (~143 lines)

**musicbingo_cards/src/musicbingo_cards/**
- Purpose: Card generation library and CLI
- Contains: cli.py, generator.py, models.py, playlist.py, pdf_generator.py, qr_code.py, exporter.py
- Key files:
  - `cli.py` - Click CLI interface (~222 lines)
  - `generator.py` - Card generation algorithm (~300 lines)
  - `models.py` - Card domain objects (~262 lines)
  - `playlist.py` - Playlist parsing (~350 lines)
  - `pdf_generator.py` - ReportLab PDF rendering (~200 lines)
  - `qr_code.py` - QR code generation (~206 lines)
  - `exporter.py` - JSON export (~100 lines)

**musicbingo_verify/src/**
- Purpose: React QR verification frontend
- Contains: App.js, config.js, hooks/, services/, components/
- Key files:
  - `App.js` - Main component orchestrator (~66 lines)
  - `hooks/useScanner.js` - Scan state hook (~62 lines)
  - `services/apiClient.js` - HTTP client (~78 lines)
  - `services/qrParser.js` - QR data parser (~57 lines)
  - `components/Scanner.jsx` - QR scanner UI
  - `components/ResultDisplay.jsx` - Win/lose feedback
  - `components/ErrorMessage.jsx` - Error display

## Key File Locations

**Entry Points:**
- `musicbingo_cards/src/musicbingo_cards/cli.py` - CLI entry point
- `musicbingo_api/src/musicbingo_api/main.py` - API server entry
- `musicbingo_verify/src/index.js` - React app entry

**Configuration:**
- `musicbingo_cards/pyproject.toml` - Card generator config
- `musicbingo_api/pyproject.toml` - API server config
- `musicbingo_verify/package.json` - Frontend config
- `musicbingo_verify/.env.development` - Dev environment
- `musicbingo_verify/.env.production` - Prod environment

**Core Logic:**
- `musicbingo_cards/src/musicbingo_cards/generator.py` - Card generation
- `musicbingo_api/src/musicbingo_api/game_service.py` - Game state
- `musicbingo_verify/src/hooks/useScanner.js` - Scan flow

**Testing:**
- `musicbingo_cards/tests/` - Card generator tests
- `musicbingo_api/tests/` - API tests
- `musicbingo_verify/src/App.test.js` - Frontend tests

**Documentation:**
- `CLAUDE.md` - Project instructions for Claude Code
- `AGENTS.md` - Agent workflow guidelines
- `musicbingo_api/DEPLOYMENT.md` - Deployment guide

## Naming Conventions

**Files:**
- Python: snake_case (e.g., `game_service.py`, `pdf_generator.py`)
- React components: PascalCase.jsx (e.g., `Scanner.jsx`, `ResultDisplay.jsx`)
- React utilities: camelCase.js (e.g., `apiClient.js`, `qrParser.js`)
- CSS: Same as component (e.g., `Scanner.css`)
- Tests: `test_*.py` (Python), `*.test.js` (JavaScript)

**Directories:**
- Python packages: snake_case (`musicbingo_cards`, `musicbingo_api`)
- React: lowercase (`hooks`, `services`, `components`)

**Special Patterns:**
- `__init__.py` - Python package marker
- `pyproject.toml` - Python project config
- `.env.*` - Environment configuration

## Where to Add New Code

**New API Endpoint:**
- Route handler: `musicbingo_api/src/musicbingo_api/main.py`
- Service logic: `musicbingo_api/src/musicbingo_api/game_service.py`
- Request/Response schemas: `musicbingo_api/src/musicbingo_api/schemas.py`
- Tests: `musicbingo_api/tests/test_api.py`

**New Card Feature:**
- Core logic: `musicbingo_cards/src/musicbingo_cards/`
- CLI command: `musicbingo_cards/src/musicbingo_cards/cli.py`
- Tests: `musicbingo_cards/tests/test_*.py`

**New Frontend Component:**
- Component: `musicbingo_verify/src/components/ComponentName.jsx`
- Styles: `musicbingo_verify/src/components/ComponentName.css`
- Hook (if needed): `musicbingo_verify/src/hooks/useFeature.js`
- Service (if needed): `musicbingo_verify/src/services/featureService.js`
- Tests: `musicbingo_verify/src/ComponentName.test.js`

**New Utility:**
- Python: `musicbingo_cards/src/musicbingo_cards/` or `musicbingo_api/src/musicbingo_api/`
- JavaScript: `musicbingo_verify/src/services/`

## Special Directories

**.planning/**
- Purpose: GSD planning and codebase documentation
- Source: Generated by GSD commands
- Committed: Yes (reference documentation)

**musicbingo_verify/build/**
- Purpose: Production build output
- Source: `npm run build`
- Committed: No (gitignored)

**musicbingo_verify/node_modules/**
- Purpose: npm dependencies
- Source: `npm install`
- Committed: No (gitignored)

---

*Structure analysis: 2026-01-14*
*Update when directory structure changes*
