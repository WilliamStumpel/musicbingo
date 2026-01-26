import React, { useState, useEffect, useCallback } from 'react';
import * as prepApi from '../services/prepApi';
import './GameManager.css';

/**
 * GameManager - CRUD interface for managing bingo games.
 * Supports CSV playlist upload and preview before saving.
 */
export function GameManager() {
  // List state
  const [games, setGames] = useState([]);
  const [nights, setNights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [filterNightId, setFilterNightId] = useState(null);

  // View state: 'list' or 'detail'
  const [view, setView] = useState('list');
  const [editingGame, setEditingGame] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    venue_night_id: '',
    name: '',
    card_count: 50,
    playlist: [],
  });
  const [previewPlaylist, setPreviewPlaylist] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [generationError, setGenerationError] = useState(null);

  // Fetch venue nights for dropdown
  const fetchNights = useCallback(async () => {
    try {
      const data = await prepApi.getVenueNights();
      setNights(data);
    } catch (e) {
      console.error('Failed to load venue nights:', e);
    }
  }, []);

  // Fetch games
  const fetchGames = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await prepApi.getGames(filterNightId);
      setGames(data);
      setError(null);
    } catch (e) {
      setError('Failed to load games');
      console.error('GameManager fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [filterNightId]);

  // Load data on mount and when filter changes
  useEffect(() => {
    fetchNights();
  }, [fetchNights]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // Open detail view for new game
  const handleAddGame = () => {
    setEditingGame(null);
    setFormData({
      venue_night_id: nights.length > 0 ? nights[0].id : '',
      name: '',
      card_count: 50,
      playlist: [],
    });
    setPreviewPlaylist(null);
    setFormError(null);
    setView('detail');
  };

  // Open detail view for editing
  const handleEditGame = async (game) => {
    try {
      // Fetch full game data with playlist
      const fullGame = await prepApi.getGame(game.id);
      setEditingGame(fullGame);
      setFormData({
        venue_night_id: fullGame.venue_night_id,
        name: fullGame.name,
        card_count: fullGame.card_count,
        playlist: fullGame.playlist,
      });
      setPreviewPlaylist(null);
      setFormError(null);
      setGenerationResult(null);
      setGenerationError(null);
      setView('detail');
    } catch (e) {
      setError(e.message || 'Failed to load game');
    }
  };

  // Return to list view
  const handleBackToList = () => {
    setView('list');
    setEditingGame(null);
    setPreviewPlaylist(null);
    setFormError(null);
    setGenerationResult(null);
    setGenerationError(null);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'card_count' || name === 'venue_night_id'
        ? (value === '' ? '' : parseInt(value, 10))
        : value,
    }));
  };

  // Handle CSV file selection and parsing
  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setFormError(null);

    try {
      const result = await prepApi.parseCSV(file);
      setPreviewPlaylist(result.songs);
    } catch (e) {
      setFormError(e.message || 'Failed to parse CSV');
    } finally {
      setIsParsing(false);
      // Reset the file input
      e.target.value = '';
    }
  };

  // Use the previewed playlist
  const handleUsePlaylist = () => {
    if (previewPlaylist) {
      setFormData(prev => ({ ...prev, playlist: previewPlaylist }));
      setPreviewPlaylist(null);
    }
  };

  // Cancel playlist preview
  const handleCancelPlaylist = () => {
    setPreviewPlaylist(null);
  };

  // Submit form (create or update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();

    if (!formData.venue_night_id) {
      setFormError('Please select a venue night');
      return;
    }

    if (!formData.name.trim()) {
      setFormError('Please enter a game name');
      return;
    }

    if (formData.playlist.length < 24) {
      setFormError('Playlist must have at least 24 songs');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingGame) {
        // Update existing game
        const updated = await prepApi.updateGame(editingGame.id, {
          name: formData.name.trim(),
          playlist: formData.playlist,
          card_count: formData.card_count,
          sort_order: editingGame.sort_order,
        });
        setGames(prev =>
          prev.map(g => (g.id === updated.id ? { ...g, ...updated } : g))
        );
      } else {
        // Create new game
        const created = await prepApi.createGame({
          venue_night_id: formData.venue_night_id,
          name: formData.name.trim(),
          playlist: formData.playlist,
          card_count: formData.card_count,
        });
        setGames(prev => [...prev, created]);
      }
      handleBackToList();
    } catch (e) {
      setFormError(e.message || 'Failed to save game');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete game
  const handleDeleteGame = async () => {
    if (!editingGame) return;

    if (!window.confirm(`Delete game "${editingGame.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await prepApi.deleteGame(editingGame.id);
      setGames(prev => prev.filter(g => g.id !== editingGame.id));
      handleBackToList();
    } catch (e) {
      setFormError(e.message || 'Failed to delete game');
    }
  };

  // Generate cards
  const handleGenerateCards = async () => {
    if (!editingGame) return;

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationResult(null);

    try {
      const result = await prepApi.generateCards(editingGame.id);
      setGenerationResult(result);
      // Update the game in the list to reflect PDF status
      setGames(prev =>
        prev.map(g =>
          g.id === editingGame.id
            ? { ...g, pdf_path: result.pdf_path }
            : g
        )
      );
      // Update editingGame to show download buttons
      setEditingGame(prev => ({ ...prev, pdf_path: result.pdf_path }));
    } catch (e) {
      setGenerationError(e.message || 'Failed to generate cards');
    } finally {
      setIsGenerating(false);
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilterNightId(value ? parseInt(value, 10) : null);
  };

  // Get night label
  const getNightLabel = (night) => {
    return `${night.venue_name} - ${formatDate(night.date)}`;
  };

  // Render list view
  const renderListView = () => (
    <>
      {/* Header */}
      <div className="game-header">
        <div className="game-header-left">
          <h2>Games</h2>
          <div className="game-filter">
            <select
              value={filterNightId || ''}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Nights</option>
              {nights.map(night => (
                <option key={night.id} value={night.id}>
                  {getNightLabel(night)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="add-game-btn" onClick={handleAddGame}>
          + Add Game
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="game-error">
          {error}
          <button className="error-dismiss" onClick={() => setError(null)}>
            &times;
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="game-loading">Loading games...</div>
      )}

      {/* Game List */}
      <div className="game-list">
        {games.length === 0 && !isLoading && (
          <div className="game-empty">
            {filterNightId
              ? 'No games for this night yet.'
              : 'No games yet. Click "Add Game" to create your first game.'}
          </div>
        )}

        {games.map(game => (
          <div
            key={game.id}
            className="game-card"
            onClick={() => handleEditGame(game)}
          >
            <div className="game-info">
              <h3 className="game-name">{game.name}</h3>
              <div className="game-meta">
                <span className="game-night">
                  {game.venue_name} - {formatDate(game.night_date)}
                </span>
              </div>
              <div className="game-stats">
                <span className="game-song-count">{game.song_count} songs</span>
                <span className="game-card-count">{game.card_count} cards</span>
                <span className={`game-pdf-status ${game.pdf_path ? 'generated' : 'pending'}`}>
                  {game.pdf_path ? 'PDF Generated' : 'PDF Pending'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  // Render detail/edit view
  const renderDetailView = () => {
    return (
      <div className="game-detail">
        {/* Back button */}
        <button className="back-btn" onClick={handleBackToList}>
          &larr; Back to Games
        </button>

        <h2>{editingGame ? `Edit: ${editingGame.name}` : 'New Game'}</h2>

        <form className="game-form" onSubmit={handleSubmitForm}>
          {formError && (
            <div className="form-error">{formError}</div>
          )}

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="game-night">Venue Night *</label>
              <select
                id="game-night"
                name="venue_night_id"
                value={formData.venue_night_id}
                onChange={handleInputChange}
                disabled={editingGame !== null}
                required
              >
                <option value="">Select a night...</option>
                {nights.map(night => (
                  <option key={night.id} value={night.id}>
                    {getNightLabel(night)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="game-name">Game Name *</label>
              <input
                id="game-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., 90s Hits"
                maxLength={200}
                required
              />
            </div>

            <div className="form-field form-field-small">
              <label htmlFor="game-cards">Cards</label>
              <input
                id="game-cards"
                type="number"
                name="card_count"
                value={formData.card_count}
                onChange={handleInputChange}
                min={1}
                max={1000}
                required
              />
            </div>
          </div>

          {/* CSV Upload Section */}
          <div className="csv-section">
            <h3>Playlist</h3>

            <div className="csv-upload">
              <label htmlFor="csv-file" className="csv-upload-label">
                {isParsing ? 'Parsing...' : 'Upload Exportify CSV'}
              </label>
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                disabled={isParsing}
                className="csv-file-input"
              />
              <p className="csv-hint">
                Export your playlist from <a href="https://exportify.net" target="_blank" rel="noopener noreferrer">Exportify</a>
              </p>
            </div>

            {/* Playlist Preview (from CSV) */}
            {previewPlaylist && (
              <div className="playlist-preview">
                <div className="preview-header">
                  <span className="preview-count">{previewPlaylist.length} songs parsed</span>
                  <div className="preview-actions">
                    <button
                      type="button"
                      className="use-playlist-btn"
                      onClick={handleUsePlaylist}
                    >
                      Use This Playlist
                    </button>
                    <button
                      type="button"
                      className="cancel-playlist-btn"
                      onClick={handleCancelPlaylist}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                <div className="song-list preview-list">
                  {previewPlaylist.map((song, idx) => (
                    <div key={song.song_id} className="song-item">
                      <span className="song-number">{idx + 1}</span>
                      <span className="song-title">{song.title}</span>
                      <span className="song-artist">{song.artist}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current Playlist (when not previewing) */}
            {!previewPlaylist && formData.playlist.length > 0 && (
              <div className="current-playlist">
                <div className="playlist-header">
                  <span className="playlist-count">{formData.playlist.length} songs</span>
                </div>
                <div className="song-list">
                  {formData.playlist.map((song, idx) => (
                    <div key={song.song_id} className="song-item">
                      <span className="song-number">{idx + 1}</span>
                      <span className="song-title">{song.title}</span>
                      <span className="song-artist">{song.artist}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty playlist message */}
            {!previewPlaylist && formData.playlist.length === 0 && (
              <div className="playlist-empty">
                No playlist loaded. Upload a CSV file to add songs.
              </div>
            )}
          </div>

          {/* Card Generation Section - only show for existing games with enough songs */}
          {editingGame && formData.playlist.length >= 24 && (
            <div className="generation-section">
              <h3>Card Generation</h3>

              {/* Generation Error */}
              {generationError && (
                <div className="generation-error">
                  {generationError}
                </div>
              )}

              {/* Generation Success */}
              {generationResult && (
                <div className="generation-success">
                  Successfully generated {generationResult.card_count} cards!
                </div>
              )}

              {/* Generation Button */}
              <div className="generation-controls">
                <button
                  type="button"
                  className="generate-btn"
                  onClick={handleGenerateCards}
                  disabled={isGenerating || isSaving || formData.playlist.length < 48}
                >
                  {isGenerating ? 'Generating...' : 'Generate Cards'}
                </button>
                {formData.playlist.length < 48 && (
                  <span className="generation-hint">
                    Need at least 48 songs (have {formData.playlist.length})
                  </span>
                )}
              </div>

              {/* Download Buttons - show if PDF already generated or after successful generation */}
              {(editingGame.pdf_path || generationResult) && (
                <div className="download-section">
                  <h4>Downloads</h4>
                  <div className="download-buttons">
                    <a
                      href={prepApi.getDownloadPdfUrl(editingGame.id)}
                      className="download-btn download-pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download PDF
                    </a>
                    <a
                      href={prepApi.getDownloadJsonUrl(editingGame.id)}
                      className="download-btn download-json"
                      download
                    >
                      Download Game JSON
                    </a>
                  </div>
                  <p className="download-hint">
                    {generationResult
                      ? `${generationResult.card_count} cards generated`
                      : `${editingGame.card_count} cards`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            {editingGame && (
              <button
                type="button"
                className="delete-btn"
                onClick={handleDeleteGame}
                disabled={isSaving}
              >
                Delete Game
              </button>
            )}
            <div className="form-actions-right">
              <button
                type="button"
                className="form-cancel-btn"
                onClick={handleBackToList}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="form-submit-btn"
                disabled={isSaving || formData.playlist.length < 24}
              >
                {isSaving ? 'Saving...' : editingGame ? 'Update Game' : 'Create Game'}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="game-manager">
      {view === 'list' ? renderListView() : renderDetailView()}
    </div>
  );
}

export default GameManager;
