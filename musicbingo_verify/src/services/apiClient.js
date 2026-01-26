/**
 * API Client Service
 * Handles communication with the Music Bingo backend API
 */

import { getApiUrl } from '../config';

/**
 * API Client for Music Bingo verification
 */
export class ApiClient {
  constructor(baseUrl = null) {
    this._baseUrl = baseUrl;
  }

  /**
   * Get the base URL - uses provided URL or reads from config
   */
  get baseUrl() {
    return this._baseUrl || getApiUrl();
  }

  /**
   * Verify if a card is a winner
   * @param {string} gameId - Game/session UUID
   * @param {string} cardId - Card UUID
   * @returns {Promise<{winner: boolean, pattern: string|null, card_number: number, card_id: string, game_id: string}>}
   * @throws {Error} If verification fails
   */
  async verifyCard(gameId, cardId) {
    const url = `${this.baseUrl}/api/verify/${gameId}/${cardId}`;
    console.log('[ApiClient] Verifying card at:', url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': '1', // Bypass ngrok free tier interstitial
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Card or game not found. Please check the QR code.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again.');
        } else {
          throw new Error(`Verification failed with status ${response.status}`);
        }
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('[ApiClient] Error:', error.name, error.message);
      // Re-throw with more context if it's a network error
      if (error.name === 'TypeError' || error.message.includes('fetch')) {
        throw new Error(`Network error: ${error.message}. Server: ${this.baseUrl}`);
      }
      throw error;
    }
  }

  /**
   * Health check - verify API is accessible
   * @returns {Promise<boolean>} True if API is accessible
   */
  async healthCheck() {
    const url = `${this.baseUrl}/health`;
    console.log('[ApiClient] Health check:', url);
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': '1',
        },
      });
      console.log('[ApiClient] Health response:', response.status, response.ok);
      return response.ok;
    } catch (error) {
      console.error('[ApiClient] Health check error:', error.name, error.message);
      return false;
    }
  }
}

/**
 * Register a card to a player
 * @param {string} gameId - Game UUID
 * @param {string} cardId - Card UUID
 * @param {string} playerName - Player's name
 * @returns {Promise<{card_id: string, card_number: number, player_name: string, registered_at: string}>}
 * @throws {Error} If registration fails
 */
export async function registerCard(gameId, cardId, playerName) {
  const response = await fetch(`${getApiUrl()}/api/game/${gameId}/register-card`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': '1',
    },
    body: JSON.stringify({ card_id: cardId, player_name: playerName }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to register card');
  }
  return response.json();
}

// Export singleton instance
export const apiClient = new ApiClient();
