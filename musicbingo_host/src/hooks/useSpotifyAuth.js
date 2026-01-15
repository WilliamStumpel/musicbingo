import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initiateLogin,
  handleCallback,
  logout as spotifyLogout,
  isAuthenticated as checkIsAuthenticated,
  getAccessToken,
  getTokenExpiresIn,
  getUserProfile,
} from '../services/spotifyAuth';

/**
 * React hook for Spotify authentication
 *
 * Handles:
 * - OAuth callback processing
 * - Token validity checking
 * - Auto-refresh scheduling
 * - User profile fetching
 *
 * @returns {Object} Auth state and methods
 */
export function useSpotifyAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  const refreshTimerRef = useRef(null);

  /**
   * Schedule token refresh 5 minutes before expiry
   */
  const scheduleTokenRefresh = useCallback(async () => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    const expiresIn = getTokenExpiresIn();
    if (expiresIn <= 0) return;

    // Refresh 5 minutes before expiry
    const refreshIn = Math.max(0, (expiresIn - 5 * 60) * 1000);

    refreshTimerRef.current = setTimeout(async () => {
      try {
        // getAccessToken auto-refreshes if needed
        const token = await getAccessToken();
        if (token) {
          // Reschedule for next refresh
          scheduleTokenRefresh();
        }
      } catch (err) {
        console.error('Token refresh failed:', err);
        setError('Session expired. Please login again.');
        setIsAuthenticated(false);
        setUser(null);
      }
    }, refreshIn);
  }, []);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check if this is an OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const errorParam = urlParams.get('error');

        if (errorParam) {
          // User denied access or other OAuth error
          setError(`Spotify authorization failed: ${errorParam}`);
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          setIsLoading(false);
          return;
        }

        if (code) {
          // Handle OAuth callback
          try {
            await handleCallback(code);
            // Clean up URL - remove code parameter
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (err) {
            setError(err.message);
            setIsLoading(false);
            return;
          }
        }

        // Check existing auth state
        if (checkIsAuthenticated()) {
          setIsAuthenticated(true);

          // Fetch user profile
          const profile = await getUserProfile();
          if (profile) {
            setUser({
              email: profile.email,
              displayName: profile.display_name,
              id: profile.id,
            });
          }

          // Schedule token refresh
          scheduleTokenRefresh();
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Cleanup on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [scheduleTokenRefresh]);

  /**
   * Start Spotify login flow
   */
  const login = useCallback(async () => {
    setError(null);
    try {
      await initiateLogin();
    } catch (err) {
      setError(err.message);
    }
  }, []);

  /**
   * Log out and clear auth state
   */
  const logout = useCallback(() => {
    spotifyLogout();
    setIsAuthenticated(false);
    setUser(null);
    setError(null);

    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  return {
    isAuthenticated,
    isLoading,
    error,
    user,
    login,
    logout,
  };
}

export default useSpotifyAuth;
