/**
 * Prep API service for Game Prep UI.
 *
 * Provides functions for managing venues, nights, and games.
 */

export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// ============================================================================
// Venues
// ============================================================================

/**
 * Get all venues.
 */
export async function getVenues() {
  const response = await fetch(`${API_BASE}/api/prep/venues`);
  if (!response.ok) throw new Error('Failed to fetch venues');
  const data = await response.json();
  return data.venues || [];
}

/**
 * Get a single venue by ID.
 */
export async function getVenue(id) {
  const response = await fetch(`${API_BASE}/api/prep/venues/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch venue ${id}`);
  return response.json();
}

/**
 * Create a new venue.
 */
export async function createVenue(data) {
  const response = await fetch(`${API_BASE}/api/prep/venues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create venue');
  }
  return response.json();
}

/**
 * Update a venue.
 */
export async function updateVenue(id, data) {
  const response = await fetch(`${API_BASE}/api/prep/venues/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update venue');
  }
  return response.json();
}

/**
 * Delete a venue.
 */
export async function deleteVenue(id) {
  const response = await fetch(`${API_BASE}/api/prep/venues/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete venue');
  }
  return true;
}

/**
 * Upload a logo for a venue.
 */
export async function uploadVenueLogo(id, file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/prep/venues/${id}/logo`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload logo');
  }
  return response.json();
}

// ============================================================================
// Venue Nights
// ============================================================================

/**
 * Get all venue nights.
 * @param {number|null} venueId - Optional filter by venue ID
 */
export async function getVenueNights(venueId = null) {
  const url = venueId
    ? `${API_BASE}/api/prep/nights?venue_id=${venueId}`
    : `${API_BASE}/api/prep/nights`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch venue nights');
  const data = await response.json();
  return data.nights || [];
}

/**
 * Get a single venue night by ID.
 */
export async function getVenueNight(id) {
  const response = await fetch(`${API_BASE}/api/prep/nights/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch venue night ${id}`);
  return response.json();
}

/**
 * Create a new venue night.
 * @param {Object} data - { venue_id, date, notes }
 */
export async function createVenueNight(data) {
  const response = await fetch(`${API_BASE}/api/prep/nights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create venue night');
  }
  return response.json();
}

/**
 * Update a venue night.
 * @param {number} id - Venue night ID
 * @param {Object} data - { venue_id, date, status, notes }
 */
export async function updateVenueNight(id, data) {
  const response = await fetch(`${API_BASE}/api/prep/nights/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update venue night');
  }
  return response.json();
}

/**
 * Delete a venue night.
 */
export async function deleteVenueNight(id) {
  const response = await fetch(`${API_BASE}/api/prep/nights/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete venue night');
  }
  return true;
}

// ============================================================================
// Games
// ============================================================================

/**
 * Get all games.
 * @param {number|null} venueNightId - Optional filter by venue night ID
 */
export async function getGames(venueNightId = null) {
  const url = venueNightId
    ? `${API_BASE}/api/prep/games?venue_night_id=${venueNightId}`
    : `${API_BASE}/api/prep/games`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch games');
  const data = await response.json();
  return data.games || [];
}

/**
 * Get a single game by ID with full playlist.
 */
export async function getGame(id) {
  const response = await fetch(`${API_BASE}/api/prep/games/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch game ${id}`);
  return response.json();
}

/**
 * Create a new game.
 * @param {Object} data - { venue_night_id, name, playlist, card_count }
 */
export async function createGame(data) {
  const response = await fetch(`${API_BASE}/api/prep/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create game');
  }
  return response.json();
}

/**
 * Update a game.
 * @param {number} id - Game ID
 * @param {Object} data - { name, playlist, card_count, sort_order }
 */
export async function updateGame(id, data) {
  const response = await fetch(`${API_BASE}/api/prep/games/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update game');
  }
  return response.json();
}

/**
 * Delete a game.
 */
export async function deleteGame(id) {
  const response = await fetch(`${API_BASE}/api/prep/games/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete game');
  }
  return true;
}

/**
 * Parse a CSV file and return the playlist.
 * @param {File} file - CSV file to parse
 */
export async function parseCSV(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/prep/games/parse-csv`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to parse CSV');
  }
  return response.json();
}
