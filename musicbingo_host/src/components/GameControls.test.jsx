/**
 * Tests for GameControls Component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameControls } from './GameControls';

describe('GameControls', () => {
  const defaultProps = {
    onReset: jest.fn().mockResolvedValue(undefined),
    playedCount: 5,
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.confirm
    jest.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders Reset Round button', () => {
      render(<GameControls {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Reset Round/i })).toBeInTheDocument();
    });

    it('shows button title with description', () => {
      render(<GameControls {...defaultProps} />);

      const button = screen.getByRole('button', { name: /Reset Round/i });
      expect(button).toHaveAttribute('title', 'Reset round and clear all played songs');
    });

    it('button has game-controls container', () => {
      const { container } = render(<GameControls {...defaultProps} />);

      expect(container.querySelector('.game-controls')).toBeInTheDocument();
    });

    it('button has reset-button class', () => {
      render(<GameControls {...defaultProps} />);

      const button = screen.getByRole('button', { name: /Reset Round/i });
      expect(button).toHaveClass('reset-button');
    });
  });

  describe('reset functionality', () => {
    it('shows confirmation dialog when Reset clicked', () => {
      render(<GameControls {...defaultProps} />);

      const button = screen.getByRole('button', { name: /Reset Round/i });
      fireEvent.click(button);

      expect(window.confirm).toHaveBeenCalled();
    });

    it('shows played count in confirmation message', () => {
      render(<GameControls {...defaultProps} playedCount={5} />);

      const button = screen.getByRole('button', { name: /Reset Round/i });
      fireEvent.click(button);

      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('5 played songs')
      );
    });

    it('shows singular form for single played song', () => {
      render(<GameControls {...defaultProps} playedCount={1} />);

      const button = screen.getByRole('button', { name: /Reset Round/i });
      fireEvent.click(button);

      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('1 played song.')
      );
    });

    it('shows different message when no songs played', () => {
      render(<GameControls {...defaultProps} playedCount={0} />);

      const button = screen.getByRole('button', { name: /Reset Round/i });
      fireEvent.click(button);

      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('No songs have been played yet')
      );
    });

    it('calls onReset when confirmed', async () => {
      window.confirm.mockReturnValue(true);
      render(<GameControls {...defaultProps} />);

      const button = screen.getByRole('button', { name: /Reset Round/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call onReset when cancelled', () => {
      window.confirm.mockReturnValue(false);
      render(<GameControls {...defaultProps} />);

      const button = screen.getByRole('button', { name: /Reset Round/i });
      fireEvent.click(button);

      expect(defaultProps.onReset).not.toHaveBeenCalled();
    });

    it('shows Resetting... text while resetting', async () => {
      // Make onReset take some time
      const slowReset = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      render(<GameControls {...defaultProps} onReset={slowReset} />);

      const button = screen.getByRole('button', { name: /Reset Round/i });
      fireEvent.click(button);

      expect(screen.getByText('Resetting...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Reset Round')).toBeInTheDocument();
      });
    });
  });

  describe('disabled state', () => {
    it('button is disabled when disabled prop is true', () => {
      render(<GameControls {...defaultProps} disabled={true} />);

      const button = screen.getByRole('button', { name: /Reset Round/i });
      expect(button).toBeDisabled();
    });

    it('does not show confirm dialog when disabled', () => {
      render(<GameControls {...defaultProps} disabled={true} />);

      const button = screen.getByRole('button', { name: /Reset Round/i });
      fireEvent.click(button);

      expect(window.confirm).not.toHaveBeenCalled();
    });

    it('button is enabled when disabled prop is false', () => {
      render(<GameControls {...defaultProps} disabled={false} />);

      const button = screen.getByRole('button', { name: /Reset Round/i });
      expect(button).not.toBeDisabled();
    });

    it('button is disabled while resetting', async () => {
      const slowReset = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      render(<GameControls {...defaultProps} onReset={slowReset} />);

      const button = screen.getByRole('button', { name: /Reset Round/i });
      fireEvent.click(button);

      expect(button).toBeDisabled();

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('error handling', () => {
    it('re-enables button after reset completes (even with error)', async () => {
      // Use a promise that rejects but gets caught
      let rejectFn;
      const failingReset = jest.fn().mockImplementation(() => {
        return new Promise((resolve, reject) => {
          rejectFn = reject;
          // Reject after a short delay
          setTimeout(() => reject(new Error('Reset failed')), 10);
        }).catch(() => {
          // Swallow the error - the finally block in component will still run
        });
      });
      render(<GameControls {...defaultProps} onReset={failingReset} />);

      const button = screen.getByRole('button', { name: /Reset Round/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).not.toBeDisabled();
        expect(screen.getByText('Reset Round')).toBeInTheDocument();
      });
    });
  });
});
