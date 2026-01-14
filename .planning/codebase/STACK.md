# Technology Stack

**Analysis Date:** 2026-01-14

## Languages

**Primary:**
- Python 3.9+ - Backend API and card generation systems (`musicbingo_api/`, `musicbingo_cards/`)
- JavaScript/JSX - React frontend for QR verification (`musicbingo_verify/src/`)

**Secondary:**
- CSS - Component styling (`musicbingo_verify/src/components/*.css`)

## Runtime

**Environment:**
- Python 3.9+ - Card generation CLI and FastAPI server
- Node.js 16+ - React frontend (implied by react-scripts 5.0.1)

**Package Managers:**
- pip - Python packages with `pyproject.toml` configuration
- npm - JavaScript packages with `package-lock.json` present

## Frameworks

**Core:**
- FastAPI >=0.104.0 - REST API server (`musicbingo_api/pyproject.toml`)
- React 19.2.3 - Frontend UI framework (`musicbingo_verify/package.json`)
- Click >=8.1.0 - Python CLI framework (`musicbingo_cards/pyproject.toml`)

**Testing:**
- pytest >=7.4.0 - Python unit/integration tests
- pytest-cov >=4.1.0 - Python coverage reporting
- pytest-asyncio >=0.21.0 - Async test support for FastAPI
- Jest - React testing (via react-scripts)
- @testing-library/react 16.3.1 - React component testing

**Build/Dev:**
- react-scripts 5.0.1 - Create React App build tooling
- Uvicorn >=0.24.0 - ASGI server for FastAPI
- setuptools >=61.0 - Python package building

## Key Dependencies

**Critical:**
- ReportLab >=4.0.0 - PDF generation for bingo cards (`musicbingo_cards/src/musicbingo_cards/pdf_generator.py`)
- qrcode >=7.4.0 - QR code generation (`musicbingo_cards/src/musicbingo_cards/qr_code.py`)
- Pillow >=10.0.0 - Image processing for QR codes
- Pydantic >=2.0.0 - API request/response validation (`musicbingo_api/src/musicbingo_api/schemas.py`)
- qr-scanner 1.4.2 - Browser QR code scanning (`musicbingo_verify/src/components/Scanner.jsx`)

**Infrastructure:**
- httpx >=0.25.0 - HTTP client for testing and integration (`integration_example.py`)
- python-multipart >=0.0.6 - Form data parsing for FastAPI
- gh-pages 6.3.0 - GitHub Pages deployment (`musicbingo_verify/package.json`)

## Configuration

**Environment:**
- `REACT_APP_API_URL` - API endpoint for frontend (`musicbingo_verify/.env.development`, `.env.production`)
- Development: `http://localhost:8000`
- Production: `https://api.musicbingo.example.com`

**Build:**
- `musicbingo_cards/pyproject.toml` - Card generator config (black, ruff, pytest)
- `musicbingo_api/pyproject.toml` - API server config
- `musicbingo_verify/package.json` - Frontend build and test config

## Platform Requirements

**Development:**
- macOS/Linux/Windows (any platform with Python 3.9+ and Node.js)
- No Docker required (optional for deployment)

**Production:**
- Frontend: GitHub Pages (static files) or any static host
- Backend: Railway, Render, or Fly.io recommended (`musicbingo_api/DEPLOYMENT.md`)
- Python 3.9+ runtime for API server

---

*Stack analysis: 2026-01-14*
*Update after major dependency changes*
