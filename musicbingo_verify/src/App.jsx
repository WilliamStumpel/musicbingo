/**
 * Main App Component
 * Music Bingo QR Code Verification Scanner
 */

import React from 'react';
import Scanner from './components/Scanner';
import ResultDisplay from './components/ResultDisplay';
import ErrorMessage from './components/ErrorMessage';
import { useScanner } from './hooks/useScanner';
import './App.css';

function App() {
  const { result, error, isProcessing, handleScan, reset } = useScanner();

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
