import React from 'react';

/**
 * Spotify login/logout component
 *
 * Displays:
 * - Login button when not authenticated
 * - Loading spinner during auth operations
 * - Error message with retry on failures
 * - User info and logout button when authenticated
 */
function SpotifyLogin({ isAuthenticated, isLoading, error, user, onLogin, onLogout }) {
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      padding: '24px',
    },
    button: {
      backgroundColor: '#1DB954',
      color: '#fff',
      border: 'none',
      borderRadius: '24px',
      padding: '14px 32px',
      fontSize: '16px',
      fontWeight: '700',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'background-color 0.2s, transform 0.1s',
    },
    buttonHover: {
      backgroundColor: '#1ed760',
    },
    logoutButton: {
      backgroundColor: 'transparent',
      color: '#b3b3b3',
      border: '1px solid #b3b3b3',
      borderRadius: '24px',
      padding: '10px 24px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'color 0.2s, border-color 0.2s',
    },
    userInfo: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
    },
    email: {
      color: '#fff',
      fontSize: '16px',
      fontWeight: '500',
    },
    status: {
      color: '#1DB954',
      fontSize: '14px',
    },
    error: {
      color: '#ff4444',
      fontSize: '14px',
      textAlign: 'center',
      maxWidth: '300px',
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '3px solid #333',
      borderTop: '3px solid #1DB954',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    spinnerContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
    },
    spinnerText: {
      color: '#b3b3b3',
      fontSize: '14px',
    },
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={styles.container}>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
        <div style={styles.spinnerContainer}>
          <div style={styles.spinner} />
          <span style={styles.spinnerText}>Connecting to Spotify...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.container}>
        <p style={styles.error}>{error}</p>
        <button
          style={styles.button}
          onClick={onLogin}
          onMouseOver={(e) => e.target.style.backgroundColor = '#1ed760'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#1DB954'}
        >
          <SpotifyIcon />
          Try Again
        </button>
      </div>
    );
  }

  // Authenticated state
  if (isAuthenticated && user) {
    return (
      <div style={styles.container}>
        <div style={styles.userInfo}>
          <span style={styles.status}>Connected to Spotify</span>
          <span style={styles.email}>{user.email || user.displayName}</span>
        </div>
        <button
          style={styles.logoutButton}
          onClick={onLogout}
          onMouseOver={(e) => {
            e.target.style.color = '#fff';
            e.target.style.borderColor = '#fff';
          }}
          onMouseOut={(e) => {
            e.target.style.color = '#b3b3b3';
            e.target.style.borderColor = '#b3b3b3';
          }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Unauthenticated state
  return (
    <div style={styles.container}>
      <button
        style={styles.button}
        onClick={onLogin}
        onMouseOver={(e) => e.target.style.backgroundColor = '#1ed760'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#1DB954'}
      >
        <SpotifyIcon />
        Connect to Spotify
      </button>
      <p style={{ color: '#b3b3b3', fontSize: '12px', textAlign: 'center' }}>
        Sign in with your Spotify Premium account to play music
      </p>
    </div>
  );
}

/**
 * Spotify logo icon (simplified)
 */
function SpotifyIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

export default SpotifyLogin;
