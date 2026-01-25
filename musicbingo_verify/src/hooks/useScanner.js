/**
 * useScanner Hook
 * Custom React hook for managing QR scanner state and verification logic
 */

import { useState } from 'react';
import { parseQRData } from '../services/qrParser';
import { apiClient } from '../services/apiClient';

export function useScanner() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Handle QR code scan
   * @param {string} qrString - Raw QR code string
   */
  const handleScan = async (qrString) => {
    // Guard: ignore null/empty scans (e.g., from scanner errors)
    if (!qrString || typeof qrString !== 'string') {
      console.warn('handleScan called with invalid input:', qrString);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      console.log('[useScanner] Scanned QR code:', qrString);

      // Parse QR data
      let cardId, gameId;
      try {
        const parsed = parseQRData(qrString);
        cardId = parsed.cardId;
        gameId = parsed.gameId;
        console.log('[useScanner] Parsed QR data:', { cardId, gameId });
      } catch (parseErr) {
        console.error('[useScanner] QR parse error:', parseErr);
        throw new Error(`QR parse error: ${parseErr.message}`);
      }

      // Verify with backend API
      let verifyResult;
      try {
        verifyResult = await apiClient.verifyCard(gameId, cardId);
        console.log('[useScanner] Verification result:', verifyResult);
      } catch (apiErr) {
        console.error('[useScanner] API error:', apiErr);
        throw new Error(`API error: ${apiErr.message}`);
      }

      // If this is a winner, trigger announcement on PlayerView
      if (verifyResult.winner) {
        const announcement = {
          card_number: verifyResult.card_number,
          player_name: verifyResult.player_name || 'Unknown Player',
          pattern: verifyResult.pattern,
          prize: localStorage.getItem('musicbingo_current_prize') || null,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem('musicbingo_winner_announcement', JSON.stringify(announcement));
        console.log('[useScanner] Winner announcement triggered:', announcement);
      }

      setResult(verifyResult);

    } catch (err) {
      console.error('[useScanner] Final error:', err.name, err.message, err.stack);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Reset state to scan another card
   */
  const reset = () => {
    setResult(null);
    setError(null);
    setIsProcessing(false);
  };

  return {
    result,
    error,
    isProcessing,
    handleScan,
    reset,
  };
}
