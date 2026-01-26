/**
 * Tests for Prep API Service
 */

import {
  API_BASE,
  getVenues,
  getVenue,
  createVenue,
  updateVenue,
  deleteVenue,
  uploadVenueLogo,
  getVenueNights,
  getVenueNight,
  createVenueNight,
  updateVenueNight,
  deleteVenueNight,
  getGames,
  getGame,
  createGame,
  updateGame,
  deleteGame,
  parseCSV,
  generateCards,
  getDownloadPdfUrl,
  getDownloadJsonUrl,
} from './prepApi';

describe('prepApi', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn();
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

  // ============================================================================
  // Venues
  // ============================================================================

  describe('getVenues', () => {
    it('fetches venue list from /api/prep/venues', async () => {
      const mockVenues = [
        { id: 1, name: 'The Pub' },
        { id: 2, name: 'Sports Bar' },
      ];
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ venues: mockVenues }),
      });

      const result = await getVenues();

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/api/prep/venues`);
      expect(result).toEqual(mockVenues);
    });

    it('returns empty array when venues is undefined', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await getVenues();

      expect(result).toEqual([]);
    });

    it('throws error on non-ok response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(getVenues()).rejects.toThrow('Failed to fetch venues');
    });
  });

  describe('getVenue', () => {
    it('fetches single venue by ID', async () => {
      const mockVenue = { id: 1, name: 'The Pub', address: '123 Main St' };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockVenue),
      });

      const result = await getVenue(1);

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/api/prep/venues/1`);
      expect(result).toEqual(mockVenue);
    });

    it('throws error on non-ok response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(getVenue(999)).rejects.toThrow('Failed to fetch venue 999');
    });
  });

  describe('createVenue', () => {
    it('POSTs venue data', async () => {
      const venueData = { name: 'New Bar', address: '456 Oak St' };
      const mockResponse = { id: 3, ...venueData };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await createVenue(venueData);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/prep/venues`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(venueData),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws error detail from response on failure', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ detail: 'Venue name already exists' }),
      });

      await expect(createVenue({ name: 'Duplicate' })).rejects.toThrow('Venue name already exists');
    });

    it('throws default message when no detail', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({}),
      });

      await expect(createVenue({ name: 'Test' })).rejects.toThrow('Failed to create venue');
    });
  });

  describe('updateVenue', () => {
    it('PUTs venue data to update', async () => {
      const updateData = { name: 'Updated Bar' };
      const mockResponse = { id: 1, name: 'Updated Bar' };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await updateVenue(1, updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/prep/venues/1`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws error detail on failure', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Venue not found' }),
      });

      await expect(updateVenue(999, { name: 'Test' })).rejects.toThrow('Venue not found');
    });
  });

  describe('deleteVenue', () => {
    it('DELETEs venue by ID', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
      });

      const result = await deleteVenue(1);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/prep/venues/1`,
        { method: 'DELETE' }
      );
      expect(result).toBe(true);
    });

    it('throws error detail on failure', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ detail: 'Venue has associated nights' }),
      });

      await expect(deleteVenue(1)).rejects.toThrow('Venue has associated nights');
    });
  });

  describe('uploadVenueLogo', () => {
    it('POSTs file as FormData', async () => {
      const mockFile = new File(['test'], 'logo.png', { type: 'image/png' });
      const mockResponse = { logo_path: '/uploads/1_logo.png' };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await uploadVenueLogo(1, mockFile);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/prep/venues/1/logo`,
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws error detail on failure', async () => {
      const mockFile = new File(['test'], 'logo.png', { type: 'image/png' });
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ detail: 'Invalid file type' }),
      });

      await expect(uploadVenueLogo(1, mockFile)).rejects.toThrow('Invalid file type');
    });
  });

  // ============================================================================
  // Venue Nights
  // ============================================================================

  describe('getVenueNights', () => {
    it('fetches all venue nights without filter', async () => {
      const mockNights = [
        { id: 1, venue_id: 1, date: '2024-01-15' },
        { id: 2, venue_id: 2, date: '2024-01-16' },
      ];
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ nights: mockNights }),
      });

      const result = await getVenueNights();

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/api/prep/nights`);
      expect(result).toEqual(mockNights);
    });

    it('fetches with optional venue_id filter', async () => {
      const mockNights = [{ id: 1, venue_id: 1, date: '2024-01-15' }];
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ nights: mockNights }),
      });

      const result = await getVenueNights(1);

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/api/prep/nights?venue_id=1`);
      expect(result).toEqual(mockNights);
    });

    it('returns empty array when nights is undefined', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await getVenueNights();

      expect(result).toEqual([]);
    });

    it('throws error on non-ok response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(getVenueNights()).rejects.toThrow('Failed to fetch venue nights');
    });
  });

  describe('getVenueNight', () => {
    it('fetches single venue night by ID', async () => {
      const mockNight = { id: 1, venue_id: 1, date: '2024-01-15', notes: 'Test' };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockNight),
      });

      const result = await getVenueNight(1);

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/api/prep/nights/1`);
      expect(result).toEqual(mockNight);
    });

    it('throws error on non-ok response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(getVenueNight(999)).rejects.toThrow('Failed to fetch venue night 999');
    });
  });

  describe('createVenueNight', () => {
    it('POSTs venue night data', async () => {
      const nightData = { venue_id: 1, date: '2024-01-20', notes: 'Birthday party' };
      const mockResponse = { id: 3, ...nightData };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await createVenueNight(nightData);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/prep/nights`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nightData),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws error detail on failure', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ detail: 'Invalid date format' }),
      });

      await expect(createVenueNight({ date: 'bad-date' })).rejects.toThrow('Invalid date format');
    });
  });

  describe('updateVenueNight', () => {
    it('PUTs venue night data', async () => {
      const updateData = { status: 'ready' };
      const mockResponse = { id: 1, status: 'ready' };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await updateVenueNight(1, updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/prep/nights/1`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws error detail on failure', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Venue night not found' }),
      });

      await expect(updateVenueNight(999, {})).rejects.toThrow('Venue night not found');
    });
  });

  describe('deleteVenueNight', () => {
    it('DELETEs venue night by ID', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
      });

      const result = await deleteVenueNight(1);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/prep/nights/1`,
        { method: 'DELETE' }
      );
      expect(result).toBe(true);
    });

    it('throws error detail on failure', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ detail: 'Has associated games' }),
      });

      await expect(deleteVenueNight(1)).rejects.toThrow('Has associated games');
    });
  });

  // ============================================================================
  // Games
  // ============================================================================

  describe('getGames', () => {
    it('fetches all games without filter', async () => {
      const mockGames = [
        { id: 1, name: '80s Hits' },
        { id: 2, name: '90s Party' },
      ];
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ games: mockGames }),
      });

      const result = await getGames();

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/api/prep/games`);
      expect(result).toEqual(mockGames);
    });

    it('fetches games for specific venue night', async () => {
      const mockGames = [{ id: 1, name: '80s Hits', venue_night_id: 5 }];
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ games: mockGames }),
      });

      const result = await getGames(5);

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/api/prep/games?venue_night_id=5`);
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

  describe('getGame', () => {
    it('fetches single game with full playlist', async () => {
      const mockGame = {
        id: 1,
        name: '80s Hits',
        playlist: [{ song_id: 's1', title: 'Song 1' }],
      };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGame),
      });

      const result = await getGame(1);

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/api/prep/games/1`);
      expect(result).toEqual(mockGame);
    });

    it('throws error on non-ok response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(getGame(999)).rejects.toThrow('Failed to fetch game 999');
    });
  });

  describe('createGame', () => {
    it('POSTs game with playlist', async () => {
      const gameData = {
        venue_night_id: 1,
        name: 'New Game',
        playlist: [{ title: 'Song 1', artist: 'Artist 1' }],
        card_count: 50,
      };
      const mockResponse = { id: 3, ...gameData };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await createGame(gameData);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/prep/games`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gameData),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws error detail on failure', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ detail: 'Playlist too short' }),
      });

      await expect(createGame({})).rejects.toThrow('Playlist too short');
    });
  });

  describe('updateGame', () => {
    it('PUTs game data', async () => {
      const updateData = { name: 'Updated Game', card_count: 100 };
      const mockResponse = { id: 1, ...updateData };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await updateGame(1, updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/prep/games/1`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws error detail on failure', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Game not found' }),
      });

      await expect(updateGame(999, {})).rejects.toThrow('Game not found');
    });
  });

  describe('deleteGame', () => {
    it('DELETEs game by ID', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
      });

      const result = await deleteGame(1);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/prep/games/1`,
        { method: 'DELETE' }
      );
      expect(result).toBe(true);
    });

    it('throws error detail on failure', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ detail: 'Cannot delete generated game' }),
      });

      await expect(deleteGame(1)).rejects.toThrow('Cannot delete generated game');
    });
  });

  describe('parseCSV', () => {
    it('POSTs CSV file as FormData', async () => {
      const mockFile = new File(['title,artist\nSong1,Artist1'], 'playlist.csv', { type: 'text/csv' });
      const mockResponse = {
        songs: [{ song_id: 's1', title: 'Song1', artist: 'Artist1' }],
      };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await parseCSV(mockFile);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/prep/games/parse-csv`,
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws error detail on failure', async () => {
      const mockFile = new File(['bad data'], 'bad.csv', { type: 'text/csv' });
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ detail: 'Invalid CSV format' }),
      });

      await expect(parseCSV(mockFile)).rejects.toThrow('Invalid CSV format');
    });
  });

  describe('generateCards', () => {
    it('POSTs to generate endpoint', async () => {
      const mockResponse = {
        success: true,
        card_count: 50,
        pdf_path: '/games/game1_cards.pdf',
        json_path: '/games/game1.json',
        message: 'Generated 50 cards',
      };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await generateCards(1);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE}/api/prep/games/1/generate`,
        { method: 'POST' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws error detail on failure', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ detail: 'Generation failed' }),
      });

      await expect(generateCards(1)).rejects.toThrow('Generation failed');
    });
  });

  describe('getDownloadPdfUrl', () => {
    it('returns correct PDF download URL', () => {
      const url = getDownloadPdfUrl(42);

      expect(url).toBe(`${API_BASE}/api/prep/games/42/download/pdf`);
    });
  });

  describe('getDownloadJsonUrl', () => {
    it('returns correct JSON download URL', () => {
      const url = getDownloadJsonUrl(42);

      expect(url).toBe(`${API_BASE}/api/prep/games/42/download/json`);
    });
  });
});
