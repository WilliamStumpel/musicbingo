import React from 'react';
import './PlayerCallBoard.css';

/**
 * PlayerCallBoard component for TV display.
 * Shows a grid of played songs optimized for viewing from across a venue.
 */
export function PlayerCallBoard({
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

  // Get played songs in reverse order (most recent first), excluding now playing
  // Now playing is shown in the hero section, not in the grid
  const playedSongsInOrder = React.useMemo(() => {
    return [...playedOrder]
      .reverse()
      .filter(songId => songId !== nowPlaying) // Exclude now playing from grid
      .slice(0, 20) // Max ~20 visible songs
      .map(songId => {
        const song = songMap.get(songId);
        return song || null;
      })
      .filter(Boolean);
  }, [playedOrder, songMap, nowPlaying]);

  // Get the currently playing song
  const nowPlayingSong = React.useMemo(() => {
    if (!nowPlaying) return null;
    return songMap.get(nowPlaying) || null;
  }, [nowPlaying, songMap]);

  return (
    <div className="player-call-board-container">
      {/* Now Playing Hero Section */}
      <div className={`now-playing-hero ${nowPlayingSong ? 'active' : 'idle'}`}>
        <div className="now-playing-label">NOW PLAYING</div>
        {nowPlayingSong ? (
          <div className="now-playing-content">
            <div className="now-playing-title">{nowPlayingSong.title}</div>
            <div className="now-playing-artist">{nowPlayingSong.artist}</div>
          </div>
        ) : (
          <div className="now-playing-content">
            <div className="now-playing-title idle-title">Ready to play</div>
            <div className="now-playing-artist idle-artist">Select a song to begin</div>
          </div>
        )}
      </div>

      {/* Played Songs Grid */}
      <div className="played-songs-grid">
        {playedSongsInOrder.length === 0 && !nowPlayingSong && (
          <div className="grid-empty">
            No songs played yet
          </div>
        )}

        {playedSongsInOrder.map((song) => (
          <div key={song.song_id} className="grid-cell">
            <div className="grid-cell-title">{song.title}</div>
            <div className="grid-cell-artist">{song.artist}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
