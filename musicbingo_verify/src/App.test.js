/**
 * Tests for App Component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from './App';
import * as config from './config';
import { ApiClient } from './services/apiClient';

// Mock qr-scanner library to avoid camera access in tests
jest.mock('qr-scanner', () => {
  const MockQrScanner = function(videoElement, onScan, options) {
    this.start = jest.fn().mockResolvedValue(undefined);
    this.stop = jest.fn();
    this.destroy = jest.fn();
  };
  return MockQrScanner;
});

// Mock the hooks
jest.mock('./hooks/useScanner', () => ({
  useScanner: () => ({
    result: null,
    error: null,
    isProcessing: false,
    handleScan: jest.fn(),
    reset: jest.fn(),
  }),
}));

jest.mock('./hooks/useGameState', () => ({
  useGameState: () => ({
    games: [],
    currentGame: null,
    songs: [],
    playedSongs: new Set(),
    isLoading: false,
    error: null,
    loadGame: jest.fn(),
    toggleSongPlayed: jest.fn(),
    playedCount: 0,
    totalCount: 0,
  }),
}));

// Mock config
jest.mock('./config');
jest.mock('./services/apiClient');

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('connected state', () => {
    beforeEach(() => {
      // Setup for connected state
      config.hasStoredUrl.mockReturnValue(true);
      config.getApiUrl.mockReturnValue('http://localhost:8000');
      config.setApiUrl.mockImplementation(() => {});
      ApiClient.mockImplementation(() => ({
        healthCheck: jest.fn().mockResolvedValue(true),
      }));
    });

    it('renders app title after connection', async () => {
      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Music Bingo Verification/i)).toBeInTheDocument();
      });
    });

    it('renders scan instruction after connection', async () => {
      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Scan QR code/i)).toBeInTheDocument();
      });
    });

    it('displays version indicator', async () => {
      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText(/v0\.3\.1/)).toBeInTheDocument();
      });
    });
  });

  describe('tab navigation', () => {
    beforeEach(() => {
      config.hasStoredUrl.mockReturnValue(true);
      config.getApiUrl.mockReturnValue('http://localhost:8000');
      config.setApiUrl.mockImplementation(() => {});
      ApiClient.mockImplementation(() => ({
        healthCheck: jest.fn().mockResolvedValue(true),
      }));
    });

    it('renders Scan and Songs tabs', async () => {
      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        // Tab bar contains Scan and Songs tabs
        const tabBar = screen.getByRole('button', { name: /Scan/i });
        expect(tabBar).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Songs/i })).toBeInTheDocument();
      });
    });

    it('switches to Songs tab when clicked', async () => {
      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Music Bingo Verification/i)).toBeInTheDocument();
      });

      const songsTab = screen.getByRole('button', { name: /Songs/i });
      await act(async () => {
        fireEvent.click(songsTab);
      });

      // After clicking Songs tab, song checklist appears with search box
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search songs/i)).toBeInTheDocument();
      });
    });

    it('switches back to scan tab when clicked', async () => {
      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Music Bingo Verification/i)).toBeInTheDocument();
      });

      // Switch to Songs tab
      const songsTab = screen.getByRole('button', { name: /Songs/i });
      await act(async () => {
        fireEvent.click(songsTab);
      });

      // Verify we switched to Songs tab (checklist container visible)
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search songs/i)).toBeInTheDocument();
      });

      // Switch back to Scan tab
      const scanTab = screen.getByRole('button', { name: /Scan/i });
      await act(async () => {
        fireEvent.click(scanTab);
      });

      await waitFor(() => {
        expect(screen.getByText(/Music Bingo Verification/i)).toBeInTheDocument();
      });
    });
  });

  describe('not connected state', () => {
    beforeEach(() => {
      config.hasStoredUrl.mockReturnValue(false);
      config.getApiUrl.mockReturnValue('http://localhost:8000');
      config.setApiUrl.mockImplementation(() => {});
      ApiClient.mockImplementation(() => ({
        healthCheck: jest.fn().mockResolvedValue(false),
      }));
    });

    it('shows server connect screen when not connected', async () => {
      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Connect to Music Bingo Server/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
});
