import React, { useState, useEffect, useCallback, useRef } from 'react';
import './PlayerView.css';
import * as gameApi from '../services/gameApi';

const POLL_INTERVAL = 2000; // 2 seconds

function PlayerView() {
  const [currentGame, setCurrentGame] = useState(null);
  const [songs, setSongs] = useState([]);
  const [playedSongs, setPlayedSongs] = useState(new Set());
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

  // Listen for storage changes (if host changes game)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'musicbingo_current_game') {
        loadGameFromStorage();
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
        {/* Call board area - placeholder for now, will be implemented in 05-02 */}
        <div className="player-call-board">
          <p className="placeholder-text">Call Board Coming Soon</p>
        </div>
      </main>

      <footer className="player-footer">
        {/* Pattern display area - placeholder */}
        <div className="player-pattern">
          Pattern display coming soon
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
