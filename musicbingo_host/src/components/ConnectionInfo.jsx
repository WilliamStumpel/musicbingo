import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { API_BASE, getServerInfo } from '../services/gameApi';
import './ConnectionInfo.css';

// Scanner app URL (deployed to Vercel for HTTPS)
const SCANNER_URL = process.env.REACT_APP_SCANNER_URL || 'https://musicbingo-verify.vercel.app';

// Storage key for persisting ngrok URL
const NGROK_URL_KEY = 'musicbingo_ngrok_url';

// Auto-detect ngrok URL from its local API
async function detectNgrokUrl() {
  try {
    const response = await fetch('http://localhost:4040/api/tunnels');
    if (!response.ok) return null;
    const data = await response.json();
    // Find the https tunnel
    const httpsTunnel = data.tunnels?.find(t => t.public_url?.startsWith('https://'));
    return httpsTunnel?.public_url || null;
  } catch {
    return null;
  }
}

export function ConnectionInfo({ isOpen, onClose }) {
  const [localServerUrl, setLocalServerUrl] = useState(API_BASE);
  const [ngrokUrl, setNgrokUrl] = useState(() => localStorage.getItem(NGROK_URL_KEY) || '');
  const [useNgrok, setUseNgrok] = useState(() => !!localStorage.getItem(NGROK_URL_KEY));
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch local server info for fallback
      getServerInfo()
        .then((data) => setLocalServerUrl(data.url))
        .catch(() => setLocalServerUrl(API_BASE));

      // Auto-detect ngrok if not already set
      if (!ngrokUrl) {
        setIsDetecting(true);
        detectNgrokUrl().then((url) => {
          setIsDetecting(false);
          if (url) {
            setNgrokUrl(url);
            setUseNgrok(true);
            localStorage.setItem(NGROK_URL_KEY, url);
          }
        });
      }
    }
  }, [isOpen, ngrokUrl]);

  // Save ngrok URL to localStorage when it changes
  const handleNgrokChange = (e) => {
    const url = e.target.value;
    setNgrokUrl(url);
    if (url) {
      localStorage.setItem(NGROK_URL_KEY, url);
    } else {
      localStorage.removeItem(NGROK_URL_KEY);
    }
  };

  // Manual refresh button to re-detect ngrok
  const handleRefreshNgrok = async () => {
    setIsDetecting(true);
    const url = await detectNgrokUrl();
    setIsDetecting(false);
    if (url) {
      setNgrokUrl(url);
      setUseNgrok(true);
      localStorage.setItem(NGROK_URL_KEY, url);
    }
  };

  if (!isOpen) return null;

  // Determine which API URL to use
  const apiUrl = useNgrok && ngrokUrl ? ngrokUrl : localServerUrl;

  // Build scanner URL with auto-connect param
  const scannerUrl = `${SCANNER_URL}?server=${encodeURIComponent(apiUrl)}`;

  return (
    <div className="connection-modal-overlay" onClick={onClose}>
      <div className="connection-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="connection-modal-title">Connect Scanner App</h3>

        {/* ngrok URL input for venue use */}
        <div className="ngrok-section">
          <div className="ngrok-header">
            <label className="ngrok-toggle">
              <input
                type="checkbox"
                checked={useNgrok}
                onChange={(e) => setUseNgrok(e.target.checked)}
              />
              <span>Use ngrok (for iOS camera)</span>
            </label>
            {useNgrok && (
              <button
                className="ngrok-refresh"
                onClick={handleRefreshNgrok}
                disabled={isDetecting}
                title="Auto-detect ngrok URL"
              >
                {isDetecting ? '...' : '↻'}
              </button>
            )}
          </div>

          {useNgrok && (
            <input
              type="text"
              className="ngrok-input"
              placeholder={isDetecting ? "Detecting ngrok..." : "https://abc123.ngrok-free.app"}
              value={ngrokUrl}
              onChange={handleNgrokChange}
            />
          )}
        </div>

        <div className="qr-container">
          <QRCodeSVG
            value={scannerUrl}
            size={200}
            bgColor="#2a2a2a"
            fgColor="#1DB954"
            level="M"
          />
        </div>

        <p className="connection-instructions">
          Scan with your phone camera to open the scanner app
        </p>

        <div className="server-url">
          <code className="server-url-text">{scannerUrl}</code>
        </div>

        <button className="connection-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
