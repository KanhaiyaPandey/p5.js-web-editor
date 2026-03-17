/* eslint-disable arrow-body-style */
/* eslint-disable no-await-in-loop */
import type { Page } from '@playwright/test';

export function setEnglishLocale(page: Page) {
  return page.addInitScript(() => {
    window.localStorage.setItem('i18nextLng', 'en-US');
    document.cookie = 'p5-cookie-consent=essential; path=/';
  });
}

async function waitForReactRoot(page: Page) {
  await page.waitForFunction(() => {
    const root = document.getElementById('root');
    if (!root) return false;
    return (
      root.childElementCount > 0 || (root.textContent || '').trim().length > 0
    );
  });
}

export async function gotoApp(page: Page, path: string) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await waitForReactRoot(page);
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(500);
    }
  }

  throw lastError;
}

export async function openMenubarMenu(page: Page, menuName: string) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await waitForReactRoot(page);
      await page.locator('#play-sketch').waitFor({ state: 'visible' });
      const trigger = page.getByRole('menuitem', {
        name: menuName,
        exact: true
      });

      // Click can be flaky with this custom menubar; add a keyboard fallback that
      // reliably opens the submenu and focuses the first item.
      await trigger.click();
      await page.keyboard.press('ArrowDown');

      const menu = page.getByRole('menu', { name: `${menuName} menu` });
      await menu.waitFor({ state: 'visible' });
      return menu;
    } catch (error) {
      lastError = error;
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
    }
  }

  throw lastError;
}

export async function setEditorText(page: Page, value: string) {
  await page.locator('.CodeMirror').waitFor({ state: 'visible' });
  await page.locator('.CodeMirror').evaluate((node, nextValue) => {
    const editor = (node as HTMLElement & {
      CodeMirror?: { setValue: (value: string) => void; focus: () => void };
    }).CodeMirror;

    if (!editor) {
      throw new Error('CodeMirror instance not found');
    }

    editor.setValue(nextValue);
    editor.focus();
  }, value);
}

export function getToast(page: Page) {
  return page.locator('.toast[role="status"]');
}

export async function saveSketch(page: Page) {
  await openMenubarMenu(page, 'File');
  await page.locator('#file-save').click();
  await page.waitForURL(/\/[^/]+\/sketches\/[^/]+$/, {
    timeout: 15000,
    waitUntil: 'domcontentloaded'
  });
}

export async function login(page: Page) {
  const email =
    process.env.E2E_USER_EMAIL ||
    process.env.EXAMPLE_USER_EMAIL ||
    'examples@p5js.org';
  const password =
    process.env.E2E_USER_PASSWORD ||
    process.env.EXAMPLE_USER_PASSWORD ||
    'hellop5js';

  await gotoApp(page, '/login');
  await page.waitForFunction(() => {
    return (
      window.location.pathname !== '/login' ||
      !!document.querySelector('#email')
    );
  });

  if (new URL(page.url()).pathname.endsWith('/login')) {
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: 'Log In' }).click();
  }

  // IDE route is protected; successful login will allow it to load.
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), {
    waitUntil: 'domcontentloaded'
  });
  await page.locator('.CodeMirror').waitFor({ state: 'visible' });
}

export function getModifierKey() {
  return process.platform === 'darwin' ? 'Meta' : 'Control';
}
