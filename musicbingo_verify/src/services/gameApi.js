/**
 * Game API service for communicating with the backend.
 */

import { getApiUrl } from '../config';

/**
 * Get list of available games.
 */
export async function getGames() {
  const url = `${getApiUrl()}/api/games`;
  console.log('[gameApi] Fetching games from:', url);
  try {
    const response = await fetch(url, {
      headers: { 'ngrok-skip-browser-warning': '1' }
    });
    if (!response.ok) throw new Error(`Failed to fetch games: ${response.status}`);
    const data = await response.json();
    return data.games || [];
  } catch (error) {
    console.error('[gameApi] Error fetching games:', error.name, error.message);
    throw error;
  }
}

// Common headers for all requests (ngrok skip warning)
const commonHeaders = {
  'ngrok-skip-browser-warning': '1',
};

/**
 * Load a game by filename.
 */
export async function loadGame(filename) {
  const response = await fetch(`${getApiUrl()}/api/games/load/${filename}`, {
    method: 'POST',
    headers: commonHeaders,
  });
  if (!response.ok) throw new Error('Failed to load game');
  return response.json();
}

/**
 * Get current game state (played songs, etc.).
 */
export async function getGameState(gameId) {
  const response = await fetch(`${getApiUrl()}/api/game/${gameId}/state`, {
    headers: commonHeaders,
  });
  if (!response.ok) {
    if (response.status === 404) {
      return { played_songs: [] };
    }
    throw new Error('Failed to get game state');
  }
  return response.json();
}

/**
 * Mark a song as played or unplayed.
 */
export async function markSongPlayed(gameId, songId, played = true) {
  const response = await fetch(`${getApiUrl()}/api/game/${gameId}/mark-song`, {
    method: 'POST',
    headers: { ...commonHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ song_id: songId, played })
  });
  if (!response.ok) throw new Error('Failed to mark song');
  return response.json();
}

/**
 * Poll for game state updates.
 */
export async function pollGameState(gameId) {
  try {
    const state = await getGameState(gameId);
    return state.played_songs || [];
  } catch (e) {
    console.error('Poll failed:', e);
    return null;
  }
}
