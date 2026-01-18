import React from 'react';
import './App.css';
import { useGameState } from './hooks/useGameState';
import { SongChecklist } from './components/SongChecklist';

function App() {
  const {
    games,
    currentGame,
    songs,
    playedSongs,
    playedCount,
    totalCount,
    isLoading,
    error,
    loadGame,
    toggleSongPlayed,
  } = useGameState();

  const handleGameChange = (e) => {
    const filename = e.target.value;
    if (filename) {
      loadGame(filename);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Music Bingo Host</h1>

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
        <SongChecklist
          songs={songs}
          playedSongs={playedSongs}
          onTogglePlayed={toggleSongPlayed}
          playedCount={playedCount}
          totalCount={totalCount}
        />
      </main>

      <footer className="app-footer">
        <p>
          Play music in Spotify with shuffle on.
          Mark songs here as they play.
        </p>
      </footer>
    </div>
  );
}

export default App;
