import React, { useEffect, useState, useRef } from 'react';
import './PatternDisplay.css';

/**
 * Pattern definitions for visualization.
 * Cells are [col, row] coordinates (0-4).
 */
const PATTERNS = {
  five_in_a_row: {
    label: '5 in a Row',
    // Example: middle row
    cells: [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]]
  },
  four_corners: {
    label: '4 Corners',
    cells: [[0, 0], [4, 0], [0, 4], [4, 4]]
  },
  x_pattern: {
    label: 'X Pattern',
    // Both diagonals
    cells: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [4, 0], [3, 1], [1, 3], [0, 4]]
  },
  full_card: {
    label: 'Blackout',
    cells: 'all'
  },
  frame: {
    label: 'Frame',
    cells: 'border'
  }
};

/**
 * Generate all cells for a pattern.
 * Returns Set of "col-row" strings for fast lookup.
 */
function getPatternCells(pattern) {
  const patternDef = PATTERNS[pattern];
  if (!patternDef) return new Set();

  if (patternDef.cells === 'all') {
    // All 25 cells
    const cells = new Set();
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        cells.add(`${col}-${row}`);
      }
    }
    return cells;
  }

  if (patternDef.cells === 'border') {
    // All edge cells (frame)
    const cells = new Set();
    for (let i = 0; i < 5; i++) {
      cells.add(`${i}-0`); // Top row
      cells.add(`${i}-4`); // Bottom row
      cells.add(`0-${i}`); // Left column
      cells.add(`4-${i}`); // Right column
    }
    return cells;
  }

  // Array of [col, row] coordinates
  return new Set(patternDef.cells.map(([col, row]) => `${col}-${row}`));
}

/**
 * PatternDisplay component that visualizes bingo patterns.
 *
 * @param {string} pattern - Pattern type (five_in_a_row, four_corners, x_pattern, full_card, frame)
 * @param {string} size - 'small' for host view, 'large' for player view
 */
export function PatternDisplay({ pattern = 'five_in_a_row', size = 'small' }) {
  const [animating, setAnimating] = useState(false);
  const prevPatternRef = useRef(pattern);

  // Trigger animation on pattern change
  useEffect(() => {
    if (prevPatternRef.current !== pattern) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 400);
      prevPatternRef.current = pattern;
      return () => clearTimeout(timer);
    }
  }, [pattern]);

  const patternCells = getPatternCells(pattern);
  const patternDef = PATTERNS[pattern] || { label: pattern };

  // Generate 5x5 grid cells
  const cells = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const key = `${col}-${row}`;
      const isCenter = col === 2 && row === 2;
      const isHighlighted = patternCells.has(key);

      cells.push(
        <div
          key={key}
          className={`pattern-cell ${isHighlighted ? 'highlighted' : ''} ${isCenter ? 'center' : ''}`}
        />
      );
    }
  }

  return (
    <div className={`pattern-display ${size} ${animating ? 'pattern-changed' : ''}`}>
      <div className="pattern-label">{patternDef.label}</div>
      <div className="pattern-grid">
        {cells}
      </div>
    </div>
  );
}
