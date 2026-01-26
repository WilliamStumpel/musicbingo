/**
 * Tests for QR Parser Service
 */

import { parseQRData, validateChecksum } from './qrParser';
import { mockUUID, mockGameId, mockChecksum, mockQRString } from '../test-utils';

describe('parseQRData', () => {
  describe('valid QR strings', () => {
    it('parses valid QR string with 3 pipe-separated parts', () => {
      const result = parseQRData(mockQRString);

      expect(result).toEqual({
        cardId: mockUUID,
        gameId: mockGameId,
        checksum: mockChecksum,
      });
    });

    it('returns correct cardId from parsed data', () => {
      const result = parseQRData(mockQRString);
      expect(result.cardId).toBe(mockUUID);
    });

    it('returns correct gameId from parsed data', () => {
      const result = parseQRData(mockQRString);
      expect(result.gameId).toBe(mockGameId);
    });

    it('returns correct checksum from parsed data', () => {
      const result = parseQRData(mockQRString);
      expect(result.checksum).toBe(mockChecksum);
    });
  });

  describe('empty or non-string input', () => {
    it('throws error for empty string', () => {
      expect(() => parseQRData('')).toThrow('Invalid QR code: empty or non-string value');
    });

    it('throws error for null input', () => {
      expect(() => parseQRData(null)).toThrow('Invalid QR code: empty or non-string value');
    });

    it('throws error for undefined input', () => {
      expect(() => parseQRData(undefined)).toThrow('Invalid QR code: empty or non-string value');
    });

    it('throws error for number input', () => {
      expect(() => parseQRData(123)).toThrow('Invalid QR code: empty or non-string value');
    });

    it('throws error for object input', () => {
      expect(() => parseQRData({})).toThrow('Invalid QR code: empty or non-string value');
    });

    it('throws error for array input', () => {
      expect(() => parseQRData([])).toThrow('Invalid QR code: empty or non-string value');
    });
  });

  describe('wrong number of parts', () => {
    it('throws error for string with 2 parts', () => {
      expect(() => parseQRData('part1|part2')).toThrow('expected 3 parts');
    });

    it('throws error for string with 4 parts', () => {
      expect(() => parseQRData('part1|part2|part3|part4')).toThrow('expected 3 parts');
    });

    it('throws error for string with no delimiter', () => {
      expect(() => parseQRData('nodelmiter')).toThrow('expected 3 parts');
    });

    it('throws error for string with 1 part', () => {
      expect(() => parseQRData('singlepart')).toThrow('expected 3 parts');
    });
  });

  describe('invalid card ID UUID', () => {
    it('throws error for invalid cardId UUID format', () => {
      const invalidQR = `not-a-uuid|${mockGameId}|${mockChecksum}`;
      expect(() => parseQRData(invalidQR)).toThrow('card ID is not a valid UUID');
    });

    it('throws error for cardId with wrong segment count', () => {
      const invalidQR = `12345678-1234-1234-1234|${mockGameId}|${mockChecksum}`;
      expect(() => parseQRData(invalidQR)).toThrow('card ID is not a valid UUID');
    });

    it('throws error for empty cardId', () => {
      const invalidQR = `|${mockGameId}|${mockChecksum}`;
      expect(() => parseQRData(invalidQR)).toThrow('card ID is not a valid UUID');
    });
  });

  describe('invalid game ID UUID', () => {
    it('throws error for invalid gameId UUID format', () => {
      const invalidQR = `${mockUUID}|not-a-uuid|${mockChecksum}`;
      expect(() => parseQRData(invalidQR)).toThrow('game ID is not a valid UUID');
    });

    it('throws error for gameId with non-hex characters', () => {
      const invalidQR = `${mockUUID}|gggggggg-1234-1234-1234-123456789012|${mockChecksum}`;
      expect(() => parseQRData(invalidQR)).toThrow('game ID is not a valid UUID');
    });

    it('throws error for empty gameId', () => {
      const invalidQR = `${mockUUID}||${mockChecksum}`;
      expect(() => parseQRData(invalidQR)).toThrow('game ID is not a valid UUID');
    });
  });

  describe('invalid checksum', () => {
    it('throws error for checksum less than 16 characters', () => {
      const invalidQR = `${mockUUID}|${mockGameId}|abc123`;
      expect(() => parseQRData(invalidQR)).toThrow('checksum must be 16 characters');
    });

    it('throws error for checksum more than 16 characters', () => {
      const invalidQR = `${mockUUID}|${mockGameId}|1a2b3c4d5e6f7a8b9c`;
      expect(() => parseQRData(invalidQR)).toThrow('checksum must be 16 characters');
    });

    it('throws error for empty checksum', () => {
      const invalidQR = `${mockUUID}|${mockGameId}|`;
      expect(() => parseQRData(invalidQR)).toThrow('checksum must be 16 characters');
    });
  });
});

describe('validateChecksum', () => {
  describe('valid checksums', () => {
    it('returns true for valid 16-char hex checksum', () => {
      expect(validateChecksum(mockChecksum)).toBe(true);
    });

    it('returns true for all lowercase hex', () => {
      expect(validateChecksum('abcdef0123456789')).toBe(true);
    });

    it('returns true for all uppercase hex', () => {
      expect(validateChecksum('ABCDEF0123456789')).toBe(true);
    });

    it('returns true for mixed case hex', () => {
      expect(validateChecksum('AbCdEf0123456789')).toBe(true);
    });

    it('returns true for all numeric hex', () => {
      expect(validateChecksum('0123456789012345')).toBe(true);
    });
  });

  describe('invalid checksums', () => {
    it('returns false for empty string', () => {
      expect(validateChecksum('')).toBe(false);
    });

    it('returns false for null', () => {
      expect(validateChecksum(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(validateChecksum(undefined)).toBe(false);
    });

    it('returns false for string shorter than 16 chars', () => {
      expect(validateChecksum('abc123')).toBe(false);
    });

    it('returns false for string longer than 16 chars', () => {
      expect(validateChecksum('1a2b3c4d5e6f7a8b9c0d')).toBe(false);
    });

    it('returns false for non-hex characters', () => {
      expect(validateChecksum('ghijklmnopqrstuv')).toBe(false);
    });

    it('returns false for special characters', () => {
      expect(validateChecksum('1234!@#$5678%^&*')).toBe(false);
    });

    it('returns false for number input', () => {
      expect(validateChecksum(1234567890123456)).toBe(false);
    });
  });
});
