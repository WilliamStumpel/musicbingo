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
    try {
      const response = await fetch(
        `${this.baseUrl}/api/verify/${gameId}/${cardId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

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
      // Re-throw with more context if it's a network error
      if (error.name === 'TypeError' || error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Health check - verify API is accessible
   * @returns {Promise<boolean>} True if API is accessible
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
