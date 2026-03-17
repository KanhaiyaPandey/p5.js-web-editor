import { test, expect } from '@playwright/test';
import {
  login,
  openMenubarMenu,
  saveSketch,
  setEditorText,
  setEnglishLocale
} from './utils';

test('save sketch shows saved confirmation', async ({ page }) => {
  await setEnglishLocale(page);
  await login(page);

  await openMenubarMenu(page, 'File');
  await page.locator('#file-new').click();

  await setEditorText(page, '// e2e save test\n');

  await saveSketch(page);
  await expect(page.locator('.editor__unsaved-changes')).toHaveCount(0);
});
