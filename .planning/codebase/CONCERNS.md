# Codebase Concerns

**Analysis Date:** 2026-01-14

## Tech Debt

**In-memory game state without persistence:**
- Issue: All game state stored in Python dict, lost on server restart
- Files: `musicbingo_api/src/musicbingo_api/game_service.py` (lines 16-18)
- Why: MVP development, no database configured yet
- Impact: Games lost if API crashes mid-game; unacceptable for production venue use
- Fix approach: Add SQLite or PostgreSQL persistence layer

**Console.log statements in production code:**
- Issue: Debug logging left in frontend code
- Files:
  - `musicbingo_verify/src/hooks/useScanner.js` (lines 25, 29, 33, 38)
  - `musicbingo_verify/src/components/Scanner.jsx` (line 43)
  - `musicbingo_verify/src/App.js` (line 31)
- Why: Development debugging not cleaned up
- Impact: Exposes internal state in browser console; unprofessional
- Fix approach: Remove or replace with environment-controlled logger

**Global singleton without thread safety:**
- Issue: `_game_service` singleton has no locking for concurrent access
- Files: `musicbingo_api/src/musicbingo_api/game_service.py` (lines 251-264)
- Why: Simple implementation for MVP
- Impact: Race conditions when multiple clients verify cards simultaneously
- Fix approach: Add threading locks or use database transactions

## Known Bugs

**No critical bugs identified** - codebase appears functional for its current scope.

**Potential race condition in verification:**
- Symptoms: Possible incorrect verification if song played during verify
- Trigger: Song played while card verification in progress
- Files: `musicbingo_api/src/musicbingo_api/game_service.py`
- Workaround: Unlikely in practice (verification is fast <2s)
- Root cause: No locking between `record_played_song` and `verify_card`

## Security Considerations

**No authentication on API endpoints:**
- Risk: Anyone can create games, add cards, or manipulate game state
- Files: `musicbingo_api/src/musicbingo_api/main.py` (all routes)
- Current mitigation: CORS restricts browser origins
- Recommendations: Add API key authentication for game management endpoints

**CORS allows all headers:**
- Risk: Slightly weakened CSRF protection
- Files: `musicbingo_api/src/musicbingo_api/main.py` (line 43)
- Current mitigation: Origin restriction in place
- Recommendations: Explicitly list required headers (`Content-Type`, `Accept`)

**No rate limiting:**
- Risk: API vulnerable to abuse or DoS
- Files: `musicbingo_api/src/musicbingo_api/main.py`
- Current mitigation: None
- Recommendations: Add rate limiting middleware

## Performance Bottlenecks

**O(n²) card overlap calculation:**
- Problem: Overlap statistics compare every card pair
- Files: `musicbingo_cards/src/musicbingo_cards/generator.py` (lines 221-241)
- Measurement: For 200 cards, 19,900 comparisons performed
- Cause: `calculate_average_overlap()` iterates all pairs
- Improvement path: Sample subset or optimize algorithm

**Inefficient card selection:**
- Problem: Requests 2x songs needed then discards duplicates
- Files: `musicbingo_cards/src/musicbingo_cards/generator.py` (lines 169-173)
- Measurement: Wastes ~50% of random selections
- Cause: `rng.choices(k=count*2)` oversamples
- Improvement path: Use `rng.sample()` for unique selections

## Fragile Areas

**QR code parsing:**
- Files: `musicbingo_verify/src/services/qrParser.js`
- Why fragile: Strict format expected (`cardId|gameId|checksum`)
- Common failures: Malformed QR codes cause cryptic errors
- Safe modification: Add more validation and user-friendly error messages
- Test coverage: Basic validation exists, edge cases not covered

**Game state transitions:**
- Files: `musicbingo_api/src/musicbingo_api/game_service.py`
- Why fragile: No state machine; status can be set arbitrarily
- Common failures: Operations allowed in wrong state
- Safe modification: Add explicit state machine with valid transitions
- Test coverage: Basic tests exist, state transitions not fully tested

## Scaling Limits

**In-memory game storage:**
- Current capacity: Limited by server RAM
- Limit: ~100-1000 concurrent games depending on memory
- Symptoms at limit: Out of memory error, server crash
- Scaling path: Move to database persistence

**No caching:**
- Current capacity: Every request hits game service
- Limit: API throughput limited by Python GIL
- Symptoms at limit: Slow responses under load
- Scaling path: Add Redis caching for game state

## Dependencies at Risk

**No critical dependency risks identified.**

All dependencies are actively maintained:
- FastAPI, React, pytest: Very active development
- ReportLab, qrcode: Stable, mature libraries

## Missing Critical Features

**Database persistence:**
- Problem: Game state lost on restart
- Current workaround: None (games must complete in one session)
- Blocks: Production deployment, game recovery
- Implementation complexity: Medium (add SQLAlchemy models)

**Authentication/Authorization:**
- Problem: No access control on API
- Current workaround: CORS origin restrictions
- Blocks: Multi-venue deployment, security audit
- Implementation complexity: Medium (add JWT or API keys)

**Spotify integration:**
- Problem: Manual playlist creation required
- Current workaround: CSV/TXT file import
- Blocks: Seamless DJ workflow
- Implementation complexity: Medium (OAuth flow + playlist API)

## Test Coverage Gaps

**API verification flow:**
- What's not tested: Full game lifecycle with edge cases
- Risk: Verification bugs in production
- Priority: High
- Difficulty to test: Needs async test setup with multiple cards

**QR parser edge cases:**
- What's not tested: Malformed inputs, partial data
- Risk: Cryptic errors for users
- Priority: Medium
- Difficulty to test: Straightforward unit tests

**Frontend error handling:**
- What's not tested: Network failures, API errors
- Risk: Poor user experience on failures
- Priority: Medium
- Difficulty to test: Requires mock network layer

## Documentation Gaps

**State machine not documented:**
- What's missing: Valid transitions between GameStatus values
- Impact: Developers may call operations in wrong state
- Fix: Add state diagram to ARCHITECTURE.md

**API error responses:**
- What's missing: Documentation of error codes and messages
- Impact: Frontend doesn't handle all error cases gracefully
- Fix: Add error response documentation

---

*Concerns audit: 2026-01-14*
*Update as issues are fixed or new ones discovered*
