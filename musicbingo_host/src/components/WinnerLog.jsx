import React, { useState } from 'react';
import './WinnerLog.css';

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
 * Format timestamp for display.
 */
function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * WinnerLog - Shows verified winners with prize assignment.
 */
export function WinnerLog({ winners = [], currentPrize, onAssignPrize }) {
  const [customPrizes, setCustomPrizes] = useState({}); // cardId -> custom prize
  const [editingPrize, setEditingPrize] = useState(null); // cardId being edited

  const handleAssignPrize = (cardId, prize) => {
    if (onAssignPrize) {
      onAssignPrize(cardId, prize);
    }
  };

  const handleCustomPrizeChange = (cardId, value) => {
    setCustomPrizes(prev => ({ ...prev, [cardId]: value }));
  };

  const handleCustomPrizeSave = (cardId) => {
    const prize = customPrizes[cardId]?.trim();
    if (prize) {
      handleAssignPrize(cardId, prize);
    }
    setEditingPrize(null);
  };

  if (!winners || winners.length === 0) {
    return null;
  }

  return (
    <div className="winner-log">
      <h3 className="winner-log__title">Verified Winners</h3>

      <div className="winner-log__list">
        {winners.map((winner, index) => (
          <div key={winner.card_id} className="winner-log__item">
            <div className="winner-log__rank">#{index + 1}</div>

            <div className="winner-log__info">
              <div className="winner-log__header">
                <span className="winner-log__card">Card #{winner.card_number}</span>
                <span className="winner-log__time">{formatTime(winner.detected_at)}</span>
              </div>
              <div className="winner-log__player">{winner.player_name}</div>
              <div className="winner-log__pattern">{formatPattern(winner.pattern)}</div>
            </div>

            <div className="winner-log__prize">
              {winner.prize_assigned ? (
                <div className="winner-log__prize-assigned">
                  <span className="winner-log__prize-check">&#10003;</span>
                  <span className="winner-log__prize-text">{winner.prize_assigned}</span>
                </div>
              ) : editingPrize === winner.card_id ? (
                <div className="winner-log__prize-edit">
                  <input
                    type="text"
                    value={customPrizes[winner.card_id] || ''}
                    onChange={(e) => handleCustomPrizeChange(winner.card_id, e.target.value)}
                    placeholder="Custom prize..."
                    className="winner-log__prize-input"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCustomPrizeSave(winner.card_id);
                      if (e.key === 'Escape') setEditingPrize(null);
                    }}
                  />
                  <button
                    className="winner-log__prize-save"
                    onClick={() => handleCustomPrizeSave(winner.card_id)}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="winner-log__prize-actions">
                  {currentPrize && (
                    <button
                      className="winner-log__assign-btn winner-log__assign-btn--primary"
                      onClick={() => handleAssignPrize(winner.card_id, currentPrize)}
                      title={`Assign: ${currentPrize}`}
                    >
                      {currentPrize.length > 20 ? currentPrize.substring(0, 20) + '...' : currentPrize}
                    </button>
                  )}
                  <button
                    className="winner-log__assign-btn winner-log__assign-btn--secondary"
                    onClick={() => {
                      setEditingPrize(winner.card_id);
                      setCustomPrizes(prev => ({ ...prev, [winner.card_id]: '' }));
                    }}
                    title="Enter custom prize"
                  >
                    Custom
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WinnerLog;
