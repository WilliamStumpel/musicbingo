const STORAGE_KEY = 'musicbingo_server_url';
const DEFAULT_URL = 'http://localhost:8000';

/**
 * Get the current API URL from localStorage or default
 * @returns {string} The API base URL
 */
export function getApiUrl() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return stored;
  }
  return DEFAULT_URL;
}

/**
 * Set the API URL and persist to localStorage
 * @param {string} url - The server URL to save
 */
export function setApiUrl(url) {
  localStorage.setItem(STORAGE_KEY, url);
}

/**
 * Clear the saved API URL
 */
export function clearApiUrl() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if a server URL has been configured
 * @returns {boolean} True if a URL is saved in localStorage
 */
export function hasStoredUrl() {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

// Legacy config object for backwards compatibility
const config = {
  get API_URL() {
    return getApiUrl();
  }
};

export default config;
