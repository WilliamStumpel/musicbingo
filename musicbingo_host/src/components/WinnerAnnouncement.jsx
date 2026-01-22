import React, { useEffect, useRef } from 'react';
import './WinnerAnnouncement.css';

const AUTO_DISMISS_DELAY = 8000; // 8 seconds

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
 * WinnerAnnouncement - Full-screen celebration overlay for venue TV.
 * Shows when a winner is verified.
 */
export function WinnerAnnouncement({ winner, onDismiss }) {
  const timerRef = useRef(null);

  // Auto-dismiss after timeout
  useEffect(() => {
    if (!winner) return;

    timerRef.current = setTimeout(() => {
      onDismiss && onDismiss();
    }, AUTO_DISMISS_DELAY);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [winner, onDismiss]);

  if (!winner) {
    return null;
  }

  return (
    <div className="winner-announcement" onClick={onDismiss}>
      {/* Confetti particles */}
      <div className="confetti-container">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="confetti"
            style={{
              '--delay': `${Math.random() * 3}s`,
              '--x': `${Math.random() * 100}vw`,
              '--rotation': `${Math.random() * 720 - 360}deg`,
              '--color': ['#ffc107', '#ff9800', '#1DB954', '#fff', '#ff6b6b'][Math.floor(Math.random() * 5)],
            }}
          />
        ))}
      </div>

      <div className="winner-announcement__content">
        {/* BINGO! */}
        <div className="winner-announcement__bingo">BINGO!</div>

        {/* Winner info */}
        <div className="winner-announcement__info">
          <div className="winner-announcement__card">
            Card #{winner.card_number}
          </div>
          <div className="winner-announcement__player">
            {winner.player_name}
          </div>
          <div className="winner-announcement__pattern">
            {formatPattern(winner.pattern)}
          </div>
        </div>

        {/* Prize */}
        {winner.prize && (
          <div className="winner-announcement__prize">
            <span className="winner-announcement__prize-label">WINS</span>
            <span className="winner-announcement__prize-value">{winner.prize}</span>
          </div>
        )}
      </div>

      {/* Tap to dismiss hint */}
      <div className="winner-announcement__hint">
        Tap anywhere to dismiss
      </div>
    </div>
  );
}

export default WinnerAnnouncement;
