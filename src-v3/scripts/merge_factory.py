"""Append clean, AI-repaired opencli-factory connectors (paperclip/data.json, servas.tariff.v1) to src/more.json.
Only repos listed in REPOS (gates green + hand-checked extractor); feed-in tariffs are skipped. Idempotent (dedupe by key)."""
import json, os, re
W = '/workspace'; P = W + '/tarife-at-repo/src-v3/more.json'
REPOS = {'opencli-eety-at': 'eety.at', 'opencli-kronemobile-at': 'kronemobile.at', 'opencli-oegig-at': 'oegig.at', 'opencli-auri-at': 'auri.at', 'opencli-x-powr-at': 'x-powr.at',
         'opencli-gutmann-cc': 'gutmann.cc', 'opencli-montana-energie-at': 'montana-energie.at', 'opencli-stadtwerke-bruck-at': 'stadtwerke-bruck.at',
         'opencli-stadtwerke-mz-at': 'stadtwerke-mz.at', 'opencli-wuesterstrom-at': 'wuesterstrom.at', 'opencli-esimple-at': 'esimple.at', 'opencli-web-energy': 'web.energy', 'opencli-europe-konnect-com': 'europe.konnect.com', 'opencli-redgas-at': 'redgas.at', 'opencli-s-budget-mobile-at': 's-budget-mobile.at', 'opencli-business-drei-at': 'business.drei.at', 'opencli-pullstrom-at': 'pullstrom.at', 'opencli-voltino-at': 'voltino.at', 'opencli-sturm-energie-at': 'sturm-energie.at', 'opencli-starlink-com': 'starlink.com', 'opencli-stadtbetriebe-at': 'stadtbetriebe.at', 'opencli-stadtwerke-leoben-at': 'stadtwerke-leoben.at', 'opencli-tigas-at': 'tigas.at', 'opencli-citycom-austria-com': 'citycom-austria.com', 'opencli-enstroga-at': 'enstroga.at', 'opencli-drei-energie-at': 'drei-energie.at', 'opencli-flexenergy-at': 'flexenergy.at', 'opencli-alpenhost-at': 'alpenhost.at'}
CAT = {'mobil': 'handy', 'internet': 'internet', 'strom': 'strom', 'gas': 'heizen', 'fernwaerme': 'heizen', 'heizung': 'heizen'}
norm = lambda s: re.sub(r'[^a-z0-9]', '', (s or '').lower())
M = json.load(open(P)); rows = M['rows']
seen = {(r['cat'], norm(r['anbieter']), norm(r['tarif']), r.get('preis'), r.get('ct')) for r in rows}
add = 0
for repo, dom in REPOS.items():
    f = f'{W}/factory-out/{repo}/paperclip/data.json'
    if not os.path.exists(f): continue
    for r in json.load(open(f))['records']:
        if r.get('typ') == 'einspeisetarif': continue
        cat = CAT.get(r.get('kategorie'), 'handy')
        if r.get('energie') == 'gas' or r.get('kategorie') == 'gas': cat = 'heizen'  # Gas-Tarife aus Strom/Gas-Connectoren -> Heizen-Tab (wie Burgenland Energie)
        if cat == 'internet' and r.get('segment') in ('gewerbe', 'business'): cat = 'business'
        if cat == 'strom' and r.get('segment') == 'gewerbe': continue  # Gewerbe-Strom gehört in Business-Strom (netto), nicht in den Privat-Vergleich
        a = r.get('isp') and f"{r['isp']} (öGIG)" or r.get('anbieter')
        o = {'cat': cat, 'anbieter': a, 'tarif': r['name'][:120], 'repo': repo, 'preis': r.get('preis_eur'), 'down': r.get('down_mbit'), 'up': r.get('up_mbit'),
             'daten': 'unlimitiert' if r.get('daten_unlimitiert') else (f"{r['daten_gb']:g} GB" if r.get('daten_gb') else None),
             'g5': bool(r.get('fuenf_g')), 'bindung': r.get('bindung_monate'), 'unl': bool(r.get('daten_unlimitiert')),
             'ct': r.get('ct_kwh'), 'gp': r.get('grundpreis_eur'), 'garantie': r.get('preisgarantie_monate'), 'oeko': bool(r.get('oeko')), 'fixip': bool(r.get('fixe_ip')), 'floating': r.get('typ') in ('floater', 'boersenpreis', 'spot'),
             'energie': 'strom' if cat == 'strom' else ('gas' if r.get('energie') == 'gas' else None), 'pdf': r.get('preisblatt_pdf'), 'link': r.get('isp_url') or r.get('url'), 'dom': dom}
        if cat in ('strom', 'heizen'): o['preis'] = None
        o = {k2: v for k2, v in o.items() if v not in (None, False, '')}
        k = (o['cat'], norm(o['anbieter']), norm(o['tarif']), o.get('preis'), o.get('ct'))
        if k in seen: continue
        seen.add(k); rows.append(o); add += 1
json.dump(M, open(P, 'w'), ensure_ascii=False, separators=(',', ':'))
import collections; print('added', add, collections.Counter(r['repo'] for r in rows if r['repo'] in REPOS), 'total', len(rows))
