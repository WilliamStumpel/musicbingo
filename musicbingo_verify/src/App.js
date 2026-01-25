/**
 * Main App Component
 * Music Bingo QR Code Verification Scanner with Song Checklist
 */

import React, { useState, useEffect, useCallback } from 'react';
import Scanner from './components/Scanner';
import ResultDisplay from './components/ResultDisplay';
import ErrorMessage from './components/ErrorMessage';
import ServerConnect from './components/ServerConnect';
import CardRegistration from './components/CardRegistration';
import { SongChecklist } from './components/SongChecklist';
import { TabBar } from './components/TabBar';
import { useScanner } from './hooks/useScanner';
import { useGameState } from './hooks/useGameState';
import { ApiClient } from './services/apiClient';
import { getApiUrl, setApiUrl, hasStoredUrl } from './config';
import packageInfo from '../package.json';
import './App.css';

// App version for debugging deployment issues
const APP_VERSION = packageInfo.version;

function App() {
  const { result, error, isProcessing, handleScan, reset } = useScanner();
  const gameState = useGameState();
  // eslint-disable-next-line no-unused-vars
  const [serverUrl, setServerUrl] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [activeTab, setActiveTab] = useState('scan');
  // Card registration state (shown after scanning non-winner cards)
  const [registrationCard, setRegistrationCard] = useState(null);

  // Check connection on mount (including URL param for auto-connect)
  useEffect(() => {
    async function checkConnection() {
      // Check for auto-connect URL param (from QR code scan)
      const urlParams = new URLSearchParams(window.location.search);
      const serverParam = urlParams.get('server');

      if (serverParam) {
        // Auto-connect from QR code
        const client = new ApiClient(serverParam);
        const healthy = await client.healthCheck();
        if (healthy) {
          setApiUrl(serverParam);
          setServerUrl(serverParam);
          setIsConnected(true);
          // Clean up URL param after successful connection
          window.history.replaceState({}, '', window.location.pathname);
        }
        setIsCheckingConnection(false);
        return;
      }

      // Fall back to stored URL
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
          <div className="scan-tab-content">
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
            {result && !registrationCard && (
              <ResultDisplay
                result={result}
                onClose={() => {
                  // If not a winner, offer to register the card
                  if (!result.winner) {
                    setRegistrationCard({
                      cardId: result.card_id,
                      cardNumber: result.card_number,
                      gameId: result.game_id,
                    });
                  }
                  reset();
                }}
              />
            )}

            {/* Card Registration Modal */}
            {registrationCard && (
              <CardRegistration
                cardId={registrationCard.cardId}
                cardNumber={registrationCard.cardNumber}
                gameId={registrationCard.gameId}
                onRegistered={(playerName) => {
                  console.log(`Card ${registrationCard.cardNumber} registered to ${playerName}`);
                  setRegistrationCard(null);
                }}
                onCancel={() => {
                  setRegistrationCard(null);
                }}
              />
            )}

            {/* Error Display */}
            {error && (
              <ErrorMessage
                message={error}
                onClose={reset}
              />
            )}
          </div>
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

      {/* Version indicator */}
      <div className="version-indicator">v{APP_VERSION}</div>
    </div>
  );
}

export default App;
