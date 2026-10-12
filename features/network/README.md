# TarifeNetwork — Bandgasse 13

Modul für die Seite [tarife-at](https://martin-hausleitner.github.io/tarife-at/): Standort-Sektion **Bandgasse 13, 1070 Wien**.

## Inhalt

1. **Verfügbarkeit** — Magenta Kabel ✅ · A1 nur 5G Cube · Drei 5G ja / Festnetz nein · Wien Energie Glasfaser ❌  
2. **Netzkarten** — WebP-Screenshots aus `/workspace/screenshots/` (Lightbox)  
3. **Netz-Vergleich** — connect 2026 + nPerf 2026 + CHIP/NET CHECK (A1 / Magenta / Drei)  
4. **Empfehlungen** — Multi-IP & feste IPs als Karten mit Icons  

## Dateien

```
network/
  network.js      # mount/unmount API
  network.css     # Styles (Prefix tn-)
  README.md
  assets/*.webp   # Netzkarten & Provider-Logos
  demo/index.html # lokaler Smoke-Test
```

## Einbindung

```html
<link rel="stylesheet" href="features/network/network.css">
<section id="bandgasse"></section>
<script src="features/network/network.js"></script>
<script>
  TarifeNetwork.mount(document.getElementById('bandgasse'), {
    assetBase: 'features/network/assets/'
  });
</script>
```

### API

| Methode | Beschreibung |
|--------|----------------|
| `TarifeNetwork.mount(el, { assetBase })` | Rendert die Sektion in `el`. Default `assetBase`: `./assets/` |
| `TarifeNetwork.unmount(el)` | Entfernt Listener & Inhalt |
| `TarifeNetwork.DATA` | Rohdaten (nur Lesen) |

## Datenquellen (Stand 12.10.2026)

Nur diese Dateien — keine zusätzlichen Web-Fetches:

- `5g-vergleich-bandgasse13.md` — Verfügbarkeit, connect/nPerf, Business-Empfehlung  
- `multi-ip-architektur.md` — Multi-IP-Kosten & Architektur  
- `feste-ips-at.md` — Preise feste IPs AT  
- Screenshots unter `screenshots/` → konvertiert nach `assets/*.webp`

## Test

```bash
cd /workspace/tarife-features/network
python3 -m http.server 8765
# Browser: http://127.0.0.1:8765/demo/
```

Oder Node-Syntax-Check:

```bash
node --check network.js
```

## Hinweis

Modul **nicht** selbst pushen — Integration in `Martin-Hausleitner/tarife-at` übernimmt der Parent/Integrations-Agent.
