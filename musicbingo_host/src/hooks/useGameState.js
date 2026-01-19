import { useState, useEffect, useCallback, useRef } from 'react';
import * as gameApi from '../services/gameApi';

const POLL_INTERVAL = 2000; // 2 seconds
const REVEAL_DELAY = 15000; // 15 seconds before auto-reveal

export function useGameState() {
  const [games, setGames] = useState([]);
  const [currentGame, setCurrentGame] = useState(null);
  const [songs, setSongs] = useState([]);
  const [playedSongs, setPlayedSongs] = useState(new Set());
  const [playedOrder, setPlayedOrder] = useState([]); // Array of song_ids in order played
  const [nowPlaying, setNowPlayingState] = useState(null); // song_id of currently playing song
  const [revealedSongs, setRevealedSongs] = useState(new Set()); // Songs with titles revealed
  const [currentPattern, setCurrentPatternState] = useState('five_in_a_row');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const pollRef = useRef(null);
  const gameIdRef = useRef(null);
  const revealTimerRef = useRef(null); // Timer for auto-reveal

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
      const revealedSongIds = state.revealed_songs || [];
      setPlayedSongs(new Set(playedSongIds));
      setPlayedOrder(playedSongIds); // Initialize playedOrder from state
      setRevealedSongs(new Set(revealedSongIds)); // Initialize revealedSongs from state
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

    // Clear any existing reveal timer
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }

    setNowPlayingState(songId);

    // Sync nowPlaying to localStorage for player view
    if (songId) {
      localStorage.setItem('musicbingo_now_playing', songId);

      // Start auto-reveal timer if song is not already revealed
      if (!revealedSongs.has(songId)) {
        revealTimerRef.current = setTimeout(async () => {
          await gameApi.revealSong(gameId, songId);
          setRevealedSongs(prev => {
            const next = new Set(prev);
            next.add(songId);
            localStorage.setItem('musicbingo_revealed_songs', JSON.stringify([...next]));
            return next;
          });
        }, REVEAL_DELAY);
      }
    } else {
      localStorage.removeItem('musicbingo_now_playing');
    }

    // If song is not already played, mark it as played
    if (songId && !playedSongs.has(songId)) {
      await toggleSongPlayed(songId);
    }
  }, [playedSongs, revealedSongs, toggleSongPlayed]);

  // Set the winning pattern
  const setPattern = useCallback(async (pattern) => {
    const gameId = gameIdRef.current;
    if (!gameId) return;

    // Optimistic update
    const previousPattern = currentPattern;
    setCurrentPatternState(pattern);

    // Sync pattern to localStorage for player view
    localStorage.setItem('musicbingo_current_pattern', pattern);

    try {
      await gameApi.setPattern(gameId, pattern);
    } catch (e) {
      // Revert on error
      setCurrentPatternState(previousPattern);
      localStorage.setItem('musicbingo_current_pattern', previousPattern);
      setError(e.message);
    }
  }, [currentPattern]);

  // Reveal a song (call API and update local state)
  const revealSong = useCallback(async (songId) => {
    const gameId = gameIdRef.current;
    if (!gameId || !songId) return;

    // Optimistic update
    setRevealedSongs(prev => {
      const next = new Set(prev);
      next.add(songId);
      return next;
    });

    // Sync revealed songs to localStorage for player view
    setRevealedSongs(prev => {
      localStorage.setItem('musicbingo_revealed_songs', JSON.stringify([...prev, songId]));
      return prev;
    });

    try {
      await gameApi.revealSong(gameId, songId);
    } catch (e) {
      // Revert on error
      setRevealedSongs(prev => {
        const next = new Set(prev);
        next.delete(songId);
        return next;
      });
      setError(e.message);
    }
  }, []);

  // Reset round - clear all played songs
  const resetRound = useCallback(async () => {
    const gameId = gameIdRef.current;
    if (!gameId) return;

    // Clear reveal timer if running
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }

    // Store previous state for rollback
    const previousPlayedSongs = playedSongs;
    const previousPlayedOrder = playedOrder;
    const previousNowPlaying = nowPlaying;
    const previousRevealedSongs = revealedSongs;

    // Optimistic update - clear all play state
    setPlayedSongs(new Set());
    setPlayedOrder([]);
    setNowPlayingState(null);
    setRevealedSongs(new Set());
    localStorage.removeItem('musicbingo_now_playing'); // Clear nowPlaying for player view
    localStorage.removeItem('musicbingo_revealed_songs'); // Clear revealedSongs for player view

    try {
      await gameApi.resetRound(gameId);
    } catch (e) {
      // Revert on error
      setPlayedSongs(previousPlayedSongs);
      setPlayedOrder(previousPlayedOrder);
      setNowPlayingState(previousNowPlaying);
      setRevealedSongs(previousRevealedSongs);
      setError(e.message);
    }
  }, [playedSongs, playedOrder, nowPlaying, revealedSongs]);

  // Start polling for updates
  useEffect(() => {
    if (!gameIdRef.current) return;

    const poll = async () => {
      try {
        const state = await gameApi.getGameState(gameIdRef.current);
        if (state) {
          if (state.played_songs) {
            setPlayedSongs(new Set(state.played_songs));
          }
          if (state.revealed_songs) {
            setRevealedSongs(new Set(state.revealed_songs));
            localStorage.setItem('musicbingo_revealed_songs', JSON.stringify(state.revealed_songs));
          }
        }
      } catch (e) {
        console.error('Poll failed:', e);
      }
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [currentGame]);

  // Cleanup reveal timer on unmount
  useEffect(() => {
    return () => {
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
      }
    };
  }, []);

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
    revealedSongs,
    currentPattern,
    playedCount,
    totalCount,
    isLoading,
    error,

    // Actions
    loadGame,
    toggleSongPlayed,
    setNowPlaying,
    revealSong,
    setPattern,
    resetRound,
    refreshGames: loadGames,
  };
}
