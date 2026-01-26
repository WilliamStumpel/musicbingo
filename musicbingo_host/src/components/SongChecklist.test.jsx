/**
 * Tests for SongChecklist Component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SongChecklist } from './SongChecklist';

// Mock song data
const mockSongs = [
  { song_id: 's1', title: 'Bohemian Rhapsody', artist: 'Queen' },
  { song_id: 's2', title: 'Billie Jean', artist: 'Michael Jackson' },
  { song_id: 's3', title: 'Sweet Child O Mine', artist: 'Guns N Roses' },
  { song_id: 's4', title: 'Thriller', artist: 'Michael Jackson' },
  { song_id: 's5', title: 'Another One Bites the Dust', artist: 'Queen' },
];

describe('SongChecklist', () => {
  const defaultProps = {
    songs: mockSongs,
    playedSongs: new Set(),
    onTogglePlayed: jest.fn(),
    playedCount: 0,
    totalCount: 5,
    nowPlaying: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders song list from songs prop', () => {
      render(<SongChecklist {...defaultProps} />);

      expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
      expect(screen.getByText('Billie Jean')).toBeInTheDocument();
      expect(screen.getByText('Sweet Child O Mine')).toBeInTheDocument();
    });

    it('shows song title and artist', () => {
      render(<SongChecklist {...defaultProps} />);

      expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
      // Use getAllByText since Queen appears twice in the list
      expect(screen.getAllByText('Queen').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Billie Jean')).toBeInTheDocument();
      // Michael Jackson also appears twice
      expect(screen.getAllByText('Michael Jackson').length).toBeGreaterThanOrEqual(1);
    });

    it('shows count of played vs total songs', () => {
      render(<SongChecklist {...defaultProps} playedCount={2} totalCount={5} />);

      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('/ 5 played')).toBeInTheDocument();
    });

    it('shows empty state when no songs', () => {
      render(<SongChecklist {...defaultProps} songs={[]} totalCount={0} />);

      expect(screen.getByText('Select a game to load songs')).toBeInTheDocument();
    });
  });

  describe('played song styling', () => {
    it('marks played songs with played class', () => {
      // Sorted order: s5 (Another), s2 (Billie), s1 (Bohemian), s3 (Sweet), s4 (Thriller)
      // Mark first two in sorted order as played
      const playedSongs = new Set(['s5', 's2']);
      render(
        <SongChecklist {...defaultProps} playedSongs={playedSongs} playedCount={2} />
      );

      // Find the song rows (sorted by title A-Z by default)
      const rows = document.querySelectorAll('.song-row');

      // First two songs should have 'played' class
      expect(rows[0]).toHaveClass('played'); // s5 = Another One...
      expect(rows[1]).toHaveClass('played'); // s2 = Billie Jean
      // Third song should not
      expect(rows[2]).not.toHaveClass('played'); // s1 = Bohemian Rhapsody
    });

    it('shows checkmark for played songs', () => {
      // Use s5 which is first when sorted by title A-Z
      const playedSongs = new Set(['s5']);
      render(
        <SongChecklist {...defaultProps} playedSongs={playedSongs} playedCount={1} />
      );

      const indicators = document.querySelectorAll('.played-indicator');
      expect(indicators[0].textContent).toBe('✓'); // s5 = Another One...
      expect(indicators[1].textContent).toBe('○'); // s1 = Bohemian...
    });
  });

  describe('now playing', () => {
    it('shows now playing song with music note and highlight', () => {
      // Sorted order: s5 (Another), s2 (Billie), s1 (Bohemian), s3 (Sweet), s4 (Thriller)
      // s2 = "Billie Jean" is at index 1 in sorted order
      render(<SongChecklist {...defaultProps} nowPlaying="s2" />);

      const rows = document.querySelectorAll('.song-row');
      expect(rows[1]).toHaveClass('now-playing'); // s2 = Billie Jean is second

      const indicators = document.querySelectorAll('.played-indicator');
      expect(indicators[1].textContent).toBe('♪');
    });

    it('now playing indicator has now-playing class', () => {
      // s5 = "Another One Bites the Dust" is first in title A-Z order
      render(<SongChecklist {...defaultProps} nowPlaying="s5" />);

      const indicator = document.querySelectorAll('.played-indicator')[0];
      expect(indicator).toHaveClass('now-playing');
    });
  });

  describe('interactions', () => {
    it('calls onSongClick when song clicked (if provided)', () => {
      const onSongClick = jest.fn();
      render(<SongChecklist {...defaultProps} onSongClick={onSongClick} />);

      // First row in sorted order is s5 = "Another One Bites the Dust"
      const row = document.querySelector('.song-row');
      fireEvent.click(row);

      expect(onSongClick).toHaveBeenCalledWith('s5');
    });

    it('calls onTogglePlayed when song clicked (if no onSongClick)', () => {
      render(<SongChecklist {...defaultProps} />);

      // First row in sorted order is s5 = "Another One Bites the Dust"
      const row = document.querySelector('.song-row');
      fireEvent.click(row);

      expect(defaultProps.onTogglePlayed).toHaveBeenCalledWith('s5');
    });
  });

  describe('search', () => {
    it('search input filters songs by title', () => {
      render(<SongChecklist {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search songs...');
      fireEvent.change(searchInput, { target: { value: 'bohemian' } });

      expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
      expect(screen.queryByText('Billie Jean')).not.toBeInTheDocument();
    });

    it('search input filters songs by artist', () => {
      render(<SongChecklist {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search songs...');
      fireEvent.change(searchInput, { target: { value: 'queen' } });

      expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
      expect(screen.getByText('Another One Bites the Dust')).toBeInTheDocument();
      expect(screen.queryByText('Billie Jean')).not.toBeInTheDocument();
    });

    it('search is case insensitive', () => {
      render(<SongChecklist {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search songs...');
      fireEvent.change(searchInput, { target: { value: 'MICHAEL' } });

      expect(screen.getByText('Billie Jean')).toBeInTheDocument();
      expect(screen.getByText('Thriller')).toBeInTheDocument();
      expect(screen.queryByText('Bohemian Rhapsody')).not.toBeInTheDocument();
    });

    it('empty search shows all songs', () => {
      render(<SongChecklist {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search songs...');

      // First filter
      fireEvent.change(searchInput, { target: { value: 'queen' } });
      expect(screen.queryByText('Billie Jean')).not.toBeInTheDocument();

      // Then clear
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(screen.getByText('Billie Jean')).toBeInTheDocument();
      expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
    });

    it('shows no results message when search matches nothing', () => {
      render(<SongChecklist {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search songs...');
      fireEvent.change(searchInput, { target: { value: 'xyz123' } });

      expect(screen.getByText(/No songs match/)).toBeInTheDocument();
    });

    it('clear button clears search', () => {
      render(<SongChecklist {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search songs...');
      fireEvent.change(searchInput, { target: { value: 'queen' } });

      // Clear button should appear
      const clearButton = screen.getByText('×');
      fireEvent.click(clearButton);

      expect(searchInput.value).toBe('');
      expect(screen.getByText('Billie Jean')).toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    it('sort select changes sort order', () => {
      render(<SongChecklist {...defaultProps} />);

      const sortSelect = screen.getByRole('combobox');

      // Default is Title A-Z
      let rows = document.querySelectorAll('.song-row');
      expect(rows[0]).toHaveTextContent('Another One Bites the Dust');

      // Change to Title Z-A
      fireEvent.change(sortSelect, { target: { value: 'TITLE_DESC' } });
      rows = document.querySelectorAll('.song-row');
      expect(rows[0]).toHaveTextContent('Thriller');
    });

    it('can sort by artist', () => {
      render(<SongChecklist {...defaultProps} />);

      const sortSelect = screen.getByRole('combobox');

      // Change to Artist A-Z
      fireEvent.change(sortSelect, { target: { value: 'ARTIST_ASC' } });

      const rows = document.querySelectorAll('.song-row');
      // Guns N Roses should be first alphabetically
      expect(rows[0]).toHaveTextContent('Guns N Roses');
    });

    it('has all sort options available', () => {
      render(<SongChecklist {...defaultProps} />);

      expect(screen.getByRole('option', { name: 'Title A-Z' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Title Z-A' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Artist A-Z' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Artist Z-A' })).toBeInTheDocument();
    });
  });

  describe('reveal button', () => {
    it('shows reveal button for now playing unreveled song', () => {
      const onRevealSong = jest.fn();
      render(
        <SongChecklist
          {...defaultProps}
          nowPlaying="s1"
          revealedSongs={new Set()}
          onRevealSong={onRevealSong}
        />
      );

      expect(screen.getByText('Reveal')).toBeInTheDocument();
    });

    it('calls onRevealSong when reveal button clicked', () => {
      const onRevealSong = jest.fn();
      render(
        <SongChecklist
          {...defaultProps}
          nowPlaying="s1"
          revealedSongs={new Set()}
          onRevealSong={onRevealSong}
        />
      );

      const revealButton = screen.getByText('Reveal');
      fireEvent.click(revealButton);

      expect(onRevealSong).toHaveBeenCalledWith('s1');
    });

    it('does not show reveal button for revealed songs', () => {
      render(
        <SongChecklist
          {...defaultProps}
          nowPlaying="s1"
          revealedSongs={new Set(['s1'])}
          onRevealSong={jest.fn()}
        />
      );

      expect(screen.queryByText('Reveal')).not.toBeInTheDocument();
    });

    it('shows revealed indicator for played revealed songs', () => {
      render(
        <SongChecklist
          {...defaultProps}
          playedSongs={new Set(['s1'])}
          revealedSongs={new Set(['s1'])}
          playedCount={1}
        />
      );

      expect(screen.getByText('Revealed')).toBeInTheDocument();
    });
  });
});
