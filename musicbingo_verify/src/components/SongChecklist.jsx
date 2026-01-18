import React, { useState, useMemo } from 'react';
import './SongChecklist.css';

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
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('TITLE_ASC');

  const displayedSongs = useMemo(() => {
    let result = [...songs];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(song =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query)
      );
    }

    const sort = SORT_OPTIONS[sortKey];
    result.sort((a, b) => {
      const aVal = a[sort.field].toLowerCase();
      const bVal = b[sort.field].toLowerCase();
      const cmp = aVal.localeCompare(bVal);
      return sort.dir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [songs, searchQuery, sortKey]);

  return (
    <div className="song-checklist">
      <div className="checklist-header">
        <div className="stats">
          <span className="played-count">{playedCount}</span>
          <span className="total-count">/ {totalCount} played</span>
        </div>
      </div>

      <div className="checklist-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search songs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => setSearchQuery('')}
            >
              x
            </button>
          )}
        </div>

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          className="sort-select"
        >
          {Object.entries(SORT_OPTIONS).map(([key, opt]) => (
            <option key={key} value={key}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="song-list">
        {displayedSongs.map(song => {
          const isPlayed = playedSongs.has(song.song_id);
          return (
            <div
              key={song.song_id}
              className={`song-row ${isPlayed ? 'played' : ''}`}
              onClick={() => onTogglePlayed(song.song_id)}
            >
              <div className="played-indicator">
                {isPlayed ? '\u2713' : '\u25CB'}
              </div>
              <div className="song-info">
                <div className="song-title">{song.title}</div>
                <div className="song-artist">{song.artist}</div>
              </div>
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
