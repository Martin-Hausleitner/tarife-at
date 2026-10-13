import { test, expect } from '@playwright/test'; import { execFileSync } from 'node:child_process'; import fs from 'node:fs';
const run = (repo, cmd, extra = []) => { const out = `/tmp/e2e-${repo}-${cmd}.json`; execFileSync('node', [`/workspace/opencli-${repo}/bin/${repo}-cli.js`, cmd, '--out', out, ...extra], { stdio: 'pipe', timeout: 200000 }); return JSON.parse(fs.readFileSync(out)); };
test('e-control-at strom 1070/3500: viele Tarife, plausible Preise', async () => {
  const d = run('e-control-at', 'strom', ['--plz', '1070', '--kwh', '3500']); expect(d.count).toBeGreaterThan(50);
  const priced = d.rows.filter((r) => r.gesamt_eur_jahr_brutto > 0); expect(priced.length).toBeGreaterThan(40);
  for (const r of priced) { expect(r.netzbetreiber).toContain('Wiener Netze'); expect(r.arbeitspreis_ct_brutto).toBeGreaterThan(0); expect(r.arbeitspreis_ct_brutto).toBeLessThan(80);
    expect(Math.abs(r.energie_eur_jahr_brutto + r.netz_eur_jahr_brutto - r.gesamt_eur_jahr_brutto)).toBeLessThan(1.5); }
  for (const n of ['Wien Energie', 'VERBUND']) expect(d.rows.some((r) => r.anbieter === n)).toBeTruthy();
});
test('e-control-at netzbetreiber 1070', async () => { const d = run('e-control-at', 'netzbetreiber'); expect(d.rows[0].netzbetreiber).toBe('Wiener Netze GmbH'); });
for (const repo of ['wienenergie-at', 'evn-at', 'energieag-at', 'verbund-com', 'awattar-at'])
  test(`${repo} strom: Seiten erreichbar, mind. ein Arbeitspreis`, async () => { const d = run(repo, 'strom'); expect(d.count).toBeGreaterThan(0); expect(d.rows.filter((r) => r.fehler).length).toBe(0); expect(d.rows.some((r) => r.arbeitspreis_ct > 0)).toBeTruthy(); });
test('wienenergie-at internet: SuperSchnell symmetrisch', async () => { const d = run('wienenergie-at', 'internet'); expect(d.count).toBeGreaterThanOrEqual(3); for (const r of d.rows) { expect(r.symmetrisch).toBe(true); expect(r.preis_regulaer_eur).toBeGreaterThan(0); } });
test('awattar-at marktpreise: Stundenwerte', async () => { const d = run('awattar-at', 'marktpreise'); expect(d.count).toBeGreaterThan(10); for (const r of d.rows) expect(Number.isFinite(r.ct_kwh_netto)).toBeTruthy(); });
for (const repo of ['durchblicker-at', 'check24-at']) test(`${repo} links (ToS: kein Scraping)`, async () => { const d = run(repo, 'links'); expect(d.rows.some((r) => r.kategorie === 'strom')).toBeTruthy(); });
