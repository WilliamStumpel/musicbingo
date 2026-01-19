import React, { useState } from 'react';
import './HostView.css';
import { useGameState } from '../hooks/useGameState';
import { SongChecklist } from '../components/SongChecklist';
import { CallBoard } from '../components/CallBoard';
import { PatternSelector } from '../components/PatternSelector';
import { GameControls } from '../components/GameControls';
import { ConfirmModal } from '../components/ConfirmModal';

function HostView() {
  const {
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
    loadGame,
    toggleSongPlayed,
    setNowPlaying,
    setPattern,
    resetRound,
  } = useGameState();

  // State for remove song confirmation modal
  const [removeConfirm, setRemoveConfirm] = useState({ isOpen: false, songId: null, songTitle: '' });

  const handleGameChange = (e) => {
    const filename = e.target.value;
    if (filename) {
      loadGame(filename);
      // Store game_id in localStorage for player view to read
      localStorage.setItem('musicbingo_current_game', filename);
    }
  };

  // When clicking a song in the checklist:
  // - If not played: set as now playing (which also marks it played)
  // - If already played: show confirmation modal to unmark
  const handleSongClick = (songId) => {
    if (playedSongs.has(songId)) {
      // Already played - show confirmation modal
      const song = songs.find(s => s.song_id === songId);
      setRemoveConfirm({
        isOpen: true,
        songId,
        songTitle: song?.title || 'this song'
      });
    } else {
      // Not played - set as now playing (which marks it played)
      setNowPlaying(songId);
    }
  };

  const handleConfirmRemove = () => {
    const { songId } = removeConfirm;
    toggleSongPlayed(songId);
    // Clear now playing if this was the now-playing song
    if (nowPlaying === songId) {
      setNowPlaying(null);
    }
    setRemoveConfirm({ isOpen: false, songId: null, songTitle: '' });
  };

  const handleCancelRemove = () => {
    setRemoveConfirm({ isOpen: false, songId: null, songTitle: '' });
  };

  const handleOpenPlayerView = () => {
    // Store current game_id in localStorage for player view
    if (currentGame) {
      localStorage.setItem('musicbingo_current_game', currentGame.filename || games.find(g => g.name === currentGame.name)?.filename);
      localStorage.setItem('musicbingo_game_id', currentGame.game_id);
    }
    window.open('/player', 'player-view', 'width=1920,height=1080');
  };

  return (
    <div className="host-view">
      <header className="host-header">
        <div className="header-left">
          <h1>Music Bingo Host</h1>
        </div>

        <div className="header-controls">
          <div className="game-selector">
            <select
              onChange={handleGameChange}
              value={currentGame?.name || ''}
              disabled={isLoading}
            >
              <option value="">Select a game...</option>
              {games.map(game => (
                <option key={game.filename} value={game.filename}>{game.name}</option>
              ))}
            </select>
          </div>

          {currentGame && (
            <>
              <PatternSelector
                currentPattern={currentPattern}
                onPatternChange={setPattern}
                disabled={isLoading}
              />
              <GameControls
                onReset={resetRound}
                playedCount={playedCount}
                disabled={isLoading || !currentGame}
              />
              <button
                className="player-view-button"
                onClick={handleOpenPlayerView}
                disabled={!currentGame}
                title="Open Player View in new window"
              >
                Player View
              </button>
            </>
          )}
        </div>
      </header>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="loading">Loading...</div>
      )}

      <main className="host-main">
        <div className="main-grid">
          {/* Left column: Call Board */}
          <div className="call-board-column">
            <CallBoard
              songs={songs}
              playedSongs={playedSongs}
              playedOrder={playedOrder}
              nowPlaying={nowPlaying}
            />
          </div>

          {/* Right column: Song Checklist */}
          <div className="checklist-column">
            <SongChecklist
              songs={songs}
              playedSongs={playedSongs}
              onTogglePlayed={toggleSongPlayed}
              playedCount={playedCount}
              totalCount={totalCount}
              nowPlaying={nowPlaying}
              onSongClick={handleSongClick}
            />
          </div>
        </div>
      </main>

      <footer className="host-footer">
        <p>
          Play music in Spotify with shuffle on.
          Click songs to mark as "now playing".
        </p>
      </footer>

      <ConfirmModal
        isOpen={removeConfirm.isOpen}
        title="Remove Song"
        message={`Remove "${removeConfirm.songTitle}" from played songs?`}
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
      />
    </div>
  );
}

export default HostView;
