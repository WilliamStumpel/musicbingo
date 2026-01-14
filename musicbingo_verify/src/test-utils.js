/**
 * Common test fixtures and helpers for Music Bingo Verification App
 */

// Mock UUIDs for consistent testing
export const mockUUID = '12345678-1234-1234-1234-123456789012';
export const mockGameId = '87654321-4321-4321-4321-210987654321';
export const mockChecksum = '1a2b3c4d5e6f7a8b';
export const mockQRString = `${mockUUID}|${mockGameId}|${mockChecksum}`;

// Mock API responses
export const mockWinnerResponse = {
  winner: true,
  pattern: 'five_in_a_row',
  card_number: 42,
  card_id: mockUUID,
  game_id: mockGameId
};

export const mockNonWinnerResponse = {
  winner: false,
  pattern: null,
  card_number: 42,
  card_id: mockUUID,
  game_id: mockGameId
};

/**
 * Create a mock fetch response
 * @param {number} status - HTTP status code
 * @param {object} data - Response data
 * @returns {Promise} Mock fetch promise
 */
export function mockFetchResponse(status, data) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data)
  });
}

/**
 * Create a mock fetch error
 * @param {string} message - Error message
 * @returns {Promise} Rejected promise
 */
export function mockFetchError(message) {
  return Promise.reject(new TypeError(message));
}
