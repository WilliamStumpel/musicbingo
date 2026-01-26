import React, { useState, useEffect, useCallback } from 'react';
import * as prepApi from '../services/prepApi';
import './VenueManager.css';

/**
 * VenueManager - CRUD interface for managing venues.
 * Allows DJs to create, edit, delete venues and upload logos.
 */
export function VenueManager() {
  const [venues, setVenues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [formData, setFormData] = useState({ name: '', contact_info: '' });
  const [formError, setFormError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Logo upload state
  const [uploadingLogoId, setUploadingLogoId] = useState(null);

  // Fetch venues from API
  const fetchVenues = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await prepApi.getVenues();
      setVenues(data);
      setError(null);
    } catch (e) {
      setError('Failed to load venues');
      console.error('VenueManager fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load venues on mount
  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  // Open form for new venue
  const handleAddVenue = () => {
    setEditingVenue(null);
    setFormData({ name: '', contact_info: '' });
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open form for editing
  const handleEditVenue = (venue) => {
    setEditingVenue(venue);
    setFormData({
      name: venue.name,
      contact_info: venue.contact_info || '',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  // Close form
  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingVenue(null);
    setFormData({ name: '', contact_info: '' });
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

    if (!formData.name.trim()) {
      setFormError('Venue name is required');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingVenue) {
        // Update existing venue
        const updated = await prepApi.updateVenue(editingVenue.id, {
          name: formData.name.trim(),
          contact_info: formData.contact_info.trim() || null,
        });
        setVenues(prev =>
          prev.map(v => (v.id === updated.id ? updated : v))
        );
      } else {
        // Create new venue
        const created = await prepApi.createVenue({
          name: formData.name.trim(),
          contact_info: formData.contact_info.trim() || null,
        });
        setVenues(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      handleCancelForm();
    } catch (e) {
      setFormError(e.message || 'Failed to save venue');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete venue
  const handleDeleteVenue = async (venue) => {
    if (!window.confirm(`Delete "${venue.name}"? This will also delete all associated nights and games.`)) {
      return;
    }

    try {
      await prepApi.deleteVenue(venue.id);
      setVenues(prev => prev.filter(v => v.id !== venue.id));
    } catch (e) {
      setError(e.message || 'Failed to delete venue');
    }
  };

  // Handle logo file selection
  const handleLogoSelect = async (venueId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setUploadingLogoId(venueId);
    setError(null);

    try {
      const updated = await prepApi.uploadVenueLogo(venueId, file);
      setVenues(prev =>
        prev.map(v => (v.id === updated.id ? updated : v))
      );
    } catch (e) {
      setError(e.message || 'Failed to upload logo');
    } finally {
      setUploadingLogoId(null);
      // Reset file input
      e.target.value = '';
    }
  };

  // Get logo URL from path (for displaying)
  const getLogoUrl = (logoPath) => {
    if (!logoPath) return null;
    // The logo is stored on the server, serve via API
    // For now, we'll use a data URL approach or relative path
    // Since logos are in data/logos/, we need an endpoint to serve them
    // For MVP, we'll show a placeholder or the filename
    return `${prepApi.API_BASE}/api/prep/logos/${logoPath.split('/').pop()}`;
  };

  return (
    <div className="venue-manager">
      {/* Header */}
      <div className="venue-header">
        <h2>Venues</h2>
        <button className="add-venue-btn" onClick={handleAddVenue}>
          + Add Venue
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="venue-error">
          {error}
          <button className="error-dismiss" onClick={() => setError(null)}>
            &times;
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="venue-loading">Loading venues...</div>
      )}

      {/* Inline Form */}
      {isFormOpen && (
        <div className="venue-form-wrapper">
          <form className="venue-form" onSubmit={handleSubmitForm}>
            <h3>{editingVenue ? 'Edit Venue' : 'New Venue'}</h3>

            {formError && (
              <div className="form-error">{formError}</div>
            )}

            <div className="form-field">
              <label htmlFor="venue-name">Venue Name *</label>
              <input
                id="venue-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., The Blue Moon Bar"
                maxLength={200}
                autoFocus
              />
            </div>

            <div className="form-field">
              <label htmlFor="venue-contact">Contact Info</label>
              <textarea
                id="venue-contact"
                name="contact_info"
                value={formData.contact_info}
                onChange={handleInputChange}
                placeholder="e.g., DJ Bill - 555-1234"
                rows={3}
                maxLength={500}
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
                {isSaving ? 'Saving...' : editingVenue ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Venue List */}
      <div className="venue-list">
        {venues.length === 0 && !isLoading && (
          <div className="venue-empty">
            No venues yet. Click "Add Venue" to create your first venue.
          </div>
        )}

        {venues.map(venue => (
          <div key={venue.id} className="venue-card">
            <div className="venue-logo-section">
              {venue.logo_path ? (
                <div className="venue-logo">
                  <img
                    src={getLogoUrl(venue.logo_path)}
                    alt={`${venue.name} logo`}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="venue-logo-fallback" style={{ display: 'none' }}>
                    {venue.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              ) : (
                <div className="venue-logo venue-logo--placeholder">
                  {venue.name.charAt(0).toUpperCase()}
                </div>
              )}
              <label className="logo-upload-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoSelect(venue.id, e)}
                  disabled={uploadingLogoId === venue.id}
                />
                {uploadingLogoId === venue.id ? 'Uploading...' : 'Upload Logo'}
              </label>
            </div>

            <div className="venue-info">
              <h3 className="venue-name">{venue.name}</h3>
              {venue.contact_info && (
                <p className="venue-contact">{venue.contact_info}</p>
              )}
            </div>

            <div className="venue-actions">
              <button
                className="venue-edit-btn"
                onClick={() => handleEditVenue(venue)}
                title="Edit venue"
              >
                Edit
              </button>
              <button
                className="venue-delete-btn"
                onClick={() => handleDeleteVenue(venue)}
                title="Delete venue"
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

export default VenueManager;
