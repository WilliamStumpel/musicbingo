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
