/**
 * CardRegistration Component
 * Modal for registering a player name to a scanned card
 */

import React, { useState, useRef, useEffect } from 'react';
import { registerCard } from '../services/apiClient';
import './CardRegistration.css';

function CardRegistration({ cardId, cardNumber, gameId, onRegistered, onCancel }) {
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!playerName.trim()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await registerCard(gameId, cardId, playerName.trim());
      onRegistered(playerName.trim());
    } catch (err) {
      setError(err.message || 'Failed to register card');
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="registration-overlay" onKeyDown={handleKeyDown}>
      <div className="registration-modal">
        <h2>Register Card #{cardNumber}</h2>
        <p className="registration-prompt">Enter player name for this card:</p>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Player name"
            maxLength={50}
            disabled={isSubmitting}
            className="registration-input"
          />

          {error && (
            <div className="registration-error">
              {error}
            </div>
          )}

          <div className="registration-buttons">
            <button
              type="submit"
              disabled={!playerName.trim() || isSubmitting}
              className="register-button"
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="skip-button"
            >
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CardRegistration;
