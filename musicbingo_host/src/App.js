import React, { useEffect } from 'react';
import './App.css';
import { isAuthenticated } from './services/spotifyAuth';

function App() {
  useEffect(() => {
    // Log auth status on mount (for verification)
    console.log('Spotify authenticated:', isAuthenticated());
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Music Bingo Host</h1>
      </header>
      <main className="App-main">
        <p>Spotify integration coming soon...</p>
      </main>
    </div>
  );
}

export default App;
