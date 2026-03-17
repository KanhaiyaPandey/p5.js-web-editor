import { test, expect } from '@playwright/test';
import { gotoApp, setEnglishLocale } from './utils';

test('editor loads correctly', async ({ page }) => {
  await setEnglishLocale(page);

  await gotoApp(page, '/');

  await expect(page.locator('.CodeMirror')).toBeVisible();
  await expect(page.locator('#play-sketch')).toBeVisible();
});
