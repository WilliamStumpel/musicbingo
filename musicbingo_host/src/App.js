import React from 'react';
import './App.css';
import { useSpotifyAuth } from './hooks/useSpotifyAuth';
import SpotifyLogin from './components/SpotifyLogin';

function App() {
  const { isAuthenticated, isLoading, error, user, login, logout } = useSpotifyAuth();

  return (
    <div className="App">
      <header className="App-header">
        <h1>Music Bingo Host</h1>
      </header>
      <main className="App-main">
        <SpotifyLogin
          isAuthenticated={isAuthenticated}
          isLoading={isLoading}
          error={error}
          user={user}
          onLogin={login}
          onLogout={logout}
        />
        {isAuthenticated && (
          <div className="ready-message">
            <p>Ready to play music!</p>
            <p className="hint">Playback controls coming in next update...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
