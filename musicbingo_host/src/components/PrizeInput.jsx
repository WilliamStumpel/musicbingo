import React, { useState, useRef, useEffect } from 'react';
import './PrizeInput.css';

/**
 * PrizeInput - Inline component for setting the game prize.
 * Shows current prize or placeholder, click to edit.
 */
export function PrizeInput({ currentPrize, onSetPrize, disabled }) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (disabled) return;
    setInputValue(currentPrize || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      onSetPrize(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleBlur = () => {
    // Small delay to allow click on save button if needed
    setTimeout(() => {
      if (isEditing) {
        handleSave();
      }
    }, 100);
  };

  if (isEditing) {
    return (
      <div className="prize-input prize-input--editing">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Enter prize..."
          className="prize-input__field"
          maxLength={100}
        />
      </div>
    );
  }

  return (
    <div
      className={`prize-input ${disabled ? 'prize-input--disabled' : ''}`}
      onClick={handleClick}
      title={currentPrize ? 'Click to edit prize' : 'Click to set prize'}
    >
      {currentPrize ? (
        <span className="prize-input__display">
          <span className="prize-input__label">Prize:</span>
          <span className="prize-input__value">{currentPrize}</span>
        </span>
      ) : (
        <span className="prize-input__placeholder">Set prize...</span>
      )}
    </div>
  );
}

export default PrizeInput;
