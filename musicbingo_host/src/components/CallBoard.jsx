import React from 'react';
import './CallBoard.css';

/**
 * CallBoard component showing played songs in play order.
 * Displays the call history with the current "now playing" song highlighted.
 */
export function CallBoard({
  songs,
  playedSongs,
  playedOrder,
  nowPlaying,
}) {
  // Build a map of song_id -> song for quick lookup
  const songMap = React.useMemo(() => {
    const map = new Map();
    songs.forEach(song => {
      map.set(song.song_id, song);
    });
    return map;
  }, [songs]);

  // Get played songs in reverse order (most recent first)
  const playedSongsInOrder = React.useMemo(() => {
    return [...playedOrder].reverse().map(songId => {
      const song = songMap.get(songId);
      return song ? { ...song, isNowPlaying: songId === nowPlaying } : null;
    }).filter(Boolean);
  }, [playedOrder, songMap, nowPlaying]);

  const playedCount = playedSongs.size;

  return (
    <div className="call-board">
      {/* Header */}
      <div className="call-board-header">
        <h2>Call Board</h2>
        <span className="call-board-count">{playedCount} played</span>
      </div>

      {/* Song List */}
      <div className="call-board-list">
        {playedSongsInOrder.length === 0 && (
          <div className="call-board-empty">
            No songs played yet
          </div>
        )}

        {playedSongsInOrder.map((song, index) => (
          <div
            key={song.song_id}
            className={`call-board-row ${song.isNowPlaying ? 'now-playing' : ''}`}
          >
            <div className="call-board-song-info">
              <div className="call-board-title">{song.title}</div>
              <div className="call-board-artist">{song.artist}</div>
            </div>
            {song.isNowPlaying && (
              <div className="now-playing-badge">NOW</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
