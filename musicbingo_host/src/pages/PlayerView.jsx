import React, { useState, useEffect, useCallback, useRef } from 'react';
import './PlayerView.css';
import * as gameApi from '../services/gameApi';
import { PlayerCallBoard } from '../components/PlayerCallBoard';
import { PatternDisplay } from '../components/PatternDisplay';

const POLL_INTERVAL = 2000; // 2 seconds

function PlayerView() {
  const [currentGame, setCurrentGame] = useState(null);
  const [songs, setSongs] = useState([]);
  const [playedSongs, setPlayedSongs] = useState(new Set());
  const [playedOrder, setPlayedOrder] = useState([]); // Array of song_ids in play order
  const [nowPlaying, setNowPlaying] = useState(null); // song_id of currently playing song
  const [currentPattern, setCurrentPattern] = useState('five_in_a_row'); // Current winning pattern
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const pollRef = useRef(null);
  const gameIdRef = useRef(null);

  // Load game from localStorage (set by host view)
  const loadGameFromStorage = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filename = localStorage.getItem('musicbingo_current_game');
      if (!filename) {
        setIsLoading(false);
        return;
      }

      const game = await gameApi.loadGame(filename);
      setCurrentGame(game);
      setSongs(game.songs || []);
      gameIdRef.current = game.game_id;

      // Get initial state
      const state = await gameApi.getGameState(game.game_id);
      const playedSongIds = state.played_songs || [];
      setPlayedSongs(new Set(playedSongIds));
      setPlayedOrder(playedSongIds); // played_songs is already ordered

      // Get now playing from localStorage
      const storedNowPlaying = localStorage.getItem('musicbingo_now_playing');
      setNowPlaying(storedNowPlaying || null);

      // Get pattern from localStorage, fallback to game state
      const storedPattern = localStorage.getItem('musicbingo_current_pattern');
      setCurrentPattern(storedPattern || state.current_pattern || 'five_in_a_row');
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Poll for updates
  useEffect(() => {
    if (!gameIdRef.current) return;

    const poll = async () => {
      const played = await gameApi.pollGameState(gameIdRef.current);
      if (played !== null) {
        setPlayedSongs(new Set(played));
        setPlayedOrder(played); // Update playedOrder from API
      }
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [currentGame]);

  // Load game on mount
  useEffect(() => {
    loadGameFromStorage();
  }, [loadGameFromStorage]);

  // Listen for storage changes (game change, now playing, or pattern change)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'musicbingo_current_game') {
        loadGameFromStorage();
      } else if (e.key === 'musicbingo_now_playing') {
        setNowPlaying(e.newValue || null);
      } else if (e.key === 'musicbingo_current_pattern') {
        setCurrentPattern(e.newValue || 'five_in_a_row');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadGameFromStorage]);

  if (isLoading) {
    return (
      <div className="player-view">
        <div className="player-loading">Loading...</div>
      </div>
    );
  }

  if (!currentGame) {
    return (
      <div className="player-view">
        <div className="player-no-game">
          <h2>No Game Loaded</h2>
          <p>Open a game from the Host View to display it here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="player-view">
      <header className="player-header">
        <h1>{currentGame.name || 'Music Bingo'}</h1>
        <div className="player-stats">
          {playedSongs.size} / {songs.length} songs played
        </div>
      </header>

      <main className="player-main">
        <PlayerCallBoard
          songs={songs}
          playedSongs={playedSongs}
          playedOrder={playedOrder}
          nowPlaying={nowPlaying}
        />
      </main>

      <footer className="player-footer">
        <div className="player-pattern">
          <span className="pattern-title">Current Pattern:</span>
          <PatternDisplay pattern={currentPattern} size="large" />
        </div>
      </footer>

      {error && (
        <div className="player-error">
          {error}
        </div>
      )}
    </div>
  );
}

export default PlayerView;
