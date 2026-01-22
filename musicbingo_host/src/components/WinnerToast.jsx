import React, { useEffect, useRef } from 'react';
import './WinnerToast.css';

/**
 * Format pattern name for display.
 */
function formatPattern(pattern) {
  const patterns = {
    five_in_a_row: '5-in-a-row',
    row: 'Row',
    column: 'Column',
    diagonal: 'Diagonal',
    four_corners: '4 Corners',
    x_pattern: 'X Pattern',
    full_card: 'Blackout',
    frame: 'Frame',
  };
  return patterns[pattern] || pattern;
}

/**
 * WinnerToast - Private DJ notification for detected winners.
 * Shows toast notifications when new winners are detected.
 * Auto-dismisses after 10 seconds or can be clicked to dismiss.
 */
export function WinnerToast({ winners, onDismiss }) {
  const timersRef = useRef({});

  // Set up auto-dismiss timers for each winner
  useEffect(() => {
    winners.forEach(winner => {
      const cardId = winner.card_id;

      // Skip if timer already exists
      if (timersRef.current[cardId]) return;

      // Set 10 second auto-dismiss timer
      timersRef.current[cardId] = setTimeout(() => {
        onDismiss(cardId);
        delete timersRef.current[cardId];
      }, 10000);
    });

    // Cleanup function
    return () => {
      Object.values(timersRef.current).forEach(timer => clearTimeout(timer));
    };
  }, [winners, onDismiss]);

  // Handle click to dismiss
  const handleDismiss = (cardId) => {
    if (timersRef.current[cardId]) {
      clearTimeout(timersRef.current[cardId]);
      delete timersRef.current[cardId];
    }
    onDismiss(cardId);
  };

  if (!winners || winners.length === 0) {
    return null;
  }

  return (
    <div className="winner-toast-container">
      {winners.map(winner => (
        <div
          key={winner.card_id}
          className="winner-toast"
          onClick={() => handleDismiss(winner.card_id)}
          role="alert"
        >
          <div className="winner-toast-icon">BINGO!</div>
          <div className="winner-toast-content">
            <div className="winner-toast-card">Card #{winner.card_number}</div>
            <div className="winner-toast-player">{winner.player_name}</div>
            <div className="winner-toast-pattern">({formatPattern(winner.pattern)})</div>
          </div>
          <button
            className="winner-toast-close"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss(winner.card_id);
            }}
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}

export default WinnerToast;
