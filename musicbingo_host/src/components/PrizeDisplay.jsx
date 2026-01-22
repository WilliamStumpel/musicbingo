import React from 'react';
import './PrizeDisplay.css';

/**
 * PrizeDisplay - Eye-catching prize advertisement for venue TV.
 * Designed for large screens with high visibility.
 */
export function PrizeDisplay({ prize, isVisible }) {
  if (!prize || !isVisible) {
    return null;
  }

  return (
    <div className="prize-display">
      <div className="prize-display__content">
        <span className="prize-display__label">WIN</span>
        <span className="prize-display__value">{prize}</span>
      </div>
      <div className="prize-display__glow" />
    </div>
  );
}

export default PrizeDisplay;
