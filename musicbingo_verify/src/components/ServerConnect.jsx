/**
 * ServerConnect Component
 * Allows user to enter server IP address and establish connection
 */

import React, { useState } from 'react';
import { ApiClient } from '../services/apiClient';
import './ServerConnect.css';

/**
 * Connection status states
 */
const ConnectionStatus = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * Server connection component for entering DJ's laptop IP
 */
function ServerConnect({ onConnect }) {
  const [serverAddress, setServerAddress] = useState('');
  const [status, setStatus] = useState(ConnectionStatus.IDLE);
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Handle form submission and test connection
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!serverAddress.trim()) {
      setStatus(ConnectionStatus.ERROR);
      setErrorMessage('Please enter a server address');
      return;
    }

    setStatus(ConnectionStatus.CONNECTING);
    setErrorMessage('');

    // Construct URL - add protocol if not present
    let url = serverAddress.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`;
    }

    try {
      const client = new ApiClient(url);
      const healthy = await client.healthCheck();

      if (healthy) {
        setStatus(ConnectionStatus.SUCCESS);
        // Brief delay to show success state before transitioning
        setTimeout(() => {
          onConnect(url);
        }, 500);
      } else {
        setStatus(ConnectionStatus.ERROR);
        setErrorMessage('Could not connect. Check the IP and make sure server is running.');
      }
    } catch (error) {
      setStatus(ConnectionStatus.ERROR);
      setErrorMessage('Could not connect. Check the IP and make sure server is running.');
    }
  };

  const isConnecting = status === ConnectionStatus.CONNECTING;
  const hasError = status === ConnectionStatus.ERROR;
  const isSuccess = status === ConnectionStatus.SUCCESS;

  return (
    <div className="server-connect">
      <div className="server-connect-content">
        <div className="server-connect-icon">
          <span role="img" aria-label="connection">
            {isSuccess ? '!' : '?'}
          </span>
        </div>

        <h1 className="server-connect-title">Connect to Music Bingo Server</h1>

        <p className="server-connect-instructions">
          Enter the IP address shown on the DJ's laptop
        </p>

        <form onSubmit={handleSubmit} className="server-connect-form">
          <input
            type="text"
            value={serverAddress}
            onChange={(e) => setServerAddress(e.target.value)}
            placeholder="192.168.1.x:8000"
            className={`server-connect-input ${hasError ? 'error' : ''} ${isSuccess ? 'success' : ''}`}
            disabled={isConnecting || isSuccess}
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
          />

          {hasError && (
            <p className="server-connect-error">{errorMessage}</p>
          )}

          {isSuccess && (
            <p className="server-connect-success">Connected!</p>
          )}

          <button
            type="submit"
            className={`server-connect-button ${isConnecting ? 'connecting' : ''} ${isSuccess ? 'success' : ''}`}
            disabled={isConnecting || isSuccess}
          >
            {isConnecting ? (
              <>
                <span className="button-spinner"></span>
                Connecting...
              </>
            ) : isSuccess ? (
              'Connected!'
            ) : (
              'Connect'
            )}
          </button>
        </form>

        <p className="server-connect-help">
          Make sure your phone is on the same WiFi network as the DJ's laptop
        </p>
      </div>
    </div>
  );
}

export default ServerConnect;
