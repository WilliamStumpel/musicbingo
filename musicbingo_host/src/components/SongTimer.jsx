import React, { useState, useEffect, useRef } from 'react';
import './SongTimer.css';

/**
 * SongTimer component for tracking song playback duration.
 * Shows elapsed time since current song marked "now playing".
 * Flashes when target duration reached.
 *
 * @param {string|null} nowPlaying - Current song ID (null = timer stops/resets)
 * @param {number} targetSeconds - Configurable target duration (default 30)
 */
function SongTimer({ nowPlaying, targetSeconds = 30 }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);

  // Reset and start timer when nowPlaying changes
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (nowPlaying) {
      // Start new timer
      startTimeRef.current = Date.now();
      setElapsedSeconds(0);

      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
    } else {
      // No song playing - reset
      setElapsedSeconds(0);
      startTimeRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [nowPlaying]);

  // Format seconds as M:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isAtTarget = elapsedSeconds >= targetSeconds;
  const progressPercent = Math.min((elapsedSeconds / targetSeconds) * 100, 100);

  // Don't render if no song is playing
  if (!nowPlaying) {
    return null;
  }

  return (
    <div className={`song-timer ${isAtTarget ? 'song-timer--at-target' : ''}`}>
      <div className="song-timer__label">Song Timer</div>
      <div className="song-timer__time">
        <span className={`song-timer__elapsed ${isAtTarget ? 'song-timer__elapsed--alert' : ''}`}>
          {formatTime(elapsedSeconds)}
        </span>
        <span className="song-timer__separator"> / </span>
        <span className="song-timer__target">{formatTime(targetSeconds)}</span>
      </div>
      <div className="song-timer__progress-bar">
        <div
          className={`song-timer__progress-fill ${isAtTarget ? 'song-timer__progress-fill--alert' : ''}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

export { SongTimer };
