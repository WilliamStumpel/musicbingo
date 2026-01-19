import React, { useState } from 'react';
import './GameControls.css';

/**
 * Game controls component with reset round button.
 *
 * Props:
 * - onReset: function to call when reset confirmed
 * - playedCount: number of songs played (shown in confirmation)
 * - disabled: boolean (disable during loading/no game)
 */
export function GameControls({ onReset, playedCount, disabled }) {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (disabled || isResetting) return;

    const message = playedCount > 0
      ? `Reset round? This will clear ${playedCount} played song${playedCount === 1 ? '' : 's'}.`
      : 'Reset round? (No songs have been played yet)';

    if (window.confirm(message)) {
      setIsResetting(true);
      try {
        await onReset();
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="game-controls">
      <button
        className="reset-button"
        onClick={handleReset}
        disabled={disabled || isResetting}
        title="Reset round and clear all played songs"
      >
        {isResetting ? 'Resetting...' : 'Reset Round'}
      </button>
    </div>
  );
}
