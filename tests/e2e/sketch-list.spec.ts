import { test, expect } from '@playwright/test';
import {
  getToast,
  gotoApp,
  login,
  openMenubarMenu,
  saveSketch,
  setEditorText,
  setEnglishLocale
} from './utils';

test.use({ storageState: undefined });

function parseSavedSketchUrl(url: string) {
  const match = url.match(/\/([^/]+)\/sketches\/([^/]+)$/);
  if (!match) {
    throw new Error(`Unexpected sketch URL: ${url}`);
  }
  return { username: match[1], projectId: match[2] };
}

test('sketch list navigation opens a sketch in the editor', async ({
  page
}) => {
  await setEnglishLocale(page);
  await login(page);

  // Ensure at least one sketch exists for navigation.
  await openMenubarMenu(page, 'File');
  await page.locator('#file-new').click();
  await setEditorText(page, '// e2e sketch list seed\n');
  await saveSketch(page);
  await expect(getToast(page)).toContainText(
    /(Sketch saved|Opened new sketch)/,
    {
      timeout: 15000
    }
  );

  const { projectId } = parseSavedSketchUrl(page.url());

  await gotoApp(page, '/sketches');
  await expect(page.locator('table.sketches-table')).toBeVisible({
    timeout: 30000
  });

  const createdSketchLink = page
    .locator(`table.sketches-table a[href$="/sketches/${projectId}"]`)
    .first();
  await expect(createdSketchLink).toBeVisible({ timeout: 15000 });
  await createdSketchLink.click();

  await expect(page.locator('.CodeMirror')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('#play-sketch')).toBeVisible();
});
