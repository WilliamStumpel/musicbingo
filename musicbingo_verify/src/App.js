/**
 * Main App Component
 * Music Bingo QR Code Verification Scanner with Song Checklist
 */

import React, { useState, useEffect, useCallback } from 'react';
import Scanner from './components/Scanner';
import ResultDisplay from './components/ResultDisplay';
import ErrorMessage from './components/ErrorMessage';
import ServerConnect from './components/ServerConnect';
import { SongChecklist } from './components/SongChecklist';
import { TabBar } from './components/TabBar';
import { useScanner } from './hooks/useScanner';
import { useGameState } from './hooks/useGameState';
import { ApiClient } from './services/apiClient';
import { getApiUrl, setApiUrl, hasStoredUrl } from './config';
import './App.css';

function App() {
  const { result, error, isProcessing, handleScan, reset } = useScanner();
  const gameState = useGameState();
  const [serverUrl, setServerUrl] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [activeTab, setActiveTab] = useState('scan');

  // Check connection on mount
  useEffect(() => {
    async function checkConnection() {
      if (hasStoredUrl()) {
        const url = getApiUrl();
        const client = new ApiClient(url);
        const healthy = await client.healthCheck();
        if (healthy) {
          setServerUrl(url);
          setIsConnected(true);
        }
      }
      setIsCheckingConnection(false);
    }
    checkConnection();
  }, []);

  // Handle successful connection
  const handleConnect = useCallback((url) => {
    setApiUrl(url);
    setServerUrl(url);
    setIsConnected(true);
  }, []);

  // Handle game selection
  const handleGameChange = (e) => {
    const filename = e.target.value;
    if (filename) {
      gameState.loadGame(filename);
    }
  };

  // Show loading while checking initial connection
  if (isCheckingConnection) {
    return (
      <div className="app">
        <div className="processing-overlay" style={{ background: '#1a1a2e' }}>
          <div className="processing-content">
            <div className="spinner" />
            <p>Checking connection...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show server connect screen if not connected
  if (!isConnected) {
    return (
      <div className="app">
        <ServerConnect onConnect={handleConnect} />
      </div>
    );
  }

  return (
    <div className="app with-tabs">
      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'scan' && (
          <>
            {/* Header */}
            {!result && !error && (
              <header className="app-header">
                <h1>Music Bingo Verification</h1>
                <p>Scan QR code to check if you're a winner!</p>
              </header>
            )}

            {/* Scanner View */}
            {!result && !error && !isProcessing && (
              <Scanner
                onScan={handleScan}
                onError={(err) => {
                  console.error('Scanner error:', err);
                }}
              />
            )}

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="processing-overlay">
                <div className="processing-content">
                  <div className="spinner" />
                  <p>Verifying...</p>
                </div>
              </div>
            )}

            {/* Result Display */}
            {result && (
              <ResultDisplay
                result={result}
                onClose={reset}
              />
            )}

            {/* Error Display */}
            {error && (
              <ErrorMessage
                message={error}
                onClose={reset}
              />
            )}
          </>
        )}

        {activeTab === 'checklist' && (
          <div className="checklist-container">
            {/* Game Selector Header */}
            <div className="checklist-header-bar">
              <select
                onChange={handleGameChange}
                value={gameState.currentGame?.name || ''}
                disabled={gameState.isLoading}
                className="game-select"
              >
                <option value="">Select a game...</option>
                {gameState.games.map(game => (
                  <option key={game.filename} value={game.filename}>
                    {game.name || game.filename}
                  </option>
                ))}
              </select>
            </div>

            {/* Loading State */}
            {gameState.isLoading && (
              <div className="loading-state">
                <div className="spinner" />
                <p>Loading game...</p>
              </div>
            )}

            {/* Error State */}
            {gameState.error && (
              <div className="error-state">
                {gameState.error}
              </div>
            )}

            {/* Song Checklist */}
            {!gameState.isLoading && (
              <SongChecklist
                songs={gameState.songs}
                playedSongs={gameState.playedSongs}
                onTogglePlayed={gameState.toggleSongPlayed}
                playedCount={gameState.playedCount}
                totalCount={gameState.totalCount}
              />
            )}
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}

export default App;
