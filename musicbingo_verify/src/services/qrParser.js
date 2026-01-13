/**
 * QR Code Parser Service
 * Parses and validates QR codes from Music Bingo cards
 * Expected format: "card_id|game_id|checksum"
 */

/**
 * Parse QR code string into structured data
 * @param {string} qrString - Raw QR code string
 * @returns {{cardId: string, gameId: string, checksum: string}} Parsed QR data
 * @throws {Error} If QR format is invalid
 */
export function parseQRData(qrString) {
  if (!qrString || typeof qrString !== 'string') {
    throw new Error('Invalid QR code: empty or non-string value');
  }

  const parts = qrString.split('|');

  if (parts.length !== 3) {
    throw new Error('Invalid QR code format: expected 3 parts separated by |');
  }

  const [cardId, gameId, checksum] = parts;

  // Validate UUIDs (RFC 4122 format)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(cardId)) {
    throw new Error('Invalid QR code: card ID is not a valid UUID');
  }

  if (!uuidRegex.test(gameId)) {
    throw new Error('Invalid QR code: game ID is not a valid UUID');
  }

  if (!checksum || checksum.length !== 16) {
    throw new Error('Invalid QR code: checksum must be 16 characters');
  }

  return { cardId, gameId, checksum };
}

/**
 * Validate checksum format (basic sanity check)
 * Note: Full checksum validation happens on the backend
 * @param {string} checksum - Checksum string
 * @returns {boolean} True if checksum format is valid
 */
export function validateChecksum(checksum) {
  if (!checksum || typeof checksum !== 'string') {
    return false;
  }
  // Checksum should be 16 hexadecimal characters
  return /^[0-9a-f]{16}$/i.test(checksum);
}
