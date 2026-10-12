/**
 * TarifeNetwork — Bandgasse 13, 1070 Wien
 * Datenquellen (Stand 12.10.2026):
 *  - /workspace/5g-vergleich-bandgasse13.md
 *  - /workspace/multi-ip-architektur.md
 *  - /workspace/feste-ips-at.md
 *  - Screenshots in assets/ (aus /workspace/screenshots/, WebP)
 *
 * API:
 *   TarifeNetwork.mount(el, { assetBase?: string })
 *   TarifeNetwork.unmount(el)
 */
(function (global) {
  'use strict';

  const DATA = {
    address: 'Bandgasse 13, 1070 Wien',
    stand: '12.10.2026',
    availability: [
      {
        id: 'magenta-cable',
        brand: 'Magenta',
        title: 'Magenta Kabel (DOCSIS)',
        status: 'ok',
        statusLabel: 'verfügbar',
        detail: 'bis 2000/200 Mbit/s (Business Cable)',
        note: 'Adresscheck: Magenta Kabel bis Business 2000/200. In der Verfügbarkeitsprüfung auch als 2000/100 genannt — Spitze laut Tarifblatt Business Cable 2000/200.',
        logo: 'magenta.webp',
        pill: 'magenta',
      },
      {
        id: 'a1-cube',
        brand: 'A1',
        title: 'A1 5G Cube',
        status: 'partial',
        statusLabel: 'nur 5G Cube',
        detail: 'bis 500/70 Mbit/s (Business Cube 500)',
        note: 'Kein Festnetz-/Kabelanschluss an der Adresse — nur mobiles Cube-Internet.',
        logo: 'a1.webp',
        pill: 'a1',
      },
      {
        id: 'drei-5g',
        brand: 'Drei',
        title: 'Drei 5G',
        status: 'ok',
        statusLabel: '5G ja',
        detail: 'bis 500/100 Mbit/s · Festnetz nein',
        note: '5G verfügbar; Drei Office Connect / Festnetz an der Adresse nicht verfügbar.',
        logo: 'drei.webp',
        pill: 'drei',
      },
      {
        id: 'wienenergie',
        brand: 'Wien Energie',
        title: 'Wien Energie Glasfaser',
        status: 'no',
        statusLabel: 'nicht verfügbar',
        detail: 'Glasfaser / VDSL an der Adresse ❌',
        note: 'Kein Glasfaser-Anschluss (Wien Energie / allgemein VDSL+Fiber) laut Adress-Check.',
        logo: 'wienenergie.webp',
        pill: 'we',
      },
    ],
    maps: [
      {
        src: 'a1_netzabdeckung_bandgasse13.webp',
        caption: 'A1 Netzkarte — Bandgasse 13',
        brand: 'A1',
      },
      {
        src: 'magenta_netzabdeckung_bandgasse13_5G.webp',
        caption: 'Magenta 5G — Bandgasse 13',
        brand: 'Magenta',
      },
      {
        src: 'drei_netzabdeckung_bandgasse13_5G_layer.webp',
        caption: 'Drei 5G-Layer — Bandgasse 13',
        brand: 'Drei',
      },
      {
        src: 'drei_netzabdeckung_bandgasse13_4G_layer.webp',
        caption: 'Drei 4G-Layer — Bandgasse 13',
        brand: 'Drei',
      },
      {
        src: 'rtr_netztest_karte_wien_bandgasse_area.webp',
        caption: 'RTR-Netztest Karte — Wien / Bandgasse-Umgebung',
        brand: 'RTR',
        wide: true,
      },
    ],
    // connect Netztest 2026 + nPerf Barometer 2026 (5g-vergleich-bandgasse13.md §4)
    compare: {
      sourceNote:
        'connect Netztest 2026 · nPerf Barometer 2026 · CHIP/NET CHECK — Werte aus 5g-vergleich-bandgasse13.md',
      rows: [
        {
          metric: 'connect Gesamtpunkte 2026',
          values: [
            { net: 'Magenta', value: 976, rank: 1, bar: 100 },
            { net: 'A1', value: 954, rank: 2, bar: 97.7 },
            { net: 'Drei', value: 929, rank: 3, bar: 95.2 },
          ],
          note: 'Magenta führt in den Städten bei Daten und Latenz',
        },
        {
          metric: 'connect Anteil RTT < 20 ms',
          values: [
            { net: 'Magenta', value: '~60 %', rank: 1, bar: 100 },
            { net: 'Drei', value: '~48 %', rank: 2, bar: 80 },
            { net: 'A1', value: '~8 %', rank: 3, bar: 13 },
          ],
          note: '„Highend-Gaming“ — A1 fällt bei Latenz deutlich zurück',
        },
        {
          metric: 'nPerf Ø-Latenz 2026 (AT)',
          values: [
            { net: 'Drei', value: '24,9 ms', rank: 1, bar: 100 },
            { net: 'Magenta', value: '25,3 ms', rank: 2, bar: 98 },
            { net: 'A1', value: '27,6 ms', rank: 3, bar: 90 },
          ],
          note: 'Crowd-Daten, österreichweit',
        },
        {
          metric: 'CHIP/NET CHECK 5G-Verfügbarkeit',
          values: [
            { net: 'Drei', value: '1,06', rank: 1, bar: 100 },
            { net: 'Magenta', value: '1,10', rank: 2, bar: 96 },
            { net: 'A1', value: '1,16', rank: 3, bar: 91 },
          ],
          note: 'Note — kleiner = besser',
        },
      ],
    },
    // Empfehlungen aus multi-ip-architektur.md + feste-ips-at.md
    recommendations: [
      {
        rank: 1,
        icon: 'cable',
        title: 'Hauptleitung: Magenta Business Cable 2000/200',
        price: '189,90 € netto',
        tags: ['feste IP inkl.', 'SLA Medium', 'beste Latenz 5–15 ms'],
        points: [
          'Routing-Option /28 (16 IPs, 13 nutzbar) zusätzlich anfragen — Preis nicht im EBLB.',
          'Öffentliche Festnetz-IP, eigene NAT-Tabelle — ideal für viele parallele Agenten-Sessions.',
          'An der Adresse verfügbar (Adresscheck).',
        ],
        tone: '1',
      },
      {
        rank: 2,
        icon: 'sim',
        title: 'Mehr IPs: Magenta Corporate Mobile 5G + /28',
        price: '~5,50 € / IP',
        tags: ['13 IPs / SIM', '/28 = 16 €', 'SIM Only 5G 500: 55,19 €'],
        points: [
          '1–4× Corporate Mobile SIM Only 5G 500 + Routingservice 16 IPs → 13 feste IPs pro SIM (~71 €).',
          'Preise aus EBLB Jänner 2024 — aktuelles Angebot anfordern.',
          'OPNsense/MikroTik: 1:1 Outbound-NAT pro Agent → sticky Sessions.',
        ],
        tone: '2',
      },
      {
        rank: 3,
        icon: 'layers',
        title: 'Zweitnetz (andere ASN): Drei Business 5G oder A1 Cube',
        price: 'A1 Cube 500: 92,90 €',
        tags: ['Redundanz', 'A1 Static IP gratis', 'Drei IP ❓'],
        points: [
          'Drei Business Boost! 5G 500: bestes 5G SA, eigenes ASN ≠ Magenta-Kabel — feste IP anfragen.',
          'Alternative: A1 Business Cube 500 mit Mobile Static IP gratis (Latenz schwächer).',
          'Magenta Business 5G 600 (60 €, feste IP) teilt Betreiber-/Störungsrisiko mit dem Kabel → nur Backup-Zweitwahl.',
        ],
        tone: '',
      },
      {
        rank: 4,
        icon: 'server',
        title: 'Skalierung > 26 IPs: netcup Wien + WireGuard',
        price: '1,68 € / IP',
        tags: ['Datacenter-ASN', 'VIE < 5 ms', 'nur wo DC-IPs ok'],
        points: [
          'netcup VIE Zusatz-IPv4: 2,00 € brutto/Monat, 5 € Setup, 12 Monate Mindestlaufzeit.',
          'Für APIs/eigene Systeme, bei denen Hosting-ASNs akzeptiert sind.',
          'Viele private 5G-SIMs (~40–48 €/IP) lohnen sich nicht — CGNAT, dynamisch, teuer.',
        ],
        tone: '',
      },
      {
        rank: 0,
        icon: 'shield',
        title: 'Feste IPs — Kurzüberblick (AT)',
        price: null,
        tags: ['Magenta /28: 16 €', 'A1 Static: 4,90 €', 'A1 Cube: 0 €'],
        points: [
          'Viele IPs am günstigsten: Magenta Corporate Mobile /28 (13 nutzbar) um 16 € + Grundtarif.',
          'Verschiedene Netze: A1 Cube (IP gratis) / A1 Static 4,90 € · Magenta · Drei (Hotline, Preis offen).',
          'Nur drei echte ASNs in AT — Diskonter fahren auf A1/Magenta/Drei mit.',
        ],
        tone: '',
      },
    ],
  };

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  function icon(name) {
    const paths = {
      pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
      check: '<path d="M20 6 9 17l-5-5"/>',
      x: '<path d="M18 6 6 18M6 6l12 12"/>',
      alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
      map: '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.382V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15M9 3.236v15"/>',
      signal: '<path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/>',
      cable: '<path d="M17 21v-2a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1"/><path d="M19 15V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V9"/><path d="M21 21v-2h-4"/><path d="M3 5h4V3"/><path d="M7 5a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1V3"/>',
      sim: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h.01M7 12h.01M7 17h.01M12 7h5M12 12h5M12 17h5"/>',
      layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 12.67-8.58 3.9a2 2 0 0 1-1.66 0L2.6 12.67"/><path d="m22 17.67-8.58 3.9a2 2 0 0 1-1.66 0L2.6 17.67"/>',
      server: '<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><path d="M6 6h.01M6 18h.01"/>',
      shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
      trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
      info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    };
    return `<svg class="tn-ico" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.info}</svg>`;
  }

  function statusClass(s) {
    if (s === 'ok') return 'tn-status-ok';
    if (s === 'partial') return 'tn-status-partial';
    return 'tn-status-no';
  }
  function statusIcon(s) {
    if (s === 'ok') return icon('check');
    if (s === 'partial') return icon('alert');
    return icon('x');
  }
  function netPill(net) {
    const k = String(net).toLowerCase();
    if (k === 'a1') return 'tn-pill-a1';
    if (k === 'magenta') return 'tn-pill-magenta';
    if (k === 'drei') return 'tn-pill-drei';
    return '';
  }
  function brandLogo(item, base) {
    if (!item.logo) return '';
    return `<img src="${esc(base + item.logo)}" alt="${esc(item.brand)}" loading="lazy" width="36" height="26">`;
  }

  function renderAvailability(base) {
    return DATA.availability
      .map(
        (a) => `
      <article class="tn-card" data-id="${esc(a.id)}">
        <div class="tn-brand">
          ${brandLogo(a, base)}
          <span class="tn-pill ${esc('tn-pill-' + a.pill)}">${esc(a.brand)}</span>
          <span class="tn-status ${statusClass(a.status)}">${statusIcon(a.status)} ${esc(a.statusLabel)}</span>
        </div>
        <h3>${esc(a.title)}</h3>
        <p class="tn-detail"><strong>${esc(a.detail)}</strong></p>
        <p>${esc(a.note)}</p>
      </article>`
      )
      .join('');
  }

  function renderMaps(base) {
    return DATA.maps
      .map(
        (m) => `
      <figure class="tn-map${m.wide ? ' tn-map-wide' : ''}">
        <img src="${esc(base + m.src)}" alt="${esc(m.caption)}" loading="lazy"
             data-full="${esc(base + m.src)}" class="tn-map-img">
        <figcaption>
          <span>${icon('map')} ${esc(m.caption)}</span>
          <span class="tn-pill ${netPill(m.brand) || 'tn-pill-drei'}">${esc(m.brand)}</span>
        </figcaption>
      </figure>`
      )
      .join('');
  }

  function renderCompare() {
    const headNets = ['Magenta', 'A1', 'Drei'];
    const body = DATA.compare.rows
      .map((row) => {
        const byNet = Object.fromEntries(row.values.map((v) => [v.net, v]));
        const cells = headNets
          .map((n) => {
            const v = byNet[n];
            if (!v) return '<td>—</td>';
            return `<td class="tn-num">
              <span class="tn-rank tn-rank-${v.rank}">${v.rank}</span>${esc(String(v.value))}
              <div class="tn-bar"><i style="width:${Number(v.bar) || 0}%"></i></div>
            </td>`;
          })
          .join('');
        return `<tr>
          <td><strong>${esc(row.metric)}</strong><div class="tn-muted" style="margin:0;font-size:.75rem">${esc(row.note || '')}</div></td>
          ${cells}
        </tr>`;
      })
      .join('');

    return `
      <div class="tn-table-wrap">
        <table class="tn-table">
          <thead>
            <tr>
              <th>Messung</th>
              <th><span class="tn-pill tn-pill-magenta">Magenta</span></th>
              <th><span class="tn-pill tn-pill-a1">A1</span></th>
              <th><span class="tn-pill tn-pill-drei">Drei</span></th>
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>
      <p class="tn-footnote">${icon('info')} ${esc(DATA.compare.sourceNote)}.
        Typische Kabel-Latenz (DOCSIS): ca. 10–20 ms · 5G Home: 10–30 ms mit höherem Jitter.
        Standortgenaue Indoor-Messung an Top 5: vor Ort mit RTR-Netztest.</p>`;
  }

  function renderRecs() {
    return DATA.recommendations
      .map((r) => {
        const tone = r.tone ? ` tn-rec-${r.tone}` : r.rank === 0 ? ' tn-rec-warn' : '';
        const badge =
          r.rank > 0
            ? `<span class="tn-badge" style="background:rgba(108,140,255,.15);color:var(--tn-ac);border-color:var(--tn-ln)">#${r.rank}</span>`
            : `<span class="tn-badge" style="background:rgba(225,112,85,.12);color:var(--tn-bad);border-color:var(--tn-ln)">Fazit</span>`;
        return `
        <article class="tn-rec${tone}">
          <div class="tn-rec-top">
            <h3>${icon(r.icon)} ${esc(r.title)}</h3>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.25rem">
              ${badge}
              ${r.price ? `<div class="tn-price">${esc(r.price)}</div>` : ''}
            </div>
          </div>
          <div class="tn-tags">${r.tags.map((t) => `<span class="tn-tag">${esc(t)}</span>`).join('')}</div>
          <ul>${r.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
        </article>`;
      })
      .join('');
  }

  function html(assetBase) {
    const base = assetBase.endsWith('/') ? assetBase : assetBase + '/';
    return `
    <div class="tn-wrap">
      <header class="tn-hero">
        <p class="tn-hero-kicker">Standort-Check · servas.ai</p>
        <h2>${icon('pin')} ${esc(DATA.address)}
          <span class="tn-badge">Stand ${esc(DATA.stand)}</span>
        </h2>
        <p>Verfügbarkeit, Netzkarten, connect/nPerf-Vergleich und Multi-IP-Empfehlungen für viele parallele Browser-Agenten — nur aus den recherchierten Quelldokumenten.</p>
      </header>

      <section class="tn-section" aria-labelledby="tn-av-title">
        <h3 class="tn-section-title" id="tn-av-title">${icon('signal')} Verfügbarkeit an der Adresse</h3>
        <p class="tn-muted">Ergebnis der Adress-Checks (Magenta, A1, Drei, Wien Energie).</p>
        <div class="tn-grid tn-grid-4">${renderAvailability(base)}</div>
      </section>

      <section class="tn-section" aria-labelledby="tn-map-title">
        <h3 class="tn-section-title" id="tn-map-title">${icon('map')} Netzkarten-Screenshots</h3>
        <p class="tn-muted">Klick vergrößert. Quellen: a1.net/netzabdeckung, magenta.at/5g, drei.at/netzabdeckung, netztest.at.</p>
        <div class="tn-maps">${renderMaps(base)}</div>
      </section>

      <section class="tn-section" aria-labelledby="tn-cmp-title">
        <h3 class="tn-section-title" id="tn-cmp-title">${icon('trophy')} Netz-Vergleich A1 · Magenta · Drei</h3>
        <p class="tn-muted">connect-Punkte, Latenz-Anteil &lt; 20 ms und nPerf Ø-Latenz (österreichweit).</p>
        ${renderCompare()}
      </section>

      <section class="tn-section" aria-labelledby="tn-rec-title">
        <h3 class="tn-section-title" id="tn-rec-title">${icon('layers')} Empfehlungen Multi-IP &amp; feste IPs</h3>
        <p class="tn-muted">Aus multi-ip-architektur.md und feste-ips-at.md — Preise netto, sofern angegeben.</p>
        <div class="tn-grid tn-grid-2">${renderRecs()}</div>
        <p class="tn-footnote">${icon('shield')} Nur für legitime Automatisierung (eigene Konten/Daten). Mehrere IPs dienen Lastverteilung und Ausfallsicherheit — nicht dem Umgehen von Anti-Bot-Schutz.</p>
      </section>
    </div>
    <div class="tn-lb" role="dialog" aria-modal="true" aria-label="Netzkarte vergrößert" hidden>
      <button type="button" aria-label="Schließen">×</button>
      <img alt="">
    </div>`;
  }

  function bindLightbox(root) {
    const lb = root.querySelector('.tn-lb');
    if (!lb) return;
    const img = lb.querySelector('img');
    const closeBtn = lb.querySelector('button');
    const open = (src, alt) => {
      img.src = src;
      img.alt = alt || '';
      lb.hidden = false;
      lb.classList.add('on');
    };
    const close = () => {
      lb.classList.remove('on');
      lb.hidden = true;
      img.removeAttribute('src');
    };
    root.querySelectorAll('.tn-map-img').forEach((el) => {
      el.addEventListener('click', () => open(el.dataset.full || el.src, el.alt));
    });
    closeBtn.addEventListener('click', close);
    lb.addEventListener('click', (e) => {
      if (e.target === lb) close();
    });
    root._tnKeyHandler = (e) => {
      if (e.key === 'Escape' && lb.classList.contains('on')) close();
    };
    if (typeof document !== 'undefined') document.addEventListener('keydown', root._tnKeyHandler);
  }

  function mount(el, opts) {
    if (!el) throw new Error('TarifeNetwork.mount: element required');
    const options = opts || {};
    const assetBase = options.assetBase != null ? options.assetBase : './assets/';
    el.classList.add('tn-root');
    el.innerHTML = html(assetBase);
    bindLightbox(el);
    el.dataset.tnMounted = '1';
    return el;
  }

  function unmount(el) {
    if (!el) return;
    if (el._tnKeyHandler && typeof document !== 'undefined') document.removeEventListener('keydown', el._tnKeyHandler);
    el.innerHTML = '';
    el.classList.remove('tn-root');
    delete el.dataset.tnMounted;
  }

  const api = { mount, unmount, DATA };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.TarifeNetwork = api;
})(typeof window !== 'undefined' ? window : globalThis);
