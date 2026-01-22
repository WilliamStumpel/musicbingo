import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as gameApi from '../services/gameApi';
import './CardStatusPanel.css';

const POLL_INTERVAL = 5000; // 5 seconds

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
 * CardStatusPanel - Slide-out panel showing all registered cards with progress.
 * DJ's cheat sheet for monitoring card status and winners.
 */
export function CardStatusPanel({ isOpen, onClose, gameId, winners = [], onAssignPrize, currentPrize }) {
  const [cardStatuses, setCardStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  // Fetch card statuses from API
  const fetchStatuses = useCallback(async () => {
    if (!gameId) return;

    try {
      const data = await gameApi.getCardStatuses(gameId);
      // Combine cards and winners, sort by progress (winners first, then by matches)
      const allCards = [
        ...(data.winners || []).map(w => ({ ...w, is_winner: true })),
        ...(data.cards || []).filter(c => !data.winners?.some(w => w.card_id === c.card_id)),
      ];

      // Sort: winners first, then by matches_needed ascending (closest to winning)
      allCards.sort((a, b) => {
        if (a.is_winner && !b.is_winner) return -1;
        if (!a.is_winner && b.is_winner) return 1;
        return (a.matches_needed || 0) - (b.matches_needed || 0);
      });

      setCardStatuses(allCards);
      setError(null);
    } catch (e) {
      setError('Failed to load card statuses');
      console.error('CardStatusPanel fetch error:', e);
    }
  }, [gameId]);

  // Initial fetch when panel opens
  useEffect(() => {
    if (isOpen && gameId) {
      setIsLoading(true);
      fetchStatuses().finally(() => setIsLoading(false));
    }
  }, [isOpen, gameId, fetchStatuses]);

  // Polling while panel is open
  useEffect(() => {
    if (isOpen && gameId) {
      pollRef.current = setInterval(fetchStatuses, POLL_INTERVAL);
      return () => {
        if (pollRef.current) {
          clearInterval(pollRef.current);
        }
      };
    }
  }, [isOpen, gameId, fetchStatuses]);

  // Calculate stats
  const totalRegistered = cardStatuses.length;
  const totalWinners = cardStatuses.filter(c => c.is_winner).length;

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('card-status-backdrop')) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="card-status-backdrop" onClick={handleBackdropClick}>
      <div className="card-status-panel">
        {/* Header */}
        <div className="card-status-header">
          <h2>Card Status</h2>
          <button
            className="card-status-close"
            onClick={onClose}
            aria-label="Close panel"
          >
            &times;
          </button>
        </div>

        {/* Summary Stats */}
        <div className="card-status-stats">
          <span className="stat">
            <span className="stat-value">{totalRegistered}</span>
            <span className="stat-label">Registered</span>
          </span>
          <span className="stat">
            <span className="stat-value stat-value--winner">{totalWinners}</span>
            <span className="stat-label">Winners</span>
          </span>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="card-status-loading">Loading...</div>
        )}

        {error && (
          <div className="card-status-error">{error}</div>
        )}

        {/* Card List */}
        <div className="card-status-list">
          {cardStatuses.length === 0 && !isLoading && !error && (
            <div className="card-status-empty">
              No cards registered yet.
              <br />
              <span className="card-status-hint">Scan cards to register players.</span>
            </div>
          )}

          {cardStatuses.map(card => (
            <div
              key={card.card_id}
              className={`card-status-item ${card.is_winner ? 'card-status-item--winner' : ''}`}
            >
              <div className="card-status-info">
                <div className="card-status-card">Card #{card.card_number}</div>
                <div className="card-status-player">{card.player_name}</div>
              </div>

              <div className="card-status-progress">
                {card.is_winner ? (
                  <span className="card-status-badge">WINNER</span>
                ) : (
                  <>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${(card.matches / card.required) * 100}%` }}
                      />
                    </div>
                    <span className="progress-text">
                      {card.matches}/{card.required}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Winner Log Section */}
        {winners.length > 0 && (
          <div className="card-status-winners">
            <h3 className="winners-title">Verified Winners</h3>
            {winners.map(winner => (
              <div key={winner.card_id} className="winner-item">
                <div className="winner-info">
                  <span className="winner-card">Card #{winner.card_number}</span>
                  <span className="winner-player">{winner.player_name}</span>
                  <span className="winner-pattern">({formatPattern(winner.pattern)})</span>
                </div>
                <div className="winner-prize">
                  {winner.prize_assigned ? (
                    <span className="prize-assigned">
                      <span className="prize-check">&#10003;</span>
                      {winner.prize_assigned}
                    </span>
                  ) : currentPrize ? (
                    <button
                      className="prize-assign-btn"
                      onClick={() => onAssignPrize && onAssignPrize(winner.card_id, currentPrize)}
                    >
                      Assign Prize
                    </button>
                  ) : (
                    <span className="prize-pending">Set prize first</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CardStatusPanel;
