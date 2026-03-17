import { test, expect } from '@playwright/test';
import { gotoApp, setEditorText, setEnglishLocale } from './utils';

test('run sketch renders a canvas in preview', async ({ page }) => {
  await setEnglishLocale(page);

  await gotoApp(page, '/');

  const code = `function setup(){createCanvas(200,200);}
function draw(){background(200);}
`;

  await setEditorText(page, code);

  // run sketch
  await page.click('#play-sketch');

  // access nested iframe
  const preview = page
    .frameLocator('iframe[title="sketch preview"]')
    .frameLocator('iframe');

  // verify canvas renders
  await expect(preview.locator('canvas')).toBeVisible({ timeout: 30000 });
});
