import { test, expect } from '@playwright/test';
import {
  gotoApp,
  openMenubarMenu,
  setEditorText,
  setEnglishLocale
} from './utils';

test('create new sketch loads editable editor', async ({ page }) => {
  await setEnglishLocale(page);

  await gotoApp(page, '/');

  // Use the menubar action to create a new sketch.
  await openMenubarMenu(page, 'File');
  await page.locator('#file-new').click();

  await expect(page.locator('.CodeMirror')).toBeVisible();

  // Prove editability by typing and seeing the unsaved indicator appear.
  await setEditorText(page, '// e2e edit\n');

  await expect(page.locator('.editor__unsaved-changes')).toBeVisible({
    timeout: 5000
  });
});
