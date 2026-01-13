/**
 * ErrorMessage Component
 * Displays error messages with option to retry
 */

import React from 'react';
import './ErrorMessage.css';

export default function ErrorMessage({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="error-overlay">
      <div className="error-content">
        <div className="error-icon" aria-label="Error">⚠</div>
        <h2 className="error-title">Oops!</h2>
        <p className="error-message">{message}</p>
        <button className="retry-button" onClick={onClose} autoFocus>
          Try Again
        </button>
      </div>
    </div>
  );
}
