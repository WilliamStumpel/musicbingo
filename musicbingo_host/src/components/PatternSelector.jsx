import React from 'react';
import './PatternSelector.css';

/**
 * Pattern options with user-friendly labels.
 * Pattern types from backend: five_in_a_row, row, column, diagonal, four_corners, x_pattern, full_card
 */
const PATTERN_OPTIONS = [
  { value: 'five_in_a_row', label: '5 in a Row', description: 'Row, column, or diagonal' },
  { value: 'four_corners', label: '4 Corners', description: 'All four corners' },
  { value: 'x_pattern', label: 'X Pattern', description: 'Both diagonals' },
  { value: 'full_card', label: 'Blackout', description: 'All 24 squares' },
];

/**
 * PatternSelector component for choosing the winning pattern.
 */
export function PatternSelector({
  currentPattern,
  onPatternChange,
  disabled = false,
}) {
  const handleChange = (e) => {
    if (onPatternChange) {
      onPatternChange(e.target.value);
    }
  };

  // Find current pattern's label for display
  const currentOption = PATTERN_OPTIONS.find(opt => opt.value === currentPattern);
  const currentLabel = currentOption ? currentOption.label : currentPattern;

  return (
    <div className="pattern-selector">
      <label className="pattern-label">Pattern:</label>
      <select
        value={currentPattern}
        onChange={handleChange}
        disabled={disabled}
        className="pattern-select"
      >
        {PATTERN_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="pattern-current">{currentLabel}</span>
    </div>
  );
}
