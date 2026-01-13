/**
 * ResultDisplay Component
 * Shows verification results with visual feedback (green for winner, red for non-winner)
 */

import React, { useEffect } from 'react';
import './ResultDisplay.css';

export default function ResultDisplay({ result, onClose }) {
  const isWinner = result?.winner;

  useEffect(() => {
    // Vibrate on result display (if supported)
    if ('vibrate' in navigator) {
      if (isWinner) {
        // Double vibration for winner
        navigator.vibrate([200, 100, 200]);
      } else {
        // Single short vibration for non-winner
        navigator.vibrate(100);
      }
    }
  }, [isWinner]);

  if (!result) return null;

  return (
    <div className={`result-overlay ${isWinner ? 'winner' : 'not-winner'}`}>
      <div className="result-content">
        {isWinner ? (
          <>
            <div className="icon-success" aria-label="Winner">✓</div>
            <h1 className="result-title">WINNER!</h1>
            <p className="card-number">Card #{result.card_number}</p>
            {result.pattern && (
              <p className="pattern">{formatPattern(result.pattern)}</p>
            )}
          </>
        ) : (
          <>
            <div className="icon-failure" aria-label="Not a winner">✗</div>
            <h2 className="result-title">Not a Winner Yet</h2>
            <p className="card-number">Card #{result.card_number}</p>
            <p className="encouragement">Keep playing!</p>
          </>
        )}
        <button className="close-button" onClick={onClose} autoFocus>
          Scan Another Card
        </button>
      </div>
    </div>
  );
}

/**
 * Format pattern name for display
 * @param {string} pattern - Pattern type from API
 * @returns {string} Formatted pattern name
 */
function formatPattern(pattern) {
  const patterns = {
    'five_in_a_row': 'Five in a Row',
    'row': 'Row',
    'column': 'Column',
    'diagonal': 'Diagonal',
    'four_corners': 'Four Corners',
    'x_pattern': 'X Pattern',
    'full_card': 'Blackout',
  };
  return patterns[pattern] || pattern;
}
