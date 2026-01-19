import React, { useState, useMemo } from 'react';
import './SongChecklist.css';

// Sort options
const SORT_OPTIONS = {
  TITLE_ASC: { field: 'title', dir: 'asc', label: 'Title A-Z' },
  TITLE_DESC: { field: 'title', dir: 'desc', label: 'Title Z-A' },
  ARTIST_ASC: { field: 'artist', dir: 'asc', label: 'Artist A-Z' },
  ARTIST_DESC: { field: 'artist', dir: 'desc', label: 'Artist Z-A' },
};

export function SongChecklist({
  songs,
  playedSongs,
  onTogglePlayed,
  playedCount,
  totalCount,
  nowPlaying,
  revealedSongs = new Set(),
  onRevealSong,
  onSongClick,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('TITLE_ASC');

  // Filter and sort songs
  const displayedSongs = useMemo(() => {
    let result = [...songs];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(song =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query)
      );
    }

    // Sort
    const sort = SORT_OPTIONS[sortKey];
    result.sort((a, b) => {
      const aVal = a[sort.field].toLowerCase();
      const bVal = b[sort.field].toLowerCase();
      const cmp = aVal.localeCompare(bVal);
      return sort.dir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [songs, searchQuery, sortKey]);

  const handleSortChange = (e) => {
    setSortKey(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="song-checklist">
      {/* Header */}
      <div className="checklist-header">
        <div className="stats">
          <span className="played-count">{playedCount}</span>
          <span className="total-count">/ {totalCount} played</span>
        </div>
      </div>

      {/* Controls */}
      <div className="checklist-controls">
        {/* Search */}
        <div className="search-box">
          <input
            type="text"
            placeholder="Search songs..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search" onClick={clearSearch}>
              ×
            </button>
          )}
        </div>

        {/* Sort */}
        <select
          value={sortKey}
          onChange={handleSortChange}
          className="sort-select"
        >
          {Object.entries(SORT_OPTIONS).map(([key, opt]) => (
            <option key={key} value={key}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Song List */}
      <div className="song-list">
        {displayedSongs.map(song => {
          const isPlayed = playedSongs.has(song.song_id);
          const isNowPlaying = nowPlaying === song.song_id;
          const isRevealed = revealedSongs.has(song.song_id);
          const showRevealButton = isNowPlaying && !isRevealed;
          return (
            <div
              key={song.song_id}
              className={`song-row ${isPlayed ? 'played' : ''} ${isNowPlaying ? 'now-playing' : ''} ${isRevealed ? 'revealed' : ''}`}
              onClick={() => onSongClick ? onSongClick(song.song_id) : onTogglePlayed(song.song_id)}
            >
              <div className={`played-indicator ${isNowPlaying ? 'now-playing' : ''}`}>
                {isNowPlaying ? '♪' : (isPlayed ? '✓' : '○')}
              </div>
              <div className="song-info">
                <div className="song-title">
                  {song.title}
                  {isPlayed && !isRevealed && <span className="hidden-indicator" title="Title hidden on player view"> ?</span>}
                </div>
                <div className="song-artist">{song.artist}</div>
              </div>
              {showRevealButton && onRevealSong && (
                <button
                  className="reveal-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRevealSong(song.song_id);
                  }}
                  title="Reveal song title on player view"
                >
                  Reveal
                </button>
              )}
              {isRevealed && isPlayed && (
                <span className="revealed-indicator" title="Title visible on player view">Revealed</span>
              )}
            </div>
          );
        })}

        {displayedSongs.length === 0 && searchQuery && (
          <div className="no-results">
            No songs match "{searchQuery}"
          </div>
        )}

        {songs.length === 0 && (
          <div className="empty-state">
            Select a game to load songs
          </div>
        )}
      </div>
    </div>
  );
}
