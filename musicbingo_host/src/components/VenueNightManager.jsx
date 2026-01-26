import React, { useState, useEffect, useCallback } from 'react';
import * as prepApi from '../services/prepApi';
import './VenueNightManager.css';

/**
 * VenueNightManager - CRUD interface for managing venue nights.
 * Allows DJs to create, edit, delete venue nights with venue selection and status tracking.
 */
export function VenueNightManager() {
  const [nights, setNights] = useState([]);
  const [venues, setVenues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNight, setEditingNight] = useState(null);
  const [formData, setFormData] = useState({ venue_id: '', date: '', status: 'draft', notes: '' });
  const [formError, setFormError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filter state
  const [filterVenueId, setFilterVenueId] = useState(null);

  // Fetch venues for dropdown
  const fetchVenues = useCallback(async () => {
    try {
      const data = await prepApi.getVenues();
      setVenues(data);
    } catch (e) {
      console.error('Failed to load venues:', e);
    }
  }, []);

  // Fetch venue nights
  const fetchNights = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await prepApi.getVenueNights(filterVenueId);
      setNights(data);
      setError(null);
    } catch (e) {
      setError('Failed to load venue nights');
      console.error('VenueNightManager fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [filterVenueId]);

  // Load data on mount and when filter changes
  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  useEffect(() => {
    fetchNights();
  }, [fetchNights]);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Open form for new night
  const handleAddNight = () => {
    setEditingNight(null);
    setFormData({
      venue_id: venues.length > 0 ? venues[0].id : '',
      date: getTodayDate(),
      status: 'draft',
      notes: '',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open form for editing
  const handleEditNight = (night) => {
    setEditingNight(night);
    setFormData({
      venue_id: night.venue_id,
      date: night.date,
      status: night.status,
      notes: night.notes || '',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  // Close form
  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingNight(null);
    setFormData({ venue_id: '', date: '', status: 'draft', notes: '' });
    setFormError(null);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Submit form (create or update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();

    if (!formData.venue_id) {
      setFormError('Please select a venue');
      return;
    }

    if (!formData.date) {
      setFormError('Please select a date');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingNight) {
        // Update existing night
        const updated = await prepApi.updateVenueNight(editingNight.id, {
          venue_id: parseInt(formData.venue_id),
          date: formData.date,
          status: formData.status,
          notes: formData.notes.trim() || null,
        });
        setNights(prev =>
          prev.map(n => (n.id === updated.id ? updated : n))
            .sort((a, b) => new Date(b.date) - new Date(a.date))
        );
      } else {
        // Create new night
        const created = await prepApi.createVenueNight({
          venue_id: parseInt(formData.venue_id),
          date: formData.date,
          notes: formData.notes.trim() || null,
        });
        setNights(prev =>
          [...prev, created].sort((a, b) => new Date(b.date) - new Date(a.date))
        );
      }
      handleCancelForm();
    } catch (e) {
      setFormError(e.message || 'Failed to save venue night');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete night
  const handleDeleteNight = async (night) => {
    const gameWarning = night.game_count > 0
      ? ` This will also delete ${night.game_count} associated game(s).`
      : '';
    if (!window.confirm(`Delete night at ${night.venue_name} on ${formatDate(night.date)}?${gameWarning}`)) {
      return;
    }

    try {
      await prepApi.deleteVenueNight(night.id);
      setNights(prev => prev.filter(n => n.id !== night.id));
    } catch (e) {
      setError(e.message || 'Failed to delete venue night');
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'ready':
        return 'status-badge status-ready';
      case 'completed':
        return 'status-badge status-completed';
      default:
        return 'status-badge status-draft';
    }
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilterVenueId(value ? parseInt(value) : null);
  };

  return (
    <div className="night-manager">
      {/* Header */}
      <div className="night-header">
        <div className="night-header-left">
          <h2>Venue Nights</h2>
          <div className="night-filter">
            <select
              value={filterVenueId || ''}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Venues</option>
              {venues.map(venue => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="add-night-btn" onClick={handleAddNight}>
          + Add Night
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="night-error">
          {error}
          <button className="error-dismiss" onClick={() => setError(null)}>
            &times;
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="night-loading">Loading venue nights...</div>
      )}

      {/* Inline Form */}
      {isFormOpen && (
        <div className="night-form-wrapper">
          <form className="night-form" onSubmit={handleSubmitForm}>
            <h3>{editingNight ? 'Edit Venue Night' : 'New Venue Night'}</h3>

            {formError && (
              <div className="form-error">{formError}</div>
            )}

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="night-venue">Venue *</label>
                <select
                  id="night-venue"
                  name="venue_id"
                  value={formData.venue_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a venue...</option>
                  {venues.map(venue => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="night-date">Date *</label>
                <input
                  id="night-date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {editingNight && (
                <div className="form-field">
                  <label htmlFor="night-status">Status</label>
                  <select
                    id="night-status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="night-notes">Notes</label>
              <textarea
                id="night-notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="e.g., Special event, theme night, etc."
                rows={2}
                maxLength={1000}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="form-cancel-btn"
                onClick={handleCancelForm}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="form-submit-btn"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : editingNight ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Night List */}
      <div className="night-list">
        {nights.length === 0 && !isLoading && (
          <div className="night-empty">
            {filterVenueId
              ? 'No nights for this venue yet.'
              : 'No venue nights yet. Click "Add Night" to schedule your first game night.'}
          </div>
        )}

        {nights.map(night => (
          <div key={night.id} className="night-card">
            <div className="night-date-section">
              <div className="night-date">{formatDate(night.date)}</div>
              <span className={getStatusClass(night.status)}>
                {night.status}
              </span>
            </div>

            <div className="night-info">
              <h3 className="night-venue-name">{night.venue_name}</h3>
              <div className="night-meta">
                <span className="night-game-count">
                  {night.game_count} game{night.game_count !== 1 ? 's' : ''}
                </span>
              </div>
              {night.notes && (
                <p className="night-notes">{night.notes}</p>
              )}
            </div>

            <div className="night-actions">
              <button
                className="night-edit-btn"
                onClick={() => handleEditNight(night)}
                title="Edit night"
              >
                Edit
              </button>
              <button
                className="night-delete-btn"
                onClick={() => handleDeleteNight(night)}
                title="Delete night"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VenueNightManager;
