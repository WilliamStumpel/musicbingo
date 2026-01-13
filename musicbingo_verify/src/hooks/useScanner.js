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
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      console.log('Scanned QR code:', qrString);

      // Parse QR data
      const { cardId, gameId } = parseQRData(qrString);
      console.log('Parsed QR data:', { cardId, gameId });

      // Verify with backend API
      const verifyResult = await apiClient.verifyCard(gameId, cardId);
      console.log('Verification result:', verifyResult);

      setResult(verifyResult);

    } catch (err) {
      console.error('Scan error:', err);
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
