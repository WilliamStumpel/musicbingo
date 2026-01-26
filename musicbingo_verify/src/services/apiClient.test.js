/**
 * Tests for API Client Service
 */

import { ApiClient, registerCard } from './apiClient';
import {
  mockUUID,
  mockGameId,
  mockWinnerResponse,
  mockNonWinnerResponse,
  mockFetchResponse,
  mockFetchError,
} from '../test-utils';

// Mock the config module
jest.mock('../config', () => ({
  getApiUrl: jest.fn(() => 'http://localhost:8000'),
}));

import { getApiUrl } from '../config';

describe('ApiClient', () => {
  let client;
  let originalFetch;

  beforeEach(() => {
    client = new ApiClient('http://test-server:8000');
    originalFetch = global.fetch;
    global.fetch = jest.fn();
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('uses provided baseUrl', () => {
      const customClient = new ApiClient('http://custom:9000');
      expect(customClient.baseUrl).toBe('http://custom:9000');
    });

    it('falls back to null _baseUrl when no baseUrl provided', () => {
      const defaultClient = new ApiClient();
      // When no baseUrl provided, _baseUrl is null and getter uses getApiUrl()
      // The mock returns 'http://localhost:8000'
      expect(defaultClient._baseUrl).toBeNull();
      // The baseUrl getter will call getApiUrl() when _baseUrl is null
    });
  });

  describe('verifyCard', () => {
    it('returns verification result on 200 response', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockWinnerResponse),
      });

      const result = await client.verifyCard(mockGameId, mockUUID);

      expect(result).toEqual(mockWinnerResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `http://test-server:8000/api/verify/${mockGameId}/${mockUUID}`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Accept': 'application/json',
          }),
        })
      );
    });

    it('returns non-winner result on 200 response', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockNonWinnerResponse),
      });

      const result = await client.verifyCard(mockGameId, mockUUID);

      expect(result.winner).toBe(false);
      expect(result.pattern).toBeNull();
    });

    it('throws "Card or game not found" on 404', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Not found' }),
      });

      await expect(client.verifyCard(mockGameId, mockUUID)).rejects.toThrow(
        'Card or game not found. Please check the QR code.'
      );
    });

    it('throws "Server error" on 500', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ detail: 'Internal server error' }),
      });

      await expect(client.verifyCard(mockGameId, mockUUID)).rejects.toThrow(
        'Server error. Please try again.'
      );
    });

    it('throws with status code on other errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ detail: 'Forbidden' }),
      });

      await expect(client.verifyCard(mockGameId, mockUUID)).rejects.toThrow(
        'Verification failed with status 403'
      );
    });

    it('handles network errors with helpful message', async () => {
      global.fetch.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(client.verifyCard(mockGameId, mockUUID)).rejects.toThrow(
        'Network error: Failed to fetch. Server: http://test-server:8000'
      );
    });

    it('re-throws non-network errors as-is', async () => {
      const customError = new Error('Custom API error');
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(customError),
      });

      await expect(client.verifyCard(mockGameId, mockUUID)).rejects.toThrow(
        'Custom API error'
      );
    });
  });

  describe('healthCheck', () => {
    it('returns true on 200 response', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await client.healthCheck();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-server:8000/health',
        expect.objectContaining({
          method: 'GET',
          mode: 'cors',
        })
      );
    });

    it('returns false on non-200 response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 503,
      });

      const result = await client.healthCheck();

      expect(result).toBe(false);
    });

    it('returns false on network error', async () => {
      global.fetch.mockRejectedValue(new TypeError('Network error'));

      const result = await client.healthCheck();

      expect(result).toBe(false);
    });

    it('returns false on timeout error', async () => {
      global.fetch.mockRejectedValue(new Error('Timeout'));

      const result = await client.healthCheck();

      expect(result).toBe(false);
    });
  });
});

describe('registerCard', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('returns registration result on success', async () => {
    const mockRegistration = {
      card_id: mockUUID,
      card_number: 42,
      player_name: 'John Doe',
      registered_at: '2024-01-15T10:30:00Z',
    };

    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockRegistration),
    });

    const result = await registerCard(mockGameId, mockUUID, 'John Doe');

    expect(result).toEqual(mockRegistration);
    // Verify the fetch was called with correct structure
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const callArgs = global.fetch.mock.calls[0];
    expect(callArgs[0]).toContain(`/api/game/${mockGameId}/register-card`);
    expect(callArgs[1].method).toBe('POST');
    expect(callArgs[1].headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(callArgs[1].body)).toEqual({ card_id: mockUUID, player_name: 'John Doe' });
  });

  it('throws error message from response on failure', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ detail: 'Card already registered' }),
    });

    await expect(registerCard(mockGameId, mockUUID, 'John Doe')).rejects.toThrow(
      'Card already registered'
    );
  });

  it('throws default error message when response has no detail', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({}),
    });

    await expect(registerCard(mockGameId, mockUUID, 'John Doe')).rejects.toThrow(
      'Failed to register card'
    );
  });

  it('sends correct Content-Type header', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ card_id: mockUUID }),
    });

    await registerCard(mockGameId, mockUUID, 'Test User');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '1',
        }),
      })
    );
  });
});
