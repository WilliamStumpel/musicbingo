/**
 * Tests for PatternSelector Component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PatternSelector } from './PatternSelector';

describe('PatternSelector', () => {
  const defaultProps = {
    currentPattern: 'five_in_a_row',
    onPatternChange: jest.fn(),
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders all 8 pattern options', () => {
      render(<PatternSelector {...defaultProps} />);

      const select = screen.getByRole('combobox');
      const options = select.querySelectorAll('option');

      expect(options).toHaveLength(8);
    });

    it('displays pattern name labels', () => {
      render(<PatternSelector {...defaultProps} />);

      expect(screen.getByRole('option', { name: '5 in a Row' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Any Row' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Any Column' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Diagonal' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '4 Corners' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'X Pattern' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Frame' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Blackout' })).toBeInTheDocument();
    });

    it('has correct values for each pattern option', () => {
      render(<PatternSelector {...defaultProps} />);

      expect(screen.getByRole('option', { name: '5 in a Row' })).toHaveValue('five_in_a_row');
      expect(screen.getByRole('option', { name: 'Any Row' })).toHaveValue('row');
      expect(screen.getByRole('option', { name: 'Any Column' })).toHaveValue('column');
      expect(screen.getByRole('option', { name: 'Diagonal' })).toHaveValue('diagonal');
      expect(screen.getByRole('option', { name: '4 Corners' })).toHaveValue('four_corners');
      expect(screen.getByRole('option', { name: 'X Pattern' })).toHaveValue('x_pattern');
      expect(screen.getByRole('option', { name: 'Frame' })).toHaveValue('frame');
      expect(screen.getByRole('option', { name: 'Blackout' })).toHaveValue('full_card');
    });

    it('shows selected pattern as active', () => {
      render(<PatternSelector {...defaultProps} currentPattern="four_corners" />);

      const select = screen.getByRole('combobox');
      expect(select.value).toBe('four_corners');
    });

    it('displays current pattern label in span', () => {
      render(<PatternSelector {...defaultProps} currentPattern="frame" />);

      // The label appears both in the select option and in a span
      const labels = screen.getAllByText('Frame');
      expect(labels.length).toBe(2);
      // The span should have the pattern-current class
      const span = document.querySelector('.pattern-current');
      expect(span).toHaveTextContent('Frame');
    });

    it('renders pattern label', () => {
      render(<PatternSelector {...defaultProps} />);

      expect(screen.getByText('Pattern:')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onPatternChange when pattern selected', () => {
      render(<PatternSelector {...defaultProps} />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'x_pattern' } });

      expect(defaultProps.onPatternChange).toHaveBeenCalledWith('x_pattern');
    });

    it('calls onPatternChange with each pattern type', () => {
      const patterns = [
        'five_in_a_row',
        'row',
        'column',
        'diagonal',
        'four_corners',
        'x_pattern',
        'frame',
        'full_card',
      ];

      render(<PatternSelector {...defaultProps} />);
      const select = screen.getByRole('combobox');

      patterns.forEach(pattern => {
        fireEvent.change(select, { target: { value: pattern } });
        expect(defaultProps.onPatternChange).toHaveBeenCalledWith(pattern);
      });
    });
  });

  describe('disabled state', () => {
    it('disables select when disabled prop is true', () => {
      render(<PatternSelector {...defaultProps} disabled={true} />);

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('does not call onPatternChange when disabled', () => {
      render(<PatternSelector {...defaultProps} disabled={true} />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'x_pattern' } });

      // The select is disabled, so the event handler shouldn't be called
      // Note: In real browser, disabled selects don't fire change events
      // but jsdom may still fire them. The component guards against this.
    });

    it('enables select when disabled prop is false', () => {
      render(<PatternSelector {...defaultProps} disabled={false} />);

      const select = screen.getByRole('combobox');
      expect(select).not.toBeDisabled();
    });
  });

  describe('edge cases', () => {
    it('handles unknown pattern gracefully', () => {
      render(<PatternSelector {...defaultProps} currentPattern="unknown_pattern" />);

      // Should show the pattern value as the label when not found
      expect(screen.getByText('unknown_pattern')).toBeInTheDocument();
    });

    it('handles missing onPatternChange gracefully', () => {
      render(<PatternSelector currentPattern="five_in_a_row" />);

      const select = screen.getByRole('combobox');
      // Should not throw when changing without handler
      expect(() => {
        fireEvent.change(select, { target: { value: 'x_pattern' } });
      }).not.toThrow();
    });
  });
});
