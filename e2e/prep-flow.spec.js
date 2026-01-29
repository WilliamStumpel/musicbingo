// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

/**
 * E2E tests for the Game Prep workflow.
 * Tests the complete flow: Venue creation → Venue Night → Game → Playlist upload
 */
test.describe('Prep Flow', () => {
  // Test data
  const testVenue = {
    name: 'E2E Test Bar',
    contactInfo: 'Test DJ - 555-0100',
  };

  const testNight = {
    // Date will be set dynamically to today
  };

  const testGame = {
    name: 'E2E Test Game',
    cardCount: 50,
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to the Prep view
    await page.goto('/prep');

    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('Game Prep');
  });

  test('complete prep workflow - venue, night, game, playlist', async ({ page }) => {
    // =========================================
    // STEP 1: Create a new venue
    // =========================================

    // Should already be on Venues tab by default
    await expect(page.locator('.tab-button.active')).toContainText('Venues');

    // Click Add Venue button
    await page.click('.add-venue-btn');

    // Wait for venue form to appear
    await expect(page.locator('.venue-form')).toBeVisible();
    await expect(page.locator('.venue-form h3')).toContainText('New Venue');

    // Fill in venue name
    await page.fill('#venue-name', testVenue.name);

    // Fill in contact info
    await page.fill('#venue-contact', testVenue.contactInfo);

    // Submit the form
    await page.click('.form-submit-btn');

    // Wait for form to close and venue to appear in list
    await expect(page.locator('.venue-form')).not.toBeVisible();
    await expect(page.locator('.venue-card .venue-name')).toContainText(testVenue.name);

    // =========================================
    // STEP 2: Create a new venue night
    // =========================================

    // Click on Nights tab
    await page.click('button.tab-button:has-text("Nights")');

    // Wait for tab content to load
    await expect(page.locator('.venue-night-manager')).toBeVisible();

    // Click Add Night button
    await page.click('.add-night-btn');

    // Wait for night form to appear
    await expect(page.locator('.night-form')).toBeVisible();
    await expect(page.locator('.night-form h3')).toContainText('New Venue Night');

    // Select our test venue from dropdown
    await page.selectOption('#night-venue', { label: testVenue.name });

    // Date should default to today, but let's explicitly set it
    const today = new Date().toISOString().split('T')[0];
    await page.fill('#night-date', today);

    // Submit the form
    await page.click('.night-form .form-submit-btn');

    // Wait for form to close and night to appear in list
    await expect(page.locator('.night-form')).not.toBeVisible();
    await expect(page.locator('.night-card')).toBeVisible();
    await expect(page.locator('.night-card .night-venue')).toContainText(testVenue.name);

    // =========================================
    // STEP 3: Create a new game
    // =========================================

    // Click on Games tab
    await page.click('button.tab-button:has-text("Games")');

    // Wait for tab content to load
    await expect(page.locator('.game-manager')).toBeVisible();

    // Click Add Game button
    await page.click('.add-game-btn');

    // Wait for game detail view to appear
    await expect(page.locator('.game-detail')).toBeVisible();
    await expect(page.locator('.game-detail h2')).toContainText('New Game');

    // Select our test venue night (should match our venue name)
    await page.selectOption('#game-night', { label: new RegExp(testVenue.name) });

    // Fill in game name
    await page.fill('#game-name', testGame.name);

    // Set card count
    await page.fill('#game-cards', String(testGame.cardCount));

    // =========================================
    // STEP 4: Upload playlist CSV
    // =========================================

    // Get the file input and upload our test CSV
    const csvPath = path.join(__dirname, 'fixtures', 'test-playlist.csv');
    await page.setInputFiles('#csv-file', csvPath);

    // Wait for parsing to complete and preview to appear
    await expect(page.locator('.playlist-preview')).toBeVisible({ timeout: 10000 });

    // Verify songs were parsed
    await expect(page.locator('.preview-count')).toContainText('50 songs parsed');

    // Click "Use This Playlist" button
    await page.click('.use-playlist-btn');

    // Wait for preview to be replaced with current playlist
    await expect(page.locator('.playlist-preview')).not.toBeVisible();
    await expect(page.locator('.current-playlist')).toBeVisible();
    await expect(page.locator('.playlist-count')).toContainText('50 songs');

    // =========================================
    // STEP 5: Save the game
    // =========================================

    // Submit the form (Create Game button should now be enabled)
    await page.click('.form-submit-btn');

    // Wait for redirect back to game list
    await expect(page.locator('.game-list')).toBeVisible({ timeout: 10000 });

    // Verify game appears in the list
    await expect(page.locator('.game-card .game-name')).toContainText(testGame.name);
    await expect(page.locator('.game-card .game-song-count')).toContainText('50 songs');
    await expect(page.locator('.game-card .game-card-count')).toContainText(`${testGame.cardCount} cards`);
  });

  test('venue form validation - requires name', async ({ page }) => {
    // Click Add Venue button
    await page.click('.add-venue-btn');

    // Wait for venue form to appear
    await expect(page.locator('.venue-form')).toBeVisible();

    // Try to submit without name
    await page.click('.form-submit-btn');

    // Should show error
    await expect(page.locator('.form-error')).toContainText('Venue name is required');
  });

  test('game form validation - requires playlist with 24+ songs', async ({ page }) => {
    // First create a venue and night (abbreviated flow)
    // Click Add Venue
    await page.click('.add-venue-btn');
    await page.fill('#venue-name', 'Validation Test Venue');
    await page.click('.form-submit-btn');
    await expect(page.locator('.venue-form')).not.toBeVisible();

    // Create Night
    await page.click('button.tab-button:has-text("Nights")');
    await page.click('.add-night-btn');
    await page.selectOption('#night-venue', { label: 'Validation Test Venue' });
    await page.click('.night-form .form-submit-btn');
    await expect(page.locator('.night-form')).not.toBeVisible();

    // Go to Games
    await page.click('button.tab-button:has-text("Games")');
    await page.click('.add-game-btn');

    // Select venue night and fill name
    await page.selectOption('#game-night', { label: /Validation Test Venue/ });
    await page.fill('#game-name', 'Validation Test Game');

    // Create Game button should be disabled (no playlist)
    const submitBtn = page.locator('.form-submit-btn');
    await expect(submitBtn).toBeDisabled();
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: Delete test data via API or UI
    // For now, test data accumulates - in production, use API cleanup
  });
});
