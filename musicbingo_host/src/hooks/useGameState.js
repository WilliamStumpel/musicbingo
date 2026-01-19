import { useState, useEffect, useCallback, useRef } from 'react';
import * as gameApi from '../services/gameApi';

const POLL_INTERVAL = 2000; // 2 seconds

export function useGameState() {
  const [games, setGames] = useState([]);
  const [currentGame, setCurrentGame] = useState(null);
  const [songs, setSongs] = useState([]);
  const [playedSongs, setPlayedSongs] = useState(new Set());
  const [playedOrder, setPlayedOrder] = useState([]); // Array of song_ids in order played
  const [nowPlaying, setNowPlayingState] = useState(null); // song_id of currently playing song
  const [currentPattern, setCurrentPatternState] = useState('five_in_a_row');
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
      const playedSongIds = state.played_songs || [];
      setPlayedSongs(new Set(playedSongIds));
      setPlayedOrder(playedSongIds); // Initialize playedOrder from state
      setCurrentPatternState(state.current_pattern || 'five_in_a_row');
      setNowPlayingState(null); // Reset now playing when loading new game
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

    // Optimistic update for playedSongs
    setPlayedSongs(prev => {
      const next = new Set(prev);
      if (newPlayed) {
        next.add(songId);
      } else {
        next.delete(songId);
      }
      return next;
    });

    // Optimistic update for playedOrder
    setPlayedOrder(prev => {
      if (newPlayed) {
        // Only add if not already in the list
        if (!prev.includes(songId)) {
          return [...prev, songId];
        }
        return prev;
      } else {
        // Remove from the list
        return prev.filter(id => id !== songId);
      }
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
      setPlayedOrder(prev => {
        if (newPlayed) {
          return prev.filter(id => id !== songId);
        } else {
          return [...prev, songId];
        }
      });
      setError(e.message);
    }
  }, [playedSongs]);

  // Set a song as "now playing" (and mark as played if not already)
  const setNowPlaying = useCallback(async (songId) => {
    const gameId = gameIdRef.current;
    if (!gameId) return;

    setNowPlayingState(songId);

    // If song is not already played, mark it as played
    if (songId && !playedSongs.has(songId)) {
      await toggleSongPlayed(songId);
    }
  }, [playedSongs, toggleSongPlayed]);

  // Set the winning pattern
  const setPattern = useCallback(async (pattern) => {
    const gameId = gameIdRef.current;
    if (!gameId) return;

    // Optimistic update
    const previousPattern = currentPattern;
    setCurrentPatternState(pattern);

    try {
      await gameApi.setPattern(gameId, pattern);
    } catch (e) {
      // Revert on error
      setCurrentPatternState(previousPattern);
      setError(e.message);
    }
  }, [currentPattern]);

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
    playedOrder,
    nowPlaying,
    currentPattern,
    playedCount,
    totalCount,
    isLoading,
    error,

    // Actions
    loadGame,
    toggleSongPlayed,
    setNowPlaying,
    setPattern,
    refreshGames: loadGames,
  };
}
