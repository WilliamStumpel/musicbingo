import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { API_BASE, getServerInfo } from '../services/gameApi';
import './ConnectionInfo.css';

export function ConnectionInfo({ isOpen, onClose }) {
  const [serverUrl, setServerUrl] = useState(API_BASE);

  useEffect(() => {
    if (isOpen) {
      getServerInfo()
        .then((data) => setServerUrl(data.url))
        .catch(() => setServerUrl(API_BASE)); // Fallback to localhost
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="connection-modal-overlay" onClick={onClose}>
      <div className="connection-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="connection-modal-title">Connect Scanner App</h3>

        <div className="qr-container">
          <QRCodeSVG
            value={serverUrl}
            size={200}
            bgColor="#2a2a2a"
            fgColor="#1DB954"
            level="M"
          />
        </div>

        <p className="connection-instructions">
          Scan with your phone camera to get the server URL
        </p>

        <div className="server-url">
          <code>{serverUrl}</code>
        </div>

        <button className="connection-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
