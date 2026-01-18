import { useState, useEffect, useCallback, useRef } from 'react';
import * as gameApi from '../services/gameApi';

const POLL_INTERVAL = 2000; // 2 seconds

export function useGameState() {
  const [games, setGames] = useState([]);
  const [currentGame, setCurrentGame] = useState(null);
  const [songs, setSongs] = useState([]);
  const [playedSongs, setPlayedSongs] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const pollRef = useRef(null);
  const gameIdRef = useRef(null);

  // Load available games
  const loadGames = useCallback(async () => {
    try {
      const gameList = await gameApi.getGames();
      setGames(gameList);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  // Load a specific game
  const loadGame = useCallback(async (filename) => {
    setIsLoading(true);
    setError(null);

    try {
      const game = await gameApi.loadGame(filename);
      setCurrentGame(game);
      setSongs(game.songs || []);
      gameIdRef.current = game.game_id;

      // Get initial state
      const state = await gameApi.getGameState(game.game_id);
      setPlayedSongs(new Set(state.played_songs || []));
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle song played status
  const toggleSongPlayed = useCallback(async (songId) => {
    const gameId = gameIdRef.current;
    if (!gameId) return;

    const isPlayed = playedSongs.has(songId);
    const newPlayed = !isPlayed;

    // Optimistic update
    setPlayedSongs(prev => {
      const next = new Set(prev);
      if (newPlayed) {
        next.add(songId);
      } else {
        next.delete(songId);
      }
      return next;
    });

    // Sync to API
    try {
      await gameApi.markSongPlayed(gameId, songId, newPlayed);
    } catch (e) {
      // Revert on error
      setPlayedSongs(prev => {
        const next = new Set(prev);
        if (newPlayed) {
          next.delete(songId);
        } else {
          next.add(songId);
        }
        return next;
      });
      setError(e.message);
    }
  }, [playedSongs]);

  // Start polling for updates
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

  // Load games on mount
  useEffect(() => {
    loadGames();
  }, [loadGames]);

  // Stats
  const playedCount = playedSongs.size;
  const totalCount = songs.length;

  return {
    // State
    games,
    currentGame,
    songs,
    playedSongs,
    playedCount,
    totalCount,
    isLoading,
    error,

    // Actions
    loadGame,
    toggleSongPlayed,
    refreshGames: loadGames,
  };
}
