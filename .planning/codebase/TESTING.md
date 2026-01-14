# Testing Patterns

**Analysis Date:** 2026-01-14

## Test Framework

**Python (pytest):**
- Runner: pytest >=7.4.0
- Config: `[tool.pytest.ini_options]` in `pyproject.toml`
- Coverage: pytest-cov >=4.1.0
- Async: pytest-asyncio >=0.21.0 (for API tests)

**JavaScript (Jest):**
- Runner: Jest (via react-scripts)
- Config: `jest` section in `package.json`
- Testing Library: @testing-library/react 16.3.1

**Run Commands:**
```bash
# Python - Card Generator
cd musicbingo_cards
pytest                              # Run all tests
pytest -v --cov=musicbingo_cards    # With coverage
pytest tests/test_generator.py     # Single file

# Python - API
cd musicbingo_api
pytest                              # Run all tests
pytest -v --cov=musicbingo_api      # With coverage

# JavaScript - Frontend
cd musicbingo_verify
npm test                            # Interactive watch mode
npm test -- --coverage              # Coverage report
npm test -- --watchAll=false        # CI mode
```

## Test File Organization

**Python Location:**
- `musicbingo_cards/tests/test_*.py` - Card generator tests
- `musicbingo_api/tests/test_*.py` - API tests
- Separate `tests/` directory (not co-located)

**JavaScript Location:**
- `musicbingo_verify/src/*.test.js` - Co-located with source
- `musicbingo_verify/src/test-utils.js` - Shared test utilities

**Naming:**
- Python: `test_*.py` files, `Test*` classes, `test_*` functions
- JavaScript: `*.test.js` files

**Structure:**
```
musicbingo_cards/
  tests/
    test_cli.py
    test_generator.py
    test_models.py
    test_pdf_generator.py
    test_playlist.py
    test_qr_code.py
    test_exporter.py

musicbingo_api/
  tests/
    __init__.py
    test_api.py
    test_models.py

musicbingo_verify/
  src/
    App.test.js
    test-utils.js
```

## Test Structure

**Python Suite Organization:**
```python
# From musicbingo_cards/tests/test_generator.py
import pytest
from musicbingo_cards.generator import CardGenerator, CardGenerationError
from musicbingo_cards.models import Song
from musicbingo_cards.playlist import Playlist

class TestCardGenerator:
    """Tests for CardGenerator class."""

    @pytest.fixture
    def medium_playlist(self):
        """Create a medium test playlist (60 songs)."""
        songs = [Song(title=f"Song {i}", artist=f"Artist {i}") for i in range(60)]
        return Playlist(songs, name="Test Medium")

    def test_generate_minimum_cards(self, medium_playlist):
        """Test generating minimum number of cards (50)."""
        generator = CardGenerator(medium_playlist, random_seed=42)
        cards = generator.generate_cards(50)

        assert len(cards) == 50
        assert all(card.is_complete() for card in cards)
```

**JavaScript Suite Organization:**
```javascript
// From musicbingo_verify/src/App.test.js
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Music Bingo app', () => {
  render(<App />);
  const element = screen.getByText(/Music Bingo/i);
  expect(element).toBeInTheDocument();
});
```

**Patterns:**
- Use `beforeEach` for per-test setup
- Use `afterEach` to clean up (restore mocks, delete temp files)
- Arrange/Act/Assert structure in test bodies
- One assertion focus per test (multiple expects OK)

## Mocking

**Python (pytest):**
- Fixtures for test data setup
- `tempfile` for file-based tests
- No complex mocking framework used

**JavaScript (Jest):**
- `jest.fn()` for mock functions
- Custom test utilities in `test-utils.js`

**Mock Utilities:**
```javascript
// From musicbingo_verify/src/test-utils.js
export const mockUUID = '12345678-1234-1234-1234-123456789012';
export const mockGameId = '87654321-4321-4321-4321-210987654321';

export const mockWinnerResponse = {
  winner: true,
  pattern: 'five_in_a_row',
  card_number: 42,
  card_id: mockUUID,
  game_id: mockGameId
};

export function mockFetchResponse(status, data) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data)
  });
}
```

**What to Mock:**
- File system operations (use tempfile)
- External API calls
- Time/dates when determinism needed
- Random number generation (use seeds)

**What NOT to Mock:**
- Internal pure functions
- Simple utilities
- Domain model methods

## Fixtures and Factories

**Python Fixtures:**
```python
# From musicbingo_cards/tests/test_cli.py
@pytest.fixture
def sample_playlist_file():
    """Create a sample playlist file for testing."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
        for i in range(60):
            f.write(f"Song {i} - Artist {i}\n")
        temp_path = f.name
    yield temp_path
    Path(temp_path).unlink(missing_ok=True)
```

**JavaScript Fixtures:**
- Mock data objects in `test-utils.js`
- Factory functions for complex objects

**Location:**
- Python: Define in test files or `conftest.py`
- JavaScript: `src/test-utils.js` for shared fixtures

## Coverage

**Python Requirements:**
- Config in `pyproject.toml`:
```toml
addopts = "-v --cov=musicbingo_cards --cov-report=term-missing"
```
- No enforced threshold (coverage for awareness)

**JavaScript Requirements:**
- Config in `package.json`:
```json
"coverageThreshold": {
  "global": {
    "branches": 80,
    "functions": 85,
    "lines": 85,
    "statements": 85
  }
}
```

**View Coverage:**
```bash
# Python
pytest --cov=musicbingo_cards --cov-report=html
open htmlcov/index.html

# JavaScript
npm test -- --coverage
open coverage/lcov-report/index.html
```

## Test Types

**Unit Tests:**
- Python: `test_models.py` - Test domain objects in isolation
- JavaScript: Component tests with Testing Library
- Fast: Each test under 100ms

**Integration Tests:**
- Python: `test_generator.py` - Test generator with real playlist
- Python: `test_api.py` - Test API endpoints with TestClient
- Mock only external boundaries

**End-to-End:**
- Manual testing via CLI and web app
- `integration_example.py` demonstrates full workflow
- No automated E2E framework

## Common Patterns

**Async Testing (Python):**
```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_game():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/game/start", json={...})
    assert response.status_code == 200
```

**Error Testing (Python):**
```python
def test_empty_title_raises_error(self):
    """Test that empty title raises ValueError."""
    with pytest.raises(ValueError, match="title cannot be empty"):
        Song(title="", artist="Test Artist")
```

**React Component Testing:**
```javascript
import { render, screen, fireEvent } from '@testing-library/react';

test('scanner handles scan result', async () => {
  render(<App />);
  const scanner = screen.getByTestId('scanner');
  // Test scanner behavior
});
```

**Snapshot Testing:**
- Not used in this codebase
- Prefer explicit assertions

---

*Testing analysis: 2026-01-14*
*Update when test patterns change*
