import fs from 'fs';
const raw = JSON.parse(fs.readFileSync('ec-raw.json')); const out = { stand: new Date().toISOString().slice(0, 10), quelle: 'E-Control Tarifkalkulator (www.e-control.at/tarifkalkulator)', plz: {} };
const lin = (a, b) => { const v = (b - a) / 1000; return [+(a - 2500 * v).toFixed(3), +v.toFixed(6)]; }; // [fix €/Jahr, €/kWh]
for (const [plz, P] of Object.entries(raw)) {
  if (!P[2500] || !P[3500]) continue; const m = new Map(P[2500].map((r) => [r.produkt_id, r])); const rows = [];
  for (const b of P[3500]) { const a = m.get(b.produkt_id); if (!a) continue;
    const tax = b.energie_eur_jahr_brutto && b.rabatt_eur_netto != null ? 1.2 : 1.2;
    const dom = (() => { try { return new URL(b.link).hostname.replace(/^www\./, ''); } catch { return null; } })();
    rows.push({ id: b.produkt_id, anbieter: b.anbieter, lieferant: b.lieferant, tarif: b.tarif, ap: b.arbeitspreis_ct_brutto, apN: b.arbeitspreis_ct_netto, gp: b.grundpreis_eur_monat_brutto,
      jahr1: b.gesamt_eur_jahr_brutto, energie1: b.energie_eur_jahr_brutto, netz: b.netz_eur_jahr_brutto, rabatt: b.rabatt_eur_netto ? +(b.rabatt_eur_netto * tax).toFixed(2) : 0,
      rabatte: (b.rabatte || []).filter((r) => r.enthalten).map((r) => r.name),
      E: lin(a.energie_eur_jahr_brutto, b.energie_eur_jahr_brutto), N: lin(a.netz_eur_jahr_brutto, b.netz_eur_jahr_brutto), R: lin((a.rabatt_eur_netto || 0) * tax, (b.rabatt_eur_netto || 0) * tax),
      oeko: b.oeko_prozent, at: b.herkunft_at, garantie: b.preisgarantie, garantieM: b.preisgarantie_monate, garantieBis: b.preisgarantie_bis, ohneBindung: b.ohne_mindestbindung, floating: !!b.floating || b.preisgarantie === 'NONE',
      eig: b.eigenschaften, link: b.link, domain: dom }); }
  out.plz[plz] = { ort: P.ort, netz: P.netz, tarife: rows };
}
try { const aw = JSON.parse(fs.readFileSync('/workspace/opencli-awattar-at/exports/marktpreise.json')); const v = aw.rows.map((r) => r.ct_kwh_netto); out.spot = { avg_ct_netto: +(v.reduce((s, x) => s + x, 0) / v.length).toFixed(2), min: Math.min(...v), max: Math.max(...v), stunden: v.length, quelle: 'api.awattar.at (EPEX Day-Ahead AT)', bis: aw.rows.at(-1).ende }; } catch {}
fs.writeFileSync('/workspace/tarife-v3/public/assets/strom.json', JSON.stringify(out));
console.log(Object.entries(out.plz).map(([k, v]) => k + ':' + v.tarife.length).join(' '), fs.statSync('/workspace/tarife-v3/public/assets/strom.json').size, out.spot);
const w = out.plz[1070].tarife.sort((a, b) => a.jahr1 - b.jahr1).slice(0, 3); console.log(w);
