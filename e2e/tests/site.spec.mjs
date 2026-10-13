import { test, expect } from '@playwright/test'; import { execSync, spawn } from 'node:child_process'; import fs from 'node:fs';
const LIVE = 'https://martin-hausleitner.github.io/tarife-at/';
let srv; const LOCAL = 'http://127.0.0.1:4317/tarife-at/';
test.beforeAll(async () => {
  if (!process.env.SKIP_BUILD) execSync('npx vite build', { cwd: '/workspace/tarife-v3', stdio: 'pipe' });
  srv = spawn('npx', ['vite', 'preview', '--port', '4317', '--strictPort', '--host', '127.0.0.1'], { cwd: '/workspace/tarife-v3', stdio: 'ignore' }); await new Promise((r) => setTimeout(r, 4000));
});
test.afterAll(() => srv?.kill());
test('strom.json Datenvalidierung', async () => {
  const S = JSON.parse(fs.readFileSync('/workspace/tarife-v3/public/assets/strom.json')); expect(S.plz['1070'].netz).toContain('Wiener Netze');
  const T = S.plz['1070'].tarife; expect(T.length).toBeGreaterThan(50);
  for (const t of T.filter((t) => t.jahr1 > 0)) { const c = t.E[0] + t.E[1] * 3500 + t.N[0] + t.N[1] * 3500; expect(Math.abs(c - t.jahr1)).toBeLessThan(2); }
});
async function checkSite(page, url, shotPrefix) {
  const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && !/favicon|s2\/favicons|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto(url, { waitUntil: 'networkidle' });
  for (const [v, sel] of [['Handy', '.ag-row'], ['Internet/5G', '.ag-row'], ['Router', '.ag-row']]) { await page.getByRole('tab', { name: new RegExp('^' + v.replace('/', '\\/')) }).click(); await expect(page.locator(sel).first()).toBeVisible({ timeout: 20000 }); }
  await page.getByTestId('tab-strom').click(); await expect(page.getByTestId('strom-tab')).toBeVisible({ timeout: 20000 });
  await expect(page.getByTestId('strom-grid').locator('.ag-row').first()).toBeVisible();
  expect(Number(await page.getByTestId('strom-count').innerText())).toBeGreaterThan(50);
  await expect(page.getByTestId('chart-cum').locator('.recharts-line').first()).toBeVisible();
  await expect(page.getByTestId('chart-bar').locator('.recharts-bar-rectangle').first()).toBeVisible();
  await expect(page.getByTestId('breakeven')).toContainText('lohnt sich');
  if (shotPrefix) await page.screenshot({ path: `/workspace/screenshots/${shotPrefix}-strom.png`, fullPage: true });
  await page.getByTestId('kwh').fill('5000'); await page.getByTestId('plz').selectOption('8010'); await page.waitForTimeout(800);
  await expect(page.getByTestId('strom-tab')).toContainText('Energienetze Steiermark');
  await page.getByTestId('plz').selectOption('1070'); await page.getByTestId('kwh').fill('3500');
  for (const v of ['Rechner', 'Standort']) await page.getByRole('tab', { name: v }).click();
  expect(errs).toEqual([]);
}
test('lokaler Build: alle Tabs ohne JS-Fehler', async ({ page }) => checkSite(page, LOCAL, process.env.SHOT_LOCAL));
test('LIVE GitHub Pages: alle Tabs ohne JS-Fehler', async ({ page }) => { test.skip(!process.env.LIVE, 'LIVE=1 setzen'); await checkSite(page, LIVE + '?v=' + Date.now(), 'v4'); });
