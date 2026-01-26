/**
 * Tests for Scanner Component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Scanner from './Scanner';

// Mock qr-scanner library to avoid camera access in tests
const mockStart = jest.fn().mockResolvedValue(undefined);
const mockStop = jest.fn();
const mockDestroy = jest.fn();

jest.mock('qr-scanner', () => {
  const MockQrScanner = function(videoElement, onScan, options) {
    this.start = mockStart;
    this.stop = mockStop;
    this.destroy = mockDestroy;
    this._onScan = onScan;
  };
  return MockQrScanner;
});

describe('Scanner', () => {
  const mockOnScan = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockStart.mockResolvedValue(undefined);
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders scanner container', () => {
      render(<Scanner onScan={mockOnScan} onError={mockOnError} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByText(/Or enter code manually/i)).toBeInTheDocument();
    });

    it('renders video element for camera', () => {
      const { container } = render(<Scanner onScan={mockOnScan} onError={mockOnError} />);

      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveClass('scanner-video');
    });

    it('renders manual entry input field', () => {
      render(<Scanner onScan={mockOnScan} onError={mockOnError} />);

      const input = screen.getByPlaceholderText('card_id|game_id|checksum');
      expect(input).toBeInTheDocument();
    });

    it('renders verify button for manual entry', () => {
      render(<Scanner onScan={mockOnScan} onError={mockOnError} />);

      expect(screen.getByRole('button', { name: /Verify/i })).toBeInTheDocument();
    });
  });

  describe('manual entry', () => {
    it('calls onScan when manual code is entered and verify button clicked', () => {
      render(<Scanner onScan={mockOnScan} onError={mockOnError} />);

      const input = screen.getByPlaceholderText('card_id|game_id|checksum');
      const button = screen.getByRole('button', { name: /Verify/i });

      fireEvent.change(input, { target: { value: 'test-code|test-game|checksum123456' } });
      fireEvent.click(button);

      expect(mockOnScan).toHaveBeenCalledWith('test-code|test-game|checksum123456');
    });

    it('clears input after manual submit', () => {
      render(<Scanner onScan={mockOnScan} onError={mockOnError} />);

      const input = screen.getByPlaceholderText('card_id|game_id|checksum');
      const button = screen.getByRole('button', { name: /Verify/i });

      fireEvent.change(input, { target: { value: 'test-code' } });
      fireEvent.click(button);

      expect(input.value).toBe('');
    });

    it('verify button is disabled when input is empty', () => {
      render(<Scanner onScan={mockOnScan} onError={mockOnError} />);

      const button = screen.getByRole('button', { name: /Verify/i });

      expect(button).toBeDisabled();
    });

    it('verify button is enabled when input has value', () => {
      render(<Scanner onScan={mockOnScan} onError={mockOnError} />);

      const input = screen.getByPlaceholderText('card_id|game_id|checksum');
      const button = screen.getByRole('button', { name: /Verify/i });

      fireEvent.change(input, { target: { value: 'some-code' } });

      expect(button).not.toBeDisabled();
    });

    it('trims whitespace from manual input', () => {
      render(<Scanner onScan={mockOnScan} onError={mockOnError} />);

      const input = screen.getByPlaceholderText('card_id|game_id|checksum');
      const button = screen.getByRole('button', { name: /Verify/i });

      fireEvent.change(input, { target: { value: '  test-code  ' } });
      fireEvent.click(button);

      expect(mockOnScan).toHaveBeenCalledWith('test-code');
    });

    it('does not call onScan for whitespace-only input', () => {
      render(<Scanner onScan={mockOnScan} onError={mockOnError} />);

      const input = screen.getByPlaceholderText('card_id|game_id|checksum');
      const button = screen.getByRole('button', { name: /Verify/i });

      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(button);

      expect(mockOnScan).not.toHaveBeenCalled();
    });
  });

  describe('QR scanner initialization', () => {
    it('starts scanner after initialization', async () => {
      render(<Scanner onScan={mockOnScan} onError={mockOnError} />);

      await waitFor(() => {
        expect(mockStart).toHaveBeenCalled();
      });
    });
  });

  describe('scanner errors', () => {
    it('calls onError when scanner fails to start with NotAllowedError', async () => {
      mockStart.mockRejectedValueOnce({ name: 'NotAllowedError' });

      render(<Scanner onScan={mockOnScan} onError={mockOnError} />);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Camera permission denied'),
          })
        );
      });
    });

    it('calls onError when no camera found', async () => {
      mockStart.mockRejectedValueOnce({ name: 'NotFoundError' });

      render(<Scanner onScan={mockOnScan} onError={mockOnError} />);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('No camera found'),
          })
        );
      });
    });

    it('calls onError when camera is in use', async () => {
      mockStart.mockRejectedValueOnce({ name: 'NotReadableError' });

      render(<Scanner onScan={mockOnScan} onError={mockOnError} />);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('already in use'),
          })
        );
      });
    });

    it('shows permission message when camera access denied', async () => {
      mockStart.mockRejectedValueOnce({ name: 'NotAllowedError' });

      render(<Scanner onScan={mockOnScan} onError={mockOnError} />);

      await waitFor(() => {
        expect(screen.getByText(/Camera access is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('cleanup', () => {
    it('stops and destroys scanner on unmount', async () => {
      const { unmount } = render(<Scanner onScan={mockOnScan} onError={mockOnError} />);

      // Wait for scanner to initialize
      await waitFor(() => {
        expect(mockStart).toHaveBeenCalled();
      });

      unmount();

      expect(mockStop).toHaveBeenCalled();
      expect(mockDestroy).toHaveBeenCalled();
    });
  });
});
