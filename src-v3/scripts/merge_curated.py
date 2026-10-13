"""Kuratierter Merge für e2e-grüne opencli-factory-Connectoren mit gemischter Ausgabe (Tarife + Hardware/Add-ons/Fließtext).
Deterministische Filter je Repo: nur echte Tarife mit Preis + Bandbreite/Datenvolumen; Namen nur gekürzt (nie erfunden). Idempotent."""
import json, re, collections
W = '/workspace'; P = W + '/tarife-v3/src/more.json'
norm = lambda s: re.sub(r'[^a-z0-9]', '', (s or '').lower())
M = json.load(open(P)); rows = M['rows']
seen = {(r['cat'], norm(r['anbieter']), norm(r['tarif']), r.get('preis'), r.get('ct')) for r in rows}
def recs(repo): return json.load(open(f'{W}/factory-out/{repo}/paperclip/data.json'))['records']
out = []
# WVNET (wvnet.at): nur Internet-Produkte mit ↓/↑ (Router, Mesh, TV-Pakete, Mailboxen raus). Gleiche Namen = andere Gemeinde-Preise (pid in URL).
for r in recs('opencli-wvnet-at'):
    if not (r.get('preis_eur') and r.get('down_mbit') and r.get('up_mbit')): continue
    out.append({'cat': 'internet', 'anbieter': 'WVNET', 'tarif': r['name'], 'repo': 'opencli-wvnet-at', 'preis': r['preis_eur'], 'down': r['down_mbit'], 'up': r['up_mbit'],
                'netz': 'WVNET Glasfaser (Preis je Gemeinde)' if r['name'].startswith('LWL') else 'WVNET Breitband', 'link': r['url'], 'dom': 'wvnet.at'})
# KufNet (kufnet.at, Kufgem): nur KUFNET-Internettarife mit ↓/↑; Klammerzusatz "(8/1 Mbit/s - 14,90 EUR) ..." abgeschnitten.
for r in recs('opencli-kufnet-at'):
    if not (r.get('preis_eur') and r.get('down_mbit') and r.get('up_mbit') and r['name'].upper().startswith('KUFNET')): continue
    out.append({'cat': 'internet', 'anbieter': 'KufNet (Kufgem)', 'tarif': r['name'].split(' (')[0], 'repo': 'opencli-kufnet-at', 'preis': r['preis_eur'], 'down': r['down_mbit'], 'up': r['up_mbit'],
                'netz': 'KufNet Glasfaser (Kufstein)', 'link': r['url'], 'dom': 'kufnet.at'})
# Lycamobile + Mtel (e2e grün) bewusst NICHT gemergt: National L/XL/UL bzw. Home S sind bereits über tarife.at (assets/data.js) im Handy-Tab -> wären Dubletten.
add = collections.Counter()
for o in out:
    assert o['preis'] and 0 < o['preis'] < 600 and o['tarif'] and o['anbieter']
    k = (o['cat'], norm(o['anbieter']), norm(o['tarif']), o.get('preis'), o.get('ct'))
    if k in seen: continue
    seen.add(k); rows.append(o); add[(o['repo'], o['cat'])] += 1
json.dump(M, open(P, 'w'), ensure_ascii=False, separators=(',', ':'))
print('added', sum(add.values()), dict(add), 'total', len(rows))
