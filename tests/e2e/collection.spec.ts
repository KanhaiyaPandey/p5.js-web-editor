import { test, expect } from '@playwright/test';
import {
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
  if (!match) throw new Error(`Unexpected sketch URL: ${url}`);
  return { username: match[1], projectId: match[2] };
}

test('collections: create → add sketch → remove sketch', async ({ page }) => {
  await setEnglishLocale(page);
  await login(page);

  // =====================================================
  // 1. CREATE SKETCH
  // =====================================================
  await openMenubarMenu(page, 'File');
  await page.locator('#file-new').click();

  await setEditorText(page, '// e2e collection test2\n');
  await saveSketch(page);

  const { username, projectId } = parseSavedSketchUrl(page.url());
  const sketchName = (await page.title()).replace(/^p5\.js Web Editor \| /, '');

  // =====================================================
  // 2. CREATE COLLECTION
  // =====================================================
  const collectionName = `e2e-${Date.now()}`;

  await gotoApp(page, `/${username}/collections`);

  await page
    .getByRole('button', { name: 'Create collection', exact: true })
    .click();

  const modal = page.getByRole('main', { name: 'modal' });

  await modal.locator('#name').fill(collectionName);

  await modal.locator('button[type="submit"]').click();

  // wait for modal close
  await expect(modal).toBeHidden();

  // wait for redirect
  await expect(page).toHaveURL(/\/collections\/.+/);

  const collectionId = page.url().split('/').pop() as string;

  await expect(page.locator('.collection-container')).toBeVisible();

  // =====================================================
  // 3. ADD SKETCH (REAL FLOW - COLLECTION PAGE)
  // =====================================================
  // Hide in-app Redux DevTools (it can cover the "Add Sketch" button in E2E)
  const devtoolsCommitBtn = page.getByRole('button', { name: 'Commit' });
  await page.keyboard.press('Control+h');
  await expect(devtoolsCommitBtn).toBeHidden({ timeout: 2000 });

  const addSketchBtn = page.getByRole('button', { name: /Add Sketch/i });

  await expect(addSketchBtn).toBeVisible();
  await expect(addSketchBtn).toBeEnabled();

  await addSketchBtn.scrollIntoViewIfNeeded();

  await addSketchBtn.click({ force: true });
  await page.waitForTimeout(200);

  // wait overlay (THIS IS KEY)
  const addModal = page
    .getByRole('main', { name: 'modal' })
    .filter({ has: page.getByRole('heading', { name: /Add Sketch/i }) });

  await expect(addModal).toBeVisible({ timeout: 15000 });

  // pick first available sketch (stable approach)
  const firstItem = addModal.locator('.quick-add__item').first();

  await expect(firstItem).toBeVisible();

  const toggleBtn = firstItem.locator('button.quick-add__item-toggle');

  await expect(toggleBtn).toBeVisible();

  await toggleBtn.click({ force: true });

  // verify state change (IMPORTANT)
  await expect(toggleBtn).toHaveAttribute(
    'aria-label',
    /Remove from collection/i
  );

  // close modal (wait properly)
  await page.keyboard.press('Escape');
  await expect(addModal).toBeHidden({ timeout: 15000 });

  // =====================================================
  // 4. VERIFY SKETCH ADDED (behavior-based)
  // =====================================================
  await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 });

  // at least 1 row should exist
  await expect(page.locator('table tbody tr')).toHaveCount(1);

  // =====================================================
  // 5. REMOVE SKETCH
  // =====================================================
  const removeBtn = page.getByLabel(/remove/i).first();

  page.once('dialog', (dialog) => dialog.accept());

  await removeBtn.click();

  // =====================================================
  // 6. VERIFY REMOVAL
  // =====================================================
  await expect(page.locator('table tbody tr')).toHaveCount(0, {
    timeout: 15000
  });
});
