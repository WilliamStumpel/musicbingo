# Coding Conventions

**Analysis Date:** 2026-01-14

## Naming Patterns

**Files:**
- Python: snake_case for all files (`cli.py`, `generator.py`, `pdf_generator.py`)
- React components: PascalCase.jsx (`Scanner.jsx`, `ResultDisplay.jsx`)
- React utilities: camelCase.js (`apiClient.js`, `qrParser.js`)
- Test files: `test_*.py` (Python), `*.test.js` (JavaScript)

**Functions:**
- Python: snake_case (`generate_cards`, `parse_file`, `verify_card`)
- JavaScript: camelCase (`handleScan`, `verifyCard`, `formatPattern`)
- React hooks: `use` prefix (`useScanner`)
- Event handlers: `handle` prefix (`handleScan`, `handleError`)

**Variables:**
- Python: snake_case (`card_id`, `game_state`, `played_songs`)
- JavaScript: camelCase (`cardId`, `gameState`, `scanResult`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`, `NUM_CARDS`)

**Types:**
- Python classes: PascalCase (`CardGenerator`, `GameService`, `BingoCard`)
- Pydantic models: PascalCase (`CreateGameRequest`, `VerifyCardResponse`)
- Enums: PascalCase with UPPER_CASE values (`PatternType.FIVE_IN_A_ROW`)

## Code Style

**Python Formatting:**
- Tool: Black (`black>=23.0.0`)
- Line length: 100 characters (`musicbingo_cards/pyproject.toml`)
- Target version: py39
- Double quotes for strings

**Python Linting:**
- Tool: Ruff (`ruff>=0.1.0`)
- Rules: E (errors), F (pyflakes), I (imports), N (naming), W (warnings)
- Config: `[tool.ruff]` in `pyproject.toml`

**JavaScript Formatting:**
- Tool: Create React App defaults (Prettier-like)
- Indentation: 2 spaces
- Single quotes for strings (except JSX attributes)
- Semicolons required

**JavaScript Linting:**
- Tool: ESLint (via react-scripts)
- Extends: `react-app`, `react-app/jest`
- Config: `eslintConfig` in `package.json`

## Import Organization

**Python:**
1. Standard library (`import io`, `from pathlib import Path`)
2. Third-party (`import click`, `from fastapi import FastAPI`)
3. Local imports (`from .models import BingoCard`)

**JavaScript:**
1. React imports (`import React from 'react'`)
2. Third-party (`import QrScanner from 'qr-scanner'`)
3. Local imports (`import { useScanner } from './hooks/useScanner'`)
4. CSS imports (`import './App.css'`)

**Path Aliases:**
- None configured (relative imports used)

## Error Handling

**Python Patterns:**
- Custom exceptions: `class CardGenerationError(Exception)` in `generator.py`
- Validation: `raise ValueError("message")` for invalid input
- Context: `raise ValueError(f"Invalid position: ({row}, {col})")`

**JavaScript Patterns:**
- Try/catch in async handlers
- Error state in hooks: `const [error, setError] = useState(null)`
- Optional chaining for callbacks: `onError?.(err)`

**Error Types:**
- Validation: Throw `ValueError` (Python), reject promise (JS)
- API errors: Return HTTP status codes with error body
- Network errors: Catch and display user-friendly message

## Logging

**Framework:**
- Python: No structured logging (uses print)
- JavaScript: console.log/error (should be replaced)

**Patterns:**
- Debug: `console.log('QR scanned:', data)` in `useScanner.js`
- Errors: `console.error('Scanner error:', err)` in `Scanner.jsx`
- Note: Console statements should be removed for production

## Comments

**When to Comment:**
- Explain why, not what
- Document business rules and algorithms
- Avoid obvious comments

**Python Docstrings:**
- Google-style with Args, Returns, Raises sections
- Module-level docstring at file top
- Class and method docstrings

Example from `musicbingo_cards/src/musicbingo_cards/models.py`:
```python
@dataclass(frozen=True)
class Song:
    """Represents a song that can appear on a bingo card.

    Attributes:
        title: Song title
        artist: Artist name
        ...
    """
```

**JavaScript Comments:**
- JSDoc-style for functions and hooks
- Inline comments for complex logic

Example from `musicbingo_verify/src/components/Scanner.jsx`:
```javascript
// Debounce scans to prevent rapid duplicates
```

**TODO Comments:**
- Format: `# TODO: description` (Python) or `// TODO: description` (JS)
- Track in Beads issues for significant work

## Function Design

**Size:**
- Keep under 50 lines where practical
- Extract helpers for complex logic

**Parameters:**
- Python: Type hints for all parameters
- JavaScript: Destructure props in components
- Max 3-4 parameters, use options object for more

**Return Values:**
- Python: Type hints for return values
- Explicit returns preferred
- Early return for guard clauses

## Module Design

**Python Exports:**
- `__init__.py` for package exports
- Public API at package level

Example from `musicbingo_cards/src/musicbingo_cards/__init__.py`:
```python
from .generator import CardGenerator
from .models import BingoCard, Song
```

**JavaScript Exports:**
- Named exports for utilities and hooks
- Default exports for React components

**Barrel Files:**
- Not used (direct imports preferred)

## Type Safety

**Python:**
- Type hints throughout (`def generate_cards(self, num_cards: int) -> list[BingoCard]`)
- Pydantic for API validation
- dataclasses for domain objects

**JavaScript:**
- No TypeScript (plain JavaScript)
- PropTypes not used (could be added)

---

*Convention analysis: 2026-01-14*
*Update when patterns change*
