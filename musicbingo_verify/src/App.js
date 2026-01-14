/**
 * Main App Component
 * Music Bingo QR Code Verification Scanner
 */

import React, { useState, useEffect, useCallback } from 'react';
import Scanner from './components/Scanner';
import ResultDisplay from './components/ResultDisplay';
import ErrorMessage from './components/ErrorMessage';
import ServerConnect from './components/ServerConnect';
import { useScanner } from './hooks/useScanner';
import { ApiClient } from './services/apiClient';
import { getApiUrl, setApiUrl, hasStoredUrl } from './config';
import './App.css';

function App() {
  const { result, error, isProcessing, handleScan, reset } = useScanner();
  const [serverUrl, setServerUrl] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

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
    <div className="app">
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
            handleScan(null); // This will trigger error handling
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
    </div>
  );
}

export default App;
