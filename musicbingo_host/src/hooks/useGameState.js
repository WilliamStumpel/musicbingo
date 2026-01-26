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

  // Winner detection state
  const [detectedWinners, setDetectedWinners] = useState([]); // All detected winners from API
  const [newWinners, setNewWinners] = useState([]); // Newly detected winners to show in toast
  const [currentPrize, setCurrentPrizeState] = useState(null); // Current prize text

  const pollRef = useRef(null);
  const gameIdRef = useRef(null);
  const revealTimerRef = useRef(null); // Timer for auto-reveal
  const prevWinnerIdsRef = useRef(new Set()); // Track previously detected winner card_ids

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
      const pattern = state.current_pattern || 'five_in_a_row';
      setCurrentPatternState(pattern);
      localStorage.setItem('musicbingo_current_pattern', pattern); // Sync to player view
      setNowPlayingState(null); // Reset now playing when loading new game

      // Initialize winner detection state
      const prize = state.current_prize || null;
      setCurrentPrizeState(prize);
      if (prize) {
        localStorage.setItem('musicbingo_current_prize', prize);
      } else {
        localStorage.removeItem('musicbingo_current_prize');
      }
      setDetectedWinners(state.detected_winners || []);
      setNewWinners([]); // Clear new winners toast
      prevWinnerIdsRef.current = new Set((state.detected_winners || []).map(w => w.card_id));
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
    const previousDetectedWinners = detectedWinners;
    const previousNewWinners = newWinners;

    // Optimistic update - clear all play state
    setPlayedSongs(new Set());
    setPlayedOrder([]);
    setNowPlayingState(null);
    setRevealedSongs(new Set());
    setDetectedWinners([]); // Clear detected winners for new round
    setNewWinners([]); // Clear new winners toast
    prevWinnerIdsRef.current = new Set(); // Reset winner tracking
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
      setDetectedWinners(previousDetectedWinners);
      setNewWinners(previousNewWinners);
      prevWinnerIdsRef.current = new Set(previousDetectedWinners.map(w => w.card_id));
      setError(e.message);
    }
  }, [playedSongs, playedOrder, nowPlaying, revealedSongs, detectedWinners, newWinners]);

  // Dismiss a winner from the toast (removes from newWinners, keeps in detectedWinners)
  const dismissWinner = useCallback((cardId) => {
    setNewWinners(prev => prev.filter(w => w.card_id !== cardId));
  }, []);

  // Set the prize for the current game
  const setPrize = useCallback(async (prize) => {
    const gameId = gameIdRef.current;
    if (!gameId) return;

    // Optimistic update
    const previousPrize = currentPrize;
    setCurrentPrizeState(prize);

    // Sync prize to localStorage for player view
    localStorage.setItem('musicbingo_current_prize', prize);

    try {
      await gameApi.setPrize(gameId, prize);
    } catch (e) {
      // Revert on error
      setCurrentPrizeState(previousPrize);
      if (previousPrize) {
        localStorage.setItem('musicbingo_current_prize', previousPrize);
      } else {
        localStorage.removeItem('musicbingo_current_prize');
      }
      setError(e.message);
    }
  }, [currentPrize]);

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

          // Check for new winners
          if (state.detected_winners) {
            setDetectedWinners(state.detected_winners);

            // Find truly new winners (not in previous set)
            const newlyDetected = state.detected_winners.filter(
              w => !prevWinnerIdsRef.current.has(w.card_id)
            );

            // Add new winners to toast list
            if (newlyDetected.length > 0) {
              setNewWinners(prev => [...prev, ...newlyDetected]);
              // Update the ref with all current winner IDs
              prevWinnerIdsRef.current = new Set(state.detected_winners.map(w => w.card_id));
            }
          }

          // Update prize if changed
          if (state.current_prize !== undefined) {
            setCurrentPrizeState(state.current_prize);
            if (state.current_prize) {
              localStorage.setItem('musicbingo_current_prize', state.current_prize);
            }
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

    // Winner detection state
    detectedWinners,
    newWinners,
    currentPrize,

    // Actions
    loadGame,
    toggleSongPlayed,
    setNowPlaying,
    revealSong,
    setPattern,
    resetRound,
    refreshGames: loadGames,

    // Winner detection actions
    dismissWinner,
    setPrize,
  };
}
