import { rate } from '/workspace/opencli-e-control-at/lib/site.js'; import fs from 'fs';
const PLZ = { 1070: 'Wien', 3100: 'St. Pölten', 7000: 'Eisenstadt', 4020: 'Linz', 5020: 'Salzburg', 6020: 'Innsbruck', 6900: 'Bregenz', 8010: 'Graz', 9020: 'Klagenfurt' };
const out = {};
for (const [plz, ort] of Object.entries(PLZ)) { out[plz] = { ort };
  for (const kwh of [2500, 3500]) { try { const r = await rate({ plz, kwh }); out[plz].netz = r.netz; out[plz][kwh] = r.rows; console.log(plz, kwh, r.rows.length); } catch (e) { console.log(plz, kwh, 'ERR', e.message); } } }
fs.writeFileSync('/workspace/strom-data/ec-raw.json', JSON.stringify(out));
