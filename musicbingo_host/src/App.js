import React from 'react';
import './App.css';
import { useGameState } from './hooks/useGameState';
import { SongChecklist } from './components/SongChecklist';
import { CallBoard } from './components/CallBoard';
import { PatternSelector } from './components/PatternSelector';
import { GameControls } from './components/GameControls';

function App() {
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

  const handleGameChange = (e) => {
    const filename = e.target.value;
    if (filename) {
      loadGame(filename);
    }
  };

  // When clicking a song in the checklist, set it as now playing (which also marks it played)
  const handleSongClick = (songId) => {
    setNowPlaying(songId);
  };

  return (
    <div className="app">
      <header className="app-header">
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

      <main className="app-main">
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

      <footer className="app-footer">
        <p>
          Play music in Spotify with shuffle on.
          Click songs to mark as "now playing".
        </p>
      </footer>
    </div>
  );
}

export default App;
