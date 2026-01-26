/**
 * Tests for Game API Service
 */

import {
  API_BASE,
  getGames,
  loadGame,
  getGameState,
  markSongPlayed,
  pollGameState,
  setPattern,
  resetRound,
  getServerInfo,
  getCardStatuses,
  setPrize,
} from './gameApi';

describe('gameApi', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('API_BASE', () => {
    it('defaults to localhost:8000', () => {
      expect(API_BASE).toBe('http://localhost:8000');
    });
  });

  describe('getGames', () => {
    it('fetches from /api/games', async () => {
      const mockGames = [
        { filename: 'game1.json', name: 'Game 1' },
        { filename: 'game2.json', name: 'Game 2' },
      ];
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ games: mockGames }),
      });

      const result = await getGames();

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/api/games`);
      expect(result).toEqual(mockGames);
    });

    it('returns empty array when games is undefined', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await getGames();

      expect(result).toEqual([]);
    });

    it('throws error on non-ok response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(getGames()).rejects.toThrow('Failed to fetch games');
    });
  });

  describe('loadGame', () => {
    it('POSTs to /api/games/load/{filename}', async () => {
      const mockGame = { id: 'game123', name: 'Test Game', songs: [] };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGame),
      });

      const result = await loadGame('test-game.json');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/games/load/test-game.json`,
        { method: 'POST' }
      );
      expect(result).toEqual(mockGame);
    });

    it('throws error on non-ok response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(loadGame('missing.json')).rejects.toThrow('Failed to load game');
    });
  });

  describe('getGameState', () => {
    it('fetches game state from /api/game/{id}/state', async () => {
      const mockState = { played_songs: ['song1', 'song2'], pattern: 'five_in_a_row' };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockState),
      });

      const result = await getGameState('game123');

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/api/game/game123/state`);
      expect(result).toEqual(mockState);
    });

    it('returns empty played_songs array on 404', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await getGameState('new-game');

      expect(result).toEqual({ played_songs: [] });
    });

    it('throws error on other non-ok responses', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(getGameState('game123')).rejects.toThrow('Failed to get game state');
    });
  });

  describe('markSongPlayed', () => {
    it('POSTs song_id and played boolean to mark-song endpoint', async () => {
      const mockResponse = { played_songs: ['song1', 'song2'] };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await markSongPlayed('game123', 'song2', true);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/game/game123/mark-song`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ song_id: 'song2', played: true }),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('can unmark a song as played', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ played_songs: [] }),
      });

      await markSongPlayed('game123', 'song1', false);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ song_id: 'song1', played: false }),
        })
      );
    });

    it('throws error on non-ok response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
      });

      await expect(markSongPlayed('game123', 'song1', true)).rejects.toThrow('Failed to mark song');
    });
  });

  describe('pollGameState', () => {
    it('returns played_songs array from game state', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ played_songs: ['song1', 'song2', 'song3'] }),
      });

      const result = await pollGameState('game123');

      expect(result).toEqual(['song1', 'song2', 'song3']);
    });

    it('returns empty array when played_songs is undefined', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await pollGameState('game123');

      expect(result).toEqual([]);
    });

    it('returns null on error instead of throwing', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await pollGameState('game123');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });

    it('returns null on non-ok response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await pollGameState('game123');

      expect(result).toBeNull();
    });
  });

  describe('setPattern', () => {
    it('POSTs pattern as query param', async () => {
      const mockResponse = { pattern: 'four_corners' };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await setPattern('game123', 'four_corners');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/game/game123/pattern?pattern=four_corners`,
        { method: 'POST' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws error on non-ok response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
      });

      await expect(setPattern('game123', 'invalid')).rejects.toThrow('Failed to set pattern');
    });
  });

  describe('resetRound', () => {
    it('POSTs to /api/game/{id}/reset', async () => {
      const mockResponse = { played_songs: [], message: 'Round reset' };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await resetRound('game123');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/game/game123/reset`,
        { method: 'POST' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws error on non-ok response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(resetRound('game123')).rejects.toThrow('Failed to reset round');
    });
  });

  describe('getServerInfo', () => {
    it('fetches network info from /api/network/info', async () => {
      const mockInfo = {
        ip: '192.168.1.100',
        port: 8000,
        url: 'http://192.168.1.100:8000',
      };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockInfo),
      });

      const result = await getServerInfo();

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/api/network/info`);
      expect(result).toEqual(mockInfo);
    });

    it('throws error on non-ok response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(getServerInfo()).rejects.toThrow('Failed to get server info');
    });
  });

  describe('getCardStatuses', () => {
    it('fetches registered card progress from /api/game/{id}/card-statuses', async () => {
      const mockStatuses = {
        cards: [
          { card_id: 'card1', player_name: 'Alice', progress: 15 },
          { card_id: 'card2', player_name: 'Bob', progress: 18 },
        ],
      };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStatuses),
      });

      const result = await getCardStatuses('game123');

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/api/game/game123/card-statuses`);
      expect(result).toEqual(mockStatuses);
    });

    it('throws error on non-ok response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(getCardStatuses('game123')).rejects.toThrow('Failed to get card statuses');
    });
  });

  describe('setPrize', () => {
    it('POSTs prize value to /api/game/{id}/prize', async () => {
      const mockResponse = { prize: '$50 Gift Card' };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await setPrize('game123', '$50 Gift Card');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/game/game123/prize`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prize: '$50 Gift Card' }),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws error on non-ok response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
      });

      await expect(setPrize('game123', 'Prize')).rejects.toThrow('Failed to set prize');
    });
  });
});
