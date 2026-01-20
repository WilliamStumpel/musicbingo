/**
 * Game API service for communicating with the backend.
 */

export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Get list of available games.
 */
export async function getGames() {
  const response = await fetch(`${API_BASE}/api/games`);
  if (!response.ok) throw new Error('Failed to fetch games');
  const data = await response.json();
  return data.games || [];
}

/**
 * Load a game by filename.
 */
export async function loadGame(filename) {
  const response = await fetch(`${API_BASE}/api/games/load/${filename}`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to load game');
  return response.json();
}

/**
 * Get current game state (played songs, etc.).
 */
export async function getGameState(gameId) {
  const response = await fetch(`${API_BASE}/api/game/${gameId}/state`);
  if (!response.ok) {
    // State endpoint might not exist yet, return empty state
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
  const response = await fetch(`${API_BASE}/api/game/${gameId}/mark-song`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ song_id: songId, played })
  });
  if (!response.ok) throw new Error('Failed to mark song');
  return response.json();
}

/**
 * Poll for game state updates.
 * Returns the current played_songs array.
 */
export async function pollGameState(gameId) {
  try {
    const state = await getGameState(gameId);
    return state.played_songs || [];
  } catch (e) {
    console.error('Poll failed:', e);
    return null; // Return null on error, don't throw
  }
}

/**
 * Set the winning pattern for a game.
 */
export async function setPattern(gameId, pattern) {
  const response = await fetch(`${API_BASE}/api/game/${gameId}/pattern?pattern=${pattern}`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to set pattern');
  return response.json();
}

/**
 * Reset round - clear all played songs for a new round.
 */
export async function resetRound(gameId) {
  const response = await fetch(`${API_BASE}/api/game/${gameId}/reset`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to reset round');
  return response.json();
}

/**
 * Reveal a song title on the player view.
 */
export async function revealSong(gameId, songId) {
  const response = await fetch(`${API_BASE}/api/game/${gameId}/reveal/${songId}`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to reveal song');
  return response.json();
}

/**
 * Get server network info (IP, port, URL).
 * Used for QR code display to show the actual network URL.
 */
export async function getServerInfo() {
  const response = await fetch(`${API_BASE}/api/server-info`);
  if (!response.ok) throw new Error('Failed to get server info');
  return response.json();
}
