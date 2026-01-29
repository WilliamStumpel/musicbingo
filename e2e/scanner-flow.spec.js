// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * E2E tests for the Scanner PWA connection flow.
 * Tests connecting to the server and basic UI flow.
 * Note: Full QR scanning requires camera access which is complex to mock in E2E tests.
 */
test.describe('Scanner Flow', () => {
  test.use({
    // Scanner runs on port 3001
    baseURL: 'http://localhost:3001',
  });

  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh connection state
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('shows connect screen when not connected', async ({ page }) => {
    // Navigate to scanner app
    await page.goto('/');

    // Should show the server connect screen
    await expect(page.locator('.server-connect')).toBeVisible({ timeout: 10000 });

    // Verify title
    await expect(page.locator('.server-connect-title')).toContainText('Connect to Music Bingo Server');

    // Verify input field is present
    await expect(page.locator('.server-connect-input')).toBeVisible();

    // Verify connect button
    await expect(page.locator('.server-connect-button')).toContainText('Connect');
  });

  test('connect to server with manual IP entry', async ({ page }) => {
    // Navigate to scanner app
    await page.goto('/');

    // Wait for connect screen
    await expect(page.locator('.server-connect')).toBeVisible({ timeout: 10000 });

    // Enter the server URL (API runs on localhost:8000)
    await page.fill('.server-connect-input', 'localhost:8000');

    // Click Connect button
    await page.click('.server-connect-button');

    // Should show connecting state
    await expect(page.locator('.server-connect-button')).toContainText('Connecting...');

    // Wait for connection to succeed
    await expect(page.locator('.server-connect-success')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.server-connect-success')).toContainText('Connected!');

    // After connection, should transition to main app
    await expect(page.locator('.server-connect')).not.toBeVisible({ timeout: 5000 });

    // Verify scan tab is visible (default tab after connection)
    await expect(page.locator('.scan-tab-content')).toBeVisible();

    // Verify header shows verification title
    await expect(page.locator('.app-header h1')).toContainText('Music Bingo Verification');
  });

  test('shows error for invalid server address', async ({ page }) => {
    // Navigate to scanner app
    await page.goto('/');

    // Wait for connect screen
    await expect(page.locator('.server-connect')).toBeVisible({ timeout: 10000 });

    // Enter an invalid server URL
    await page.fill('.server-connect-input', 'invalid-server:9999');

    // Click Connect button
    await page.click('.server-connect-button');

    // Should show connecting state briefly
    await expect(page.locator('.server-connect-button')).toContainText('Connecting...');

    // Should show error
    await expect(page.locator('.server-connect-error')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.server-connect-error')).toContainText('Could not connect');

    // Should still be on connect screen
    await expect(page.locator('.server-connect')).toBeVisible();
  });

  test('shows error for empty server address', async ({ page }) => {
    // Navigate to scanner app
    await page.goto('/');

    // Wait for connect screen
    await expect(page.locator('.server-connect')).toBeVisible({ timeout: 10000 });

    // Click Connect button without entering address
    await page.click('.server-connect-button');

    // Should show error about empty address
    await expect(page.locator('.server-connect-error')).toBeVisible();
    await expect(page.locator('.server-connect-error')).toContainText('Please enter a server address');
  });

  test('auto-connects with URL parameter', async ({ page }) => {
    // Navigate with server URL parameter (simulates QR code scan)
    await page.goto('/?server=http://localhost:8000');

    // Should skip connect screen and go directly to app
    // First shows "Checking connection..." loading state
    await expect(page.locator('.processing-content p')).toContainText('Checking connection...');

    // Then should transition to main app
    await expect(page.locator('.scan-tab-content')).toBeVisible({ timeout: 10000 });

    // Verify we're connected and on the scan tab
    await expect(page.locator('.app-header h1')).toContainText('Music Bingo Verification');
  });

  test('tab bar navigation after connection', async ({ page }) => {
    // Navigate with auto-connect
    await page.goto('/?server=http://localhost:8000');

    // Wait for app to load
    await expect(page.locator('.scan-tab-content')).toBeVisible({ timeout: 10000 });

    // Verify tab bar is visible
    await expect(page.locator('.tab-bar')).toBeVisible();

    // Click on Checklist tab
    await page.click('.tab-bar button:has-text("Checklist")');

    // Should show checklist view
    await expect(page.locator('.checklist-container')).toBeVisible();

    // Verify game selector dropdown is present
    await expect(page.locator('.game-select')).toBeVisible();

    // Click back on Scan tab
    await page.click('.tab-bar button:has-text("Scan")');

    // Should show scan view again
    await expect(page.locator('.scan-tab-content')).toBeVisible();
  });

  test('displays version indicator', async ({ page }) => {
    // Navigate with auto-connect
    await page.goto('/?server=http://localhost:8000');

    // Wait for app to load
    await expect(page.locator('.scan-tab-content')).toBeVisible({ timeout: 10000 });

    // Verify version indicator is present
    const version = page.locator('.version-indicator');
    await expect(version).toBeVisible();

    // Version should match package.json (0.3.1)
    const versionText = await version.textContent();
    expect(versionText).toMatch(/^v\d+\.\d+\.\d+$/);
  });
});
