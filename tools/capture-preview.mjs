import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const cache = join(process.env.LOCALAPPDATA || '', 'ms-playwright');
const cachedBrowser = existsSync(cache)
  ? readdirSync(cache).filter(name => /^chromium-\d+$/.test(name))
    .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))
    .map(name => join(cache, name, 'chrome-win64', 'chrome.exe')).find(existsSync)
  : undefined;
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || cachedBrowser,
});
const baseURL = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:3000';
const screenshotOptions = { animations: 'disabled', style: 'nextjs-portal { visibility: hidden !important; }' };
mkdirSync('docs/previews', { recursive: true });

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('h1').waitFor();
  await page.screenshot({ path: 'docs/previews/home-desktop.png', ...screenshotOptions });
  await page.goto(`${baseURL}/admin`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('heading', { name: 'Overview', exact: true }).waitFor();
  await page.screenshot({ path: 'docs/previews/admin-desktop.png', ...screenshotOptions, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'docs/previews/home-mobile.png', ...screenshotOptions });
  console.log('Saved desktop homepage, admin dashboard and mobile homepage previews to docs/previews/.');
} finally {
  await browser.close();
}
