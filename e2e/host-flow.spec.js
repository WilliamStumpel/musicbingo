// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * E2E tests for the Host App game flow.
 * Tests hosting a bingo game: load game, mark songs, verify call board, change pattern, reset.
 */
test.describe('Host Flow', () => {
  // Use the existing game file from games/ directory
  const testGameFile = 'all-out-90s.json';

  test.beforeEach(async ({ page }) => {
    // Navigate to the Host view
    await page.goto('/');

    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('Music Bingo Host');
  });

  test('load game and display song checklist', async ({ page }) => {
    // Select the test game from dropdown
    await page.selectOption('.game-selector select', { value: testGameFile });

    // Wait for game to load - song checklist should appear
    await expect(page.locator('.song-checklist')).toBeVisible({ timeout: 10000 });

    // Verify songs are displayed
    const songRows = page.locator('.song-row');
    await expect(songRows.first()).toBeVisible();

    // There should be multiple songs
    const songCount = await songRows.count();
    expect(songCount).toBeGreaterThan(20);

    // Verify stats header shows count
    await expect(page.locator('.stats .played-count')).toContainText('0');
    await expect(page.locator('.stats .total-count')).toContainText(`/ ${songCount} played`);
  });

  test('mark song as played and verify call board', async ({ page }) => {
    // Select the test game
    await page.selectOption('.game-selector select', { value: testGameFile });

    // Wait for song checklist to load
    await expect(page.locator('.song-checklist')).toBeVisible({ timeout: 10000 });

    // Get the first song row
    const firstSong = page.locator('.song-row').first();
    await expect(firstSong).toBeVisible();

    // Get the song title before clicking
    const songTitle = await firstSong.locator('.song-title').textContent();

    // Click the song to mark as played (and now playing)
    await firstSong.click();

    // Verify song is marked as now playing (amber indicator)
    await expect(firstSong).toHaveClass(/now-playing/);

    // Verify played count increased
    await expect(page.locator('.stats .played-count')).toContainText('1');

    // Verify Call Board shows the song
    const callBoard = page.locator('.call-board');
    await expect(callBoard).toBeVisible();

    // The now-playing song should appear in the call board
    await expect(callBoard.locator('.now-playing-song')).toContainText(songTitle.replace(/\?$/, '').trim());
  });

  test('change pattern selection', async ({ page }) => {
    // Select the test game
    await page.selectOption('.game-selector select', { value: testGameFile });

    // Wait for pattern selector to appear (only visible after game selected)
    await expect(page.locator('.pattern-selector')).toBeVisible({ timeout: 10000 });

    // Get current pattern
    const patternSelect = page.locator('.pattern-select');
    const initialPattern = await patternSelect.inputValue();
    expect(initialPattern).toBe('five_in_a_row'); // Default pattern

    // Change to Four Corners
    await patternSelect.selectOption('four_corners');

    // Verify pattern changed
    await expect(patternSelect).toHaveValue('four_corners');

    // Verify the pattern label updated
    await expect(page.locator('.pattern-current')).toContainText('4 Corners');
  });

  test('reset round clears played songs', async ({ page }) => {
    // Select the test game
    await page.selectOption('.game-selector select', { value: testGameFile });

    // Wait for song checklist
    await expect(page.locator('.song-checklist')).toBeVisible({ timeout: 10000 });

    // Mark a few songs as played
    const songRows = page.locator('.song-row');
    await songRows.nth(0).click();
    await songRows.nth(1).click();
    await songRows.nth(2).click();

    // Verify played count is 3
    await expect(page.locator('.stats .played-count')).toContainText('3');

    // Click Reset Round button
    // First find the reset button in GameControls
    const resetButton = page.locator('.reset-button');
    await expect(resetButton).toBeVisible();

    // Handle the confirmation dialog - Playwright auto-accepts by default
    // but we need to set up dialog handler
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('Reset');
      await dialog.accept();
    });

    await resetButton.click();

    // Verify played count is reset to 0
    await expect(page.locator('.stats .played-count')).toContainText('0');

    // Verify no songs have played class
    const playedSongs = page.locator('.song-row.played');
    await expect(playedSongs).toHaveCount(0);

    // Verify call board is cleared (no played songs)
    const callBoardSongs = page.locator('.call-board .song-item');
    await expect(callBoardSongs).toHaveCount(0);
  });

  test('search filters songs', async ({ page }) => {
    // Select the test game
    await page.selectOption('.game-selector select', { value: testGameFile });

    // Wait for song checklist
    await expect(page.locator('.song-checklist')).toBeVisible({ timeout: 10000 });

    // Get initial song count
    const initialCount = await page.locator('.song-row').count();
    expect(initialCount).toBeGreaterThan(10);

    // Type in search box
    await page.fill('.search-input', 'Nirvana');

    // Wait for filter to apply
    await page.waitForTimeout(100);

    // Verify fewer songs displayed
    const filteredCount = await page.locator('.song-row').count();
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBeGreaterThan(0);

    // All visible songs should contain "Nirvana" in artist
    const filteredSongs = page.locator('.song-row .song-artist');
    const count = await filteredSongs.count();
    for (let i = 0; i < count; i++) {
      const artist = await filteredSongs.nth(i).textContent();
      expect(artist.toLowerCase()).toContain('nirvana');
    }

    // Clear search
    await page.click('.clear-search');

    // Verify all songs visible again
    await expect(page.locator('.song-row')).toHaveCount(initialCount);
  });

  test('prep link navigation', async ({ page }) => {
    // Click Prep link in header
    await page.click('.prep-link');

    // Should navigate to prep view
    await expect(page).toHaveURL('/prep');
    await expect(page.locator('h1')).toContainText('Game Prep');
  });
});
