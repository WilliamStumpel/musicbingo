/**
 * Spotify OAuth PKCE Authentication Service
 *
 * Implements the Authorization Code with PKCE flow for Spotify.
 * No client secret needed - safe for browser/client-side apps.
 *
 * Required scopes for Music Bingo:
 * - streaming: Required for Web Playback SDK
 * - user-read-email: Required for Web Playback SDK
 * - user-read-private: Required for Web Playback SDK
 * - user-modify-playback-state: Required to start/control playback
 * - user-read-playback-state: Required to read current playback state
 */

// Configuration
const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = window.location.origin + '/callback';
const SCOPES = 'streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state';
const AUTH_URL = 'https://accounts.spotify.com/authorize';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';

// localStorage keys
const STORAGE_KEYS = {
  CODE_VERIFIER: 'spotify_code_verifier',
  ACCESS_TOKEN: 'spotify_access_token',
  REFRESH_TOKEN: 'spotify_refresh_token',
  TOKEN_EXPIRY: 'spotify_token_expiry',
};

// ============================================================================
// PKCE Helpers
// ============================================================================

/**
 * Generate a cryptographically random string
 * @param {number} length - Length of string (43-128 chars recommended)
 * @returns {string} Random string
 */
function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

/**
 * SHA256 hash using Web Crypto API
 * @param {string} plain - String to hash
 * @returns {Promise<ArrayBuffer>} Hash as ArrayBuffer
 */
async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

/**
 * Base64url encode an ArrayBuffer
 * @param {ArrayBuffer} buffer - Buffer to encode
 * @returns {string} Base64url encoded string
 */
function base64urlencode(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  bytes.forEach(b => str += String.fromCharCode(b));
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generate PKCE code challenge from verifier
 * @param {string} verifier - Code verifier
 * @returns {Promise<string>} Base64url encoded SHA256 hash
 */
async function generateCodeChallenge(verifier) {
  const hashed = await sha256(verifier);
  return base64urlencode(hashed);
}

// ============================================================================
// Auth Flow Functions
// ============================================================================

/**
 * Initiate Spotify OAuth login
 * Generates PKCE verifier, stores it, and redirects to Spotify
 */
export async function initiateLogin() {
  if (!CLIENT_ID) {
    throw new Error('REACT_APP_SPOTIFY_CLIENT_ID environment variable is not set');
  }

  // Generate and store code verifier
  const codeVerifier = generateRandomString(64);
  localStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);

  // Generate code challenge
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Build authorization URL
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });

  // Redirect to Spotify
  window.location.href = `${AUTH_URL}?${params.toString()}`;
}

/**
 * Handle OAuth callback - exchange authorization code for tokens
 * @param {string} code - Authorization code from Spotify callback
 * @returns {Promise<{access_token: string, refresh_token: string, expires_in: number}>}
 */
export async function handleCallback(code) {
  const codeVerifier = localStorage.getItem(STORAGE_KEYS.CODE_VERIFIER);

  if (!codeVerifier) {
    throw new Error('Code verifier not found. Please start login flow again.');
  }

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to exchange code for tokens');
  }

  const data = await response.json();

  // Store tokens
  storeTokens(data.access_token, data.refresh_token, data.expires_in);

  // Clean up code verifier
  localStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);

  return data;
}

/**
 * Refresh access token using stored refresh token
 * @returns {Promise<{access_token: string, expires_in: number}>}
 */
export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

  if (!refreshToken) {
    throw new Error('No refresh token available. Please login again.');
  }

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    // If refresh fails, clear tokens and require re-login
    logout();
    throw new Error('Session expired. Please login again.');
  }

  const data = await response.json();

  // Store new tokens (Spotify may return a new refresh token)
  storeTokens(
    data.access_token,
    data.refresh_token || refreshToken,
    data.expires_in
  );

  return data;
}

/**
 * Log out - clear all stored tokens
 */
export function logout() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
  localStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
}

// ============================================================================
// Token Storage & Helpers
// ============================================================================

/**
 * Store tokens in localStorage
 * @param {string} accessToken
 * @param {string} refreshToken
 * @param {number} expiresIn - Seconds until expiry
 */
function storeTokens(accessToken, refreshToken, expiresIn) {
  const expiryTime = Date.now() + (expiresIn * 1000);

  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
}

/**
 * Get access token, auto-refreshing if expired
 * @returns {Promise<string|null>} Access token or null if not authenticated
 */
export async function getAccessToken() {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);

  if (!accessToken || !expiry) {
    return null;
  }

  // Check if token is expired or will expire in next 5 minutes
  const expiryTime = parseInt(expiry, 10);
  const bufferTime = 5 * 60 * 1000; // 5 minutes

  if (Date.now() >= expiryTime - bufferTime) {
    try {
      const data = await refreshAccessToken();
      return data.access_token;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }

  return accessToken;
}

/**
 * Check if user is authenticated (has valid tokens)
 * @returns {boolean}
 */
export function isAuthenticated() {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

  if (!accessToken || !expiry) {
    return false;
  }

  // Consider authenticated if we have a valid token OR a refresh token
  // (we can refresh expired tokens)
  const expiryTime = parseInt(expiry, 10);
  const isTokenValid = Date.now() < expiryTime;

  return isTokenValid || !!refreshToken;
}

/**
 * Get seconds until token expiry
 * @returns {number} Seconds until expiry, or 0 if expired/not set
 */
export function getTokenExpiresIn() {
  const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);

  if (!expiry) {
    return 0;
  }

  const expiryTime = parseInt(expiry, 10);
  const remaining = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));

  return remaining;
}

/**
 * Get user profile from Spotify API
 * @returns {Promise<{email: string, display_name: string, id: string} | null>}
 */
export async function getUserProfile() {
  const token = await getAccessToken();

  if (!token) {
    return null;
  }

  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}
