/**
 * TarifeCalc – Kostenrechner, Preis-Leistungs-Index, Aufpreis-Leiter
 * Modul für https://martin-hausleitner.github.io/tarife-at/
 *
 * Datenquellen (nichts erfunden):
 *  - /workspace/tarife-at-repo/assets/data.json  (Tarife + Router)
 *  - /workspace/5g-vergleich-bandgasse13.md      (Latenz connect/nPerf)
 *  - /workspace/multi-5g-ip-kostenmodell.md      (P/L-Index, Aufpreis, Szenarien)
 *  - /workspace/feste-ips-at.md                  (feste-IP-Scores)
 *
 * API:
 *   TarifeCalc.mount(containerEl, { data, dataUrl? })
 *   TarifeCalc.computePlIndex(tarifLike)
 *   TarifeCalc.USt = 0.20
 */
(function (global) {
  'use strict';

  const USt = 0.20;
  const AMORT_MONATE = 24;

  /** Latenz-Score 0–100 aus multi-5g-ip-kostenmodell.md §4 */
  const LATENZ_SCORE = {
    Kabel: 95,
    Magenta: 80,
    Drei: 75,
    A1: 55,
    spusu: 70, // Drei-Netz, niedrigere Priorität
  };

  /** IP-Score aus multi-5g-ip-kostenmodell.md §4 */
  const IP_SCORE = {
    fest: 90,
    cgnat: 50,
  };

  /**
   * Referenz €/Mbit Down aus Magenta Business Cable 2000 (189,90 € / 2000 Mbit)
   * multi-5g-ip-kostenmodell.md §4
   */
  const REF_EUR_MBIT_DOWN = 189.9 / 2000; // 0.09495 ≈ 0.095

  /**
   * Referenz €/Mbit Up: bester dokumentierter Wert in der P/L-Tabelle
   * (spusu 5G Home L: 0,48) — gerundet auf 0,50 wie in der Aufpreis-Diskussion
   * der Drei Boost!-Zeile (0,50). Wir nehmen den dokumentierten Bestwert 0,48.
   */
  const REF_EUR_MBIT_UP = 0.48;

  /**
   * Vorberechnete P/L-Zeilen exakt aus multi-5g-ip-kostenmodell.md §4
   * (Index-Werte übernommen, nicht neu gerechnet).
   */
  const PL_TABLE = [
    { tarif: 'Magenta Business Cable 2000', netz: 'Kabel', eurNetto: 189.9, down: 2000, up: 200, eurDown: 0.095, eurUp: 0.95, latenz: 95, ip: 90, index: 82, badge: 'g' },
    { tarif: 'Magenta Business Cable 1000', netz: 'Kabel', eurNetto: 124.9, down: 1000, up: 100, eurDown: 0.125, eurUp: 1.25, latenz: 95, ip: 90, index: 74, badge: 'g' },
    { tarif: 'Magenta Business 5G 600', netz: 'Magenta', eurNetto: 60.0, down: 600, up: 100, eurDown: 0.100, eurUp: 0.60, latenz: 80, ip: 90, index: 84, badge: 'g' },
    { tarif: 'A1 Business Cube 500', netz: 'A1', eurNetto: 92.9, down: 500, up: 70, eurDown: 0.186, eurUp: 1.33, latenz: 55, ip: 90, index: 57, badge: 'o' },
    { tarif: 'A1 Cube Internet 500', netz: 'A1', eurNetto: 49.92, down: 500, up: 70, eurDown: 0.100, eurUp: 0.71, latenz: 55, ip: 50, index: 64, badge: 'o' },
    { tarif: 'Drei Internet Boost! 5G 500', netz: 'Drei', eurNetto: 49.92, down: 500, up: 100, eurDown: 0.100, eurUp: 0.50, latenz: 75, ip: 50, index: 76, badge: 'g' },
    { tarif: 'Magenta Internet 5G S', netz: 'Magenta', eurNetto: 41.58, down: 400, up: 50, eurDown: 0.104, eurUp: 0.83, latenz: 80, ip: 50, index: 68, badge: 'o' },
    { tarif: 'spusu 5G Home L', netz: 'Drei', eurNetto: 24.08, down: 240, up: 50, eurDown: 0.100, eurUp: 0.48, latenz: 70, ip: 50, index: 75, badge: 'g' },
    { tarif: 'Magenta Internet 5G XS', netz: 'Magenta', eurNetto: 33.25, down: 200, up: 20, eurDown: 0.166, eurUp: 1.66, latenz: 80, ip: 50, index: 53, badge: 'b' },
  ];

  /**
   * Aufpreis-Leiter exakt aus multi-5g-ip-kostenmodell.md §4
   */
  const LADDER = [
    { leiter: 'Magenta Business Cable', von: '250/60', nach: '500/80', dEur: 15.0, dDown: 250, dUp: 20, eurExtraDown: 0.06, eurExtraUp: 0.75, lohnt: 'g', lohntText: '🟢 lohnt' },
    { leiter: 'Magenta Business Cable', von: '500/80', nach: '1000/100', dEur: 40.0, dDown: 500, dUp: 20, eurExtraDown: 0.08, eurExtraUp: 2.0, lohnt: 'o', lohntText: '🟡 Upload kaum mehr' },
    { leiter: 'Magenta Business Cable', von: '1000/100', nach: '2000/200', dEur: 65.0, dDown: 1000, dUp: 100, eurExtraDown: 0.065, eurExtraUp: 0.65, lohnt: 'g', lohntText: '🟢 Upload verdoppelt' },
    { leiter: 'Magenta 5G privat', von: 'Basic 60/20', nach: 'XXS 100/20', dEur: 5.83, dDown: 40, dUp: 0, eurExtraDown: 0.15, eurExtraUp: null, lohnt: 'b', lohntText: '🔴' },
    { leiter: 'Magenta 5G privat', von: 'XXS 100/20', nach: 'XS 200/20', dEur: 8.33, dDown: 100, dUp: 0, eurExtraDown: 0.08, eurExtraUp: null, lohnt: 'o', lohntText: '🟡' },
    { leiter: 'Magenta 5G privat', von: 'XS 200/20', nach: 'S 400/50', dEur: 8.33, dDown: 200, dUp: 30, eurExtraDown: 0.04, eurExtraUp: 0.28, lohnt: 'g', lohntText: '🟢 Sweet Spot' },
    { leiter: 'A1 Cube privat', von: '150/30', nach: '250', dEur: 15.0, dDown: 100, dUp: null, eurExtraDown: 0.15, eurExtraUp: null, lohnt: 'b', lohntText: '🔴 ❓ Kurzangabe' },
    { leiter: 'A1 Cube privat', von: '250', nach: '500/70', dEur: 5.83, dDown: 250, dUp: null, eurExtraDown: 0.02, eurExtraUp: null, lohnt: 'g', lohntText: '🟢' },
    { leiter: 'A1 Business Cube', von: '500/70', nach: '1000/100', dEur: 284.0, dDown: 500, dUp: 30, eurExtraDown: 0.57, eurExtraUp: 9.47, lohnt: 'b', lohntText: '🔴 EB 2024 ❓' },
  ];

  /**
   * Kostenmodell-Szenarien aus multi-5g-ip-kostenmodell.md §3
   * Werte sind netto €/Monat gesamt und pro Agent.
   */
  const SCENARIOS = {
    labels: [5, 10, 20],
    A: { name: 'Kabel 2000 + 5G-Backup', perAgent: [52.06, 26.03, 13.02], total: [260, 260, 260], note: 'Magenta Business Cable 2000/200 (189,90) + Magenta Business 5G 600 (60) + Gateway (~10,42)' },
    Bprivat: { name: 'Mehrere Router, Privattarife', perAgent: [46.66, 47.50, 48.37], total: [233, 475, 967], note: 'spusu 5G Home L / Magenta 5G S / A1 Cube 500 + 10,42 Router/Leitung' },
    Bbusiness: { name: 'Mehrere Router, Business', perAgent: [83.58, 80.29, 81.93], total: [418, 803, 1639], note: 'Magenta Biz 5G 600 / A1 Biz Cube 500 / Drei Biz 5G (~60 ❓) + Router' },
  };

  /** nPerf Ø-Latenz ms (österreichweit) aus 5g-vergleich-bandgasse13.md §4 */
  const NPERF_LATENZ_MS = { Drei: 24.9, Magenta: 25.3, A1: 27.6 };
  /** connect Anteil < 20 ms RTT aus 5g-vergleich-bandgasse13.md §4 */
  const CONNECT_LT20 = { Magenta: 60, Drei: 48, A1: 8 };

  // —— helpers ——
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n, dig = 2) => (n == null || Number.isNaN(n) ? '—' : n.toLocaleString('de-AT', { minimumFractionDigits: dig, maximumFractionDigits: dig }));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function nettoFromBrutto(brutto) { return brutto / (1 + USt); }
  function bruttoFromNetto(netto) { return netto * (1 + USt); }

  /**
   * Preis aus data.json-Eintrag: preis_sort ist i. d. R. brutto.
   * Business-Texte mit "(X,XX n)" → explizites Netto bevorzugen.
   */
  function parseTarifPreise(t) {
    const bruttoSort = typeof t.preis_sort === 'number' ? t.preis_sort : null;
    let netto = null;
    const m = String(t.preis || '').match(/\((\d+[.,]\d+)\s*n/);
    if (m) netto = parseFloat(m[1].replace(',', '.'));
    if (netto == null && bruttoSort != null) netto = nettoFromBrutto(bruttoSort);
    const brutto = bruttoSort != null ? bruttoSort : (netto != null ? bruttoFromNetto(netto) : null);
    return { netto, brutto };
  }

  function routerPreisBrutto(r) {
    if (typeof r.preis_sort === 'number' && r.preis_sort < 9000) return r.preis_sort;
    return null;
  }

  function hasFesteIp(t) {
    // feste-ips-at.md / multi-5g: Business-Tarife oft mit fester IP; Privattarife CGNAT
    if (t.business) return true;
    const p = String(t.preis || '') + ' ' + String(t.tarif || '');
    if (/fixe?\s*IP|feste?\s*IP|Static\s*IP/i.test(p)) return true;
    return false;
  }

  function latenzFor(t) {
    if (/Kabel|Cable|Fiber|Glasfaser/i.test(t.tarif || '') || t.netz === 'Kabel') return LATENZ_SCORE.Kabel;
    if (/spusu/i.test(t.anbieter || '')) return LATENZ_SCORE.spusu;
    return LATENZ_SCORE[t.netz] ?? 50;
  }

  /**
   * Live-P/L-Score nach dokumentierter Gewichtung je 25 %:
   * €/Mbit Down (Ref. Cable 2000), €/Mbit Up (Ref. 0,48), Latenz, IP.
   * score_€ = min(100, 100 * ref / actual)
   */
  function computePlIndex(t) {
    const { netto } = parseTarifPreise(t);
    const down = t.down, up = t.up;
    if (netto == null || !down || !up) {
      return { ok: false, reason: 'Preis oder Down/Up fehlt' };
    }
    const eurDown = netto / down;
    const eurUp = netto / up;
    const scoreDown = clamp(100 * (REF_EUR_MBIT_DOWN / eurDown), 0, 100);
    const scoreUp = clamp(100 * (REF_EUR_MBIT_UP / eurUp), 0, 100);
    const latenz = latenzFor(t);
    const ip = hasFesteIp(t) ? IP_SCORE.fest : IP_SCORE.cgnat;
    const index = (scoreDown + scoreUp + latenz + ip) / 4;
    return {
      ok: true,
      eurNetto: netto,
      down, up,
      eurDown, eurUp,
      scoreDown, scoreUp,
      latenz, ip,
      index,
      festeIp: hasFesteIp(t),
    };
  }

  // —— SVG charts (no external libs) ——
  function svgBarsHorizontal(items, opts = {}) {
    const W = opts.width || 640;
    const rowH = opts.rowH || 28;
    const padL = opts.padL || 168;
    const padR = 56;
    const padT = 8;
    const padB = 8;
    const H = padT + items.length * rowH + padB;
    const max = Math.max(...items.map((i) => i.value), 1);
    const barW = W - padL - padR;
    const bars = items.map((it, i) => {
      const y = padT + i * rowH;
      const w = (it.value / max) * barW;
      const col = it.color || '#6c5ce7';
      return `<g>
        <text x="${padL - 8}" y="${y + rowH / 2 + 4}" text-anchor="end" class="tc-bar-label">${esc(it.label)}</text>
        <rect x="${padL}" y="${y + 5}" width="${barW}" height="${rowH - 10}" rx="4" fill="#1e2430"/>
        <rect x="${padL}" y="${y + 5}" width="${Math.max(w, 2)}" height="${rowH - 10}" rx="4" fill="${col}"/>
        <text x="${padL + Math.max(w, 2) + 6}" y="${y + rowH / 2 + 4}" class="tc-bar-label">${esc(it.valueLabel ?? fmt(it.value, 0))}</text>
      </g>`;
    }).join('');
    return `<svg class="tc-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.aria || 'Balkendiagramm')}">${bars}</svg>`;
  }

  function svgGroupedBars(groups, series, opts = {}) {
    // groups: ['5','10','20'], series: [{name,color,values:[...]}]
    const W = opts.width || 640;
    const H = opts.height || 220;
    const padL = 44, padR = 16, padT = 16, padB = 36;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const max = Math.max(...series.flatMap((s) => s.values), 1);
    const gW = plotW / groups.length;
    const n = series.length;
    const barW = Math.min(28, (gW * 0.7) / n);
    const gap = 4;

    let grid = '';
    for (let i = 0; i <= 4; i++) {
      const y = padT + plotH * (1 - i / 4);
      const v = (max * i) / 4;
      grid += `<line class="tc-axis" x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}"/>`;
      grid += `<text x="${padL - 6}" y="${y + 4}" text-anchor="end">${fmt(v, 0)}</text>`;
    }

    let bars = '';
    groups.forEach((g, gi) => {
      const cx = padL + gi * gW + gW / 2;
      series.forEach((s, si) => {
        const h = (s.values[gi] / max) * plotH;
        const x = cx - (n * barW + (n - 1) * gap) / 2 + si * (barW + gap);
        const y = padT + plotH - h;
        bars += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="3" fill="${s.color}">
          <title>${esc(s.name)} · ${g} Agenten: ${fmt(s.values[gi])} €</title></rect>`;
      });
      bars += `<text x="${cx}" y="${H - 12}" text-anchor="middle">${esc(String(g))} Ag.</text>`;
    });

    return `<svg class="tc-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.aria || 'Gruppiertes Diagramm')}">${grid}${bars}</svg>`;
  }

  function svgLatenz() {
    const items = [
      { label: 'Magenta (connect <20 ms)', value: CONNECT_LT20.Magenta, valueLabel: '~60 %', color: '#e20074' },
      { label: 'Drei (connect <20 ms)', value: CONNECT_LT20.Drei, valueLabel: '~48 %', color: '#ff6600' },
      { label: 'A1 (connect <20 ms)', value: CONNECT_LT20.A1, valueLabel: '~8 %', color: '#da291c' },
    ];
    const nperf = [
      { label: 'Drei Ø (nPerf)', value: 40 - NPERF_LATENZ_MS.Drei, valueLabel: '24,9 ms', color: '#ff6600' },
      { label: 'Magenta Ø (nPerf)', value: 40 - NPERF_LATENZ_MS.Magenta, valueLabel: '25,3 ms', color: '#e20074' },
      { label: 'A1 Ø (nPerf)', value: 40 - NPERF_LATENZ_MS.A1, valueLabel: '27,6 ms', color: '#da291c' },
    ];
    // For nPerf lower is better — we invert for bar length display but show real ms label
    return {
      connect: svgBarsHorizontal(items, { aria: 'Anteil Messungen unter 20 ms RTT (connect 2026)', padL: 190 }),
      nperf: svgBarsHorizontal(nperf, { aria: 'nPerf Ø-Latenz Österreich 2026 (kürzer = besser)', padL: 150 }),
    };
  }

  // —— UI ——
  function buildShell(root) {
    root.innerHTML = `
<div class="tc-wrap">
  <header class="tc-head">
    <h2>💶 Kostenrechner &amp; Preis-Leistungs-Index</h2>
    <p>SIMs × Router über 24 Monate · netto/brutto (20&nbsp;% USt) · €/Mbit · Latenz-Score · feste IP · Aufpreis-Leiter. Quellen: Recherche 12.10.2026.</p>
  </header>
  <div class="tc-tabs" role="tablist">
    <button type="button" data-pane="calc" class="on">Kostenrechner</button>
    <button type="button" data-pane="pl">P/L-Index</button>
    <button type="button" data-pane="ladder">Aufpreis-Leiter</button>
    <button type="button" data-pane="szenario">Szenarien A/B</button>
  </div>

  <section data-pane-body="calc" class="tc-grid tc-grid-3">
    <div class="tc-card">
      <h3><span class="tc-ico">⚙️</span> Parameter</h3>
      <div class="tc-controls">
        <div class="tc-field tc-range">
          <div class="tc-range-top"><label for="tc-n">Anzahl SIMs / Leitungen (= Agenten)</label><output id="tc-n-out">5</output></div>
          <input type="range" id="tc-n" min="1" max="20" step="1" value="5">
        </div>
        <div class="tc-field">
          <label for="tc-tarif">Tarif (aus data.json)</label>
          <select id="tc-tarif"></select>
        </div>
        <div class="tc-field">
          <label for="tc-router">Router (aus data.json)</label>
          <select id="tc-router"></select>
        </div>
        <div class="tc-field">
          <label>Anzeige</label>
          <div class="tc-tog" id="tc-vat">
            <button type="button" data-vat="netto" class="on">Netto</button>
            <button type="button" data-vat="brutto">Brutto (+20&nbsp;% USt)</button>
          </div>
        </div>
      </div>
      <p class="tc-note">Router-Kosten linear über <code>${AMORT_MONATE} Monate</code> abgeschrieben (wie in multi-5g-ip-kostenmodell.md: 300&nbsp;€ brutto ≈ 10,42&nbsp;€ netto/Monat).</p>
    </div>
    <div class="tc-card" style="grid-column: span 2;">
      <h3><span class="tc-ico">📊</span> Ergebnis</h3>
      <div class="tc-kpi" id="tc-kpi"></div>
      <div id="tc-calc-chart"></div>
      <div class="tc-warn">⚠️ Mehrere SIMs am selben Standort teilen sich 1–3 Funkzellen — zusätzliche SIMs bringen vor allem mehr IPs, kaum mehr Bandbreite (multi-5g-ip-kostenmodell.md §3).</div>
      <div id="tc-live-pl" style="margin-top:.85rem;"></div>
    </div>
  </section>

  <section data-pane-body="pl" hidden>
    <div class="tc-grid tc-grid-2">
      <div class="tc-card">
        <h3><span class="tc-ico">🏆</span> P/L-Index (Server/Agenten-Use-Case)</h3>
        <p class="tc-note" style="margin-top:0;margin-bottom:.6rem;">Score 0–100, je 25&nbsp;%: €/Mbit↓ (Ref. Cable&nbsp;2000 = 0,095), €/Mbit↑, Latenz-Score, IP-Score (feste IP&nbsp;90 / CGNAT&nbsp;50). Index-Spalte = Werte aus der Recherche-Tabelle.</p>
        <div class="tc-table-wrap">
          <table class="tc-table" id="tc-pl-table"></table>
        </div>
      </div>
      <div class="tc-card">
        <h3><span class="tc-ico">📈</span> Index-Vergleich</h3>
        <div id="tc-pl-chart"></div>
        <h3 style="margin-top:1.1rem;"><span class="tc-ico">⏱️</span> Latenz Wien / AT</h3>
        <p class="tc-note" style="margin:0 0 .4rem;">connect Netztest 2026: Anteil Messungen &lt;&nbsp;20&nbsp;ms RTT · nPerf Barometer 2026: Ø-Latenz AT</p>
        <div id="tc-lat-chart"></div>
        <div class="tc-legend">
          <span><i style="background:#e20074"></i>Magenta</span>
          <span><i style="background:#ff6600"></i>Drei</span>
          <span><i style="background:#da291c"></i>A1</span>
          <span>Kabel-Latenz typ. 10–20&nbsp;ms (DOCSIS)</span>
        </div>
      </div>
    </div>
  </section>

  <section data-pane-body="ladder" hidden>
    <div class="tc-card">
      <h3><span class="tc-ico">⬆️</span> Aufpreis zur nächsten Speed-Stufe</h3>
      <p class="tc-note" style="margin-top:0;margin-bottom:.6rem;">Δ&nbsp;€ netto und € pro zusätzlichem Mbit↓/↑ — multi-5g-ip-kostenmodell.md §4.</p>
      <div class="tc-table-wrap">
        <table class="tc-table" id="tc-ladder-table"></table>
      </div>
      <div id="tc-ladder-chart" style="margin-top:.75rem;"></div>
    </div>
  </section>

  <section data-pane-body="szenario" hidden>
    <div class="tc-grid tc-grid-2">
      <div class="tc-card">
        <h3><span class="tc-ico">🤖</span> € pro Agent (netto/Monat)</h3>
        <div id="tc-scen-chart"></div>
        <div class="tc-legend">
          <span><i style="background:#00b894"></i>A Kabel+Backup</span>
          <span><i style="background:#fdcb6e"></i>B privat</span>
          <span><i style="background:#e17055"></i>B business</span>
        </div>
      </div>
      <div class="tc-card">
        <h3><span class="tc-ico">📋</span> Szenario-Details</h3>
        <div class="tc-table-wrap">
          <table class="tc-table" id="tc-scen-table"></table>
        </div>
        <p class="tc-note" id="tc-scen-notes"></p>
      </div>
    </div>
  </section>

  <footer class="tc-src">
    <strong>Quellen (nicht erfunden)</strong>
    <ul>
      <li>tarife-at <code>assets/data.json</code> — 65 Tarife, 16 Router</li>
      <li><code>5g-vergleich-bandgasse13.md</code> — connect 2026, nPerf 2026, Kabel-Latenz</li>
      <li><code>multi-5g-ip-kostenmodell.md</code> — P/L-Index, Aufpreis-Leiter, Szenarien A/B, Router-Abschreibung</li>
      <li><code>feste-ips-at.md</code> — feste IP nur Business / Option</li>
    </ul>
  </footer>
</div>`;
  }

  function fillSelects(root, data) {
    const tarifSel = root.querySelector('#tc-tarif');
    const routerSel = root.querySelector('#tc-router');
    const tarife = (data.tarife || [])
      .filter((t) => t.down && t.preis_sort != null)
      .slice()
      .sort((a, b) => a.anbieter.localeCompare(b.anbieter) || (b.down - a.down));

    tarifSel.innerHTML = tarife.map((t) => {
      const { netto, brutto } = parseTarifPreise(t);
      const label = `${t.anbieter} · ${t.tarif} · ${t.down}/${t.up ?? '?'} · ${fmt(brutto, 2)} € brutto` +
        (t.business ? ' · 🏢' : '');
      return `<option value="${t.id}" data-netto="${netto ?? ''}" data-brutto="${brutto ?? ''}">${esc(label)}</option>`;
    }).join('');

    // Prefer Magenta Business 5G 600 if present
    const prefer = tarife.find((t) => /Business 5G 600/i.test(t.tarif));
    if (prefer) { try { tarifSel.value = String(prefer.id); } catch (_) { /* limited DOM */ } }

    const routers = (data.router || []).filter((r) => routerPreisBrutto(r) != null);
    routerSel.innerHTML = `<option value="">— ohne Router —</option>` + routers.map((r, i) => {
      const p = routerPreisBrutto(r);
      return `<option value="${i}" data-brutto="${p}">${esc(r.geraet)} · ${fmt(p, 2)} € brutto</option>`;
    }).join('');

    // Prefer NX200 (~210) as documented entry-level
    const nx = routers.findIndex((r) => /NX200/i.test(r.geraet));
    if (nx >= 0) { try { routerSel.value = String(nx); } catch (_) { /* limited DOM */ } }

    // Fallback when DOM cannot set <select>.value (e.g. linkedom)
    if (!tarifSel.value && tarifSel.options && tarifSel.options.length) {
      const opt = prefer
        ? [...tarifSel.options].find((o) => o.value === String(prefer.id)) || tarifSel.options[0]
        : tarifSel.options[0];
      if (opt) opt.selected = true;
    }
    if (routerSel.value === '' && nx >= 0 && routerSel.options?.[nx + 1]) {
      routerSel.options[nx + 1].selected = true;
    }

    return { tarife, routers };
  }

  function renderCalc(root, state) {
    const n = +root.querySelector('#tc-n').value;
    root.querySelector('#tc-n-out').textContent = String(n);
    const vatMode = root.querySelector('#tc-vat button.on').dataset.vat;
    const tarifSel = root.querySelector('#tc-tarif');
    const tarifId = +(tarifSel.value || (tarifSel.selectedOptions?.[0]?.value) || state.tarife[0]?.id);
    const t = state.tarife.find((x) => x.id === tarifId) || state.tarife[0];
    const routerSel = root.querySelector('#tc-router');
    const routerIdx = routerSel.value !== '' && routerSel.value != null
      ? routerSel.value
      : (routerSel.selectedOptions?.[0]?.value ?? '');
    const r = routerIdx === '' ? null : state.routers[+routerIdx];

    if (!t) return;

    const preise = parseTarifPreise(t);
    const routerBrutto = r ? routerPreisBrutto(r) : 0;
    const routerNetto = routerBrutto ? nettoFromBrutto(routerBrutto) : 0;
    const routerMonatNetto = routerNetto / AMORT_MONATE;
    const routerMonatBrutto = (routerBrutto || 0) / AMORT_MONATE;

    const tarifMonat = vatMode === 'netto' ? preise.netto : preise.brutto;
    const routerMonat = vatMode === 'netto' ? routerMonatNetto : routerMonatBrutto;
    const gesamt = n * ((tarifMonat || 0) + routerMonat);
    const proAgent = n ? gesamt / n : 0;

    const unit = vatMode === 'netto' ? 'netto' : 'brutto';
    root.querySelector('#tc-kpi').innerHTML = `
      <div><div class="tc-k">Tarif / Monat / SIM</div><div class="tc-v">${fmt(tarifMonat)} € <small>${unit}</small></div></div>
      <div><div class="tc-k">Router / Monat / Gerät</div><div class="tc-v">${fmt(routerMonat)} € <small>${unit} · ${AMORT_MONATE} Mo.</small></div></div>
      <div><div class="tc-k">Gesamt / Monat</div><div class="tc-v">${fmt(gesamt)} € <small>${unit} · ${n}×</small></div></div>
      <div><div class="tc-k">Kosten pro Agent</div><div class="tc-v">${fmt(proAgent)} € <small>${unit}</small></div></div>`;

    // Chart: breakdown
    const chartItems = [];
    for (const nn of [1, 5, 10, 20]) {
      if (nn > 20) continue;
      const g = nn * ((tarifMonat || 0) + routerMonat);
      chartItems.push({
        label: `${nn} Agent${nn > 1 ? 'en' : ''}`,
        value: g,
        valueLabel: `${fmt(g, 0)} €`,
        color: nn === n ? '#00a8a8' : '#6c5ce7',
      });
    }
    root.querySelector('#tc-calc-chart').innerHTML =
      `<p class="tc-note">Monatskosten bei ${esc(t.anbieter + ' ' + t.tarif)}${r ? ' + ' + esc(r.geraet) : ''} (${unit})</p>` +
      svgBarsHorizontal(chartItems, { aria: 'Monatskosten nach Agentenzahl', padL: 90 });

    // Live P/L for selected
    const pl = computePlIndex(t);
    const box = root.querySelector('#tc-live-pl');
    if (pl.ok) {
      box.innerHTML = `<div class="tc-card" style="background:var(--tc-panel2);padding:.75rem;">
        <h3 style="margin:0 0 .5rem;font-size:.92rem;">Live-P/L für Auswahl (Formel, nicht die Recherche-Tabelle)</h3>
        <div class="tc-kpi">
          <div><div class="tc-k">€/Mbit ↓</div><div class="tc-v">${fmt(pl.eurDown, 3)} <small>Score ${fmt(pl.scoreDown, 0)}</small></div></div>
          <div><div class="tc-k">€/Mbit ↑</div><div class="tc-v">${fmt(pl.eurUp, 3)} <small>Score ${fmt(pl.scoreUp, 0)}</small></div></div>
          <div><div class="tc-k">Latenz (${esc(t.netz)})</div><div class="tc-v">${pl.latenz} <small>/ 100</small></div></div>
          <div><div class="tc-k">IP (${pl.festeIp ? 'fest/Business' : 'CGNAT'})</div><div class="tc-v">${pl.ip} <small>→ Index ${fmt(pl.index, 0)}</small></div></div>
        </div>
        <p class="tc-note">Formel: Mittelwert aus min(100, 100·ref/€/Mbit↓), min(100, 100·0,48/€/Mbit↑), Latenz-Score, IP-Score. Die Index-Spalte im Tab „P/L-Index“ sind die unveränderten Recherche-Werte.</p>
      </div>`;
    } else {
      box.innerHTML = `<p class="tc-note">P/L für diese Auswahl nicht berechenbar: ${esc(pl.reason)}</p>`;
    }
  }

  function renderPl(root) {
    const tbl = root.querySelector('#tc-pl-table');
    tbl.innerHTML = `<thead><tr>
      <th>Tarif</th><th>Netz</th><th class="tc-num">€ netto</th><th class="tc-num">Down/Up</th>
      <th class="tc-num">€/Mbit↓</th><th class="tc-num">€/Mbit↑</th>
      <th class="tc-num">Latenz</th><th class="tc-num">IP</th><th class="tc-num">Index</th>
    </tr></thead><tbody>${PL_TABLE.slice().sort((a, b) => b.index - a.index).map((r) => `<tr>
      <td>${esc(r.tarif)}</td>
      <td><span class="tc-badge n-${esc(r.netz)}">${esc(r.netz)}</span></td>
      <td class="tc-num">${fmt(r.eurNetto)}</td>
      <td class="tc-num">${r.down}/${r.up}</td>
      <td class="tc-num">${fmt(r.eurDown, 3)}</td>
      <td class="tc-num">${fmt(r.eurUp, 2)}</td>
      <td class="tc-num">${r.latenz}</td>
      <td class="tc-num">${r.ip}</td>
      <td class="tc-num"><span class="tc-badge ${r.badge}">${r.index}</span></td>
    </tr>`).join('')}</tbody>`;

    const colors = { Kabel: '#00a8a8', Magenta: '#e20074', Drei: '#ff6600', A1: '#da291c' };
    const items = PL_TABLE.slice().sort((a, b) => b.index - a.index).map((r) => ({
      label: r.tarif.replace('Magenta Business ', 'Mag. Biz ').replace('Internet ', '').replace('A1 Business ', 'A1 Biz '),
      value: r.index,
      valueLabel: String(r.index),
      color: colors[r.netz] || '#6c5ce7',
    }));
    root.querySelector('#tc-pl-chart').innerHTML = svgBarsHorizontal(items, { aria: 'P/L-Index', padL: 175, width: 620 });

    const lat = svgLatenz();
    root.querySelector('#tc-lat-chart').innerHTML =
      `<p class="tc-note" style="margin:0 0 .25rem;">connect: Anteil &lt; 20 ms</p>${lat.connect}
       <p class="tc-note" style="margin:.6rem 0 .25rem;">nPerf: Ø-Latenz (Balkenlänge = 40 − ms, kürzer ms = länger Balken)</p>${lat.nperf}`;
  }

  function renderLadder(root) {
    const tbl = root.querySelector('#tc-ladder-table');
    tbl.innerHTML = `<thead><tr>
      <th>Leiter</th><th>Stufe → Stufe</th><th class="tc-num">Δ € netto</th>
      <th class="tc-num">Δ Mbit ↓/↑</th><th class="tc-num">€ / +Mbit ↓</th>
      <th class="tc-num">€ / +Mbit ↑</th><th>Lohnt?</th>
    </tr></thead><tbody>${LADDER.map((r) => `<tr>
      <td>${esc(r.leiter)}</td>
      <td>${esc(r.von)} → ${esc(r.nach)}</td>
      <td class="tc-num">+${fmt(r.dEur)}</td>
      <td class="tc-num">+${r.dDown}${r.dUp != null ? ' / +' + r.dUp : ''}</td>
      <td class="tc-num">${r.eurExtraDown != null ? fmt(r.eurExtraDown, 3) : '—'}</td>
      <td class="tc-num">${r.eurExtraUp != null ? fmt(r.eurExtraUp, 2) : '—'}</td>
      <td><span class="tc-badge ${r.lohnt}">${esc(r.lohntText)}</span></td>
    </tr>`).join('')}</tbody>`;

    const items = LADDER.map((r) => ({
      label: `${r.leiter.split(' ')[0]} ${r.von}→${r.nach}`.slice(0, 34),
      value: r.dEur,
      valueLabel: `+${fmt(r.dEur, 0)} €`,
      color: r.lohnt === 'g' ? '#00b894' : r.lohnt === 'o' ? '#fdcb6e' : '#e17055',
    }));
    root.querySelector('#tc-ladder-chart').innerHTML =
      `<p class="tc-note">Aufpreis Δ € netto zur nächsten Stufe</p>` +
      svgBarsHorizontal(items, { aria: 'Aufpreis-Leiter', padL: 200, width: 700, rowH: 26 });
  }

  function renderSzenario(root) {
    const S = SCENARIOS;
    root.querySelector('#tc-scen-chart').innerHTML = svgGroupedBars(
      S.labels.map(String),
      [
        { name: S.A.name, color: '#00b894', values: S.A.perAgent },
        { name: S.Bprivat.name, color: '#fdcb6e', values: S.Bprivat.perAgent },
        { name: S.Bbusiness.name, color: '#e17055', values: S.Bbusiness.perAgent },
      ],
      { aria: 'Euro pro Agent nach Szenario', height: 240 }
    );

    const tbl = root.querySelector('#tc-scen-table');
    tbl.innerHTML = `<thead><tr>
      <th>Agenten</th>
      <th class="tc-num">🟢 A gesamt → /Agent</th>
      <th class="tc-num">🟡 B-privat → /Agent</th>
      <th class="tc-num">🔴 B-business → /Agent</th>
    </tr></thead><tbody>${S.labels.map((n, i) => `<tr>
      <td>${n}</td>
      <td class="tc-num">${S.A.total[i]} € → <strong>${fmt(S.A.perAgent[i])}</strong></td>
      <td class="tc-num">${S.Bprivat.total[i]} € → <strong>${fmt(S.Bprivat.perAgent[i])}</strong></td>
      <td class="tc-num">${S.Bbusiness.total[i]} € → <strong>${fmt(S.Bbusiness.perAgent[i])}</strong></td>
    </tr>`).join('')}</tbody>`;

    root.querySelector('#tc-scen-notes').innerHTML =
      `<strong>A:</strong> ${esc(S.A.note)}<br>
       <strong>B-privat:</strong> ${esc(S.Bprivat.note)}<br>
       <strong>B-business:</strong> ${esc(S.Bbusiness.note)}`;
  }

  function wire(root, state) {
    root.querySelectorAll('.tc-tabs button').forEach((btn) => {
      btn.addEventListener('click', () => {
        root.querySelectorAll('.tc-tabs button').forEach((b) => b.classList.toggle('on', b === btn));
        root.querySelectorAll('[data-pane-body]').forEach((sec) => {
          sec.hidden = sec.getAttribute('data-pane-body') !== btn.dataset.pane;
        });
      });
    });
    root.querySelector('#tc-vat').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-vat]');
      if (!b) return;
      root.querySelectorAll('#tc-vat button').forEach((x) => x.classList.toggle('on', x === b));
      renderCalc(root, state);
    });
    ['tc-n', 'tc-tarif', 'tc-router'].forEach((id) => {
      root.querySelector('#' + id).addEventListener('input', () => renderCalc(root, state));
    });
  }

  async function mount(container, opts = {}) {
    if (!container) throw new Error('TarifeCalc.mount: container fehlt');
    container.classList.add('tc-root');
    buildShell(container);

    let data = opts.data;
    if (!data) {
      const url = opts.dataUrl || 'assets/data.json';
      const res = await fetch(url);
      if (!res.ok) throw new Error('data.json nicht ladbar: ' + res.status);
      data = await res.json();
    }

    const state = fillSelects(container, data);
    wire(container, state);
    renderCalc(container, state);
    renderPl(container);
    renderLadder(container);
    renderSzenario(container);
    return { state, computePlIndex, PL_TABLE, LADDER, SCENARIOS };
  }

  const api = {
    mount,
    computePlIndex,
    parseTarifPreise,
    USt,
    AMORT_MONATE,
    LATENZ_SCORE,
    IP_SCORE,
    PL_TABLE,
    LADDER,
    SCENARIOS,
    REF_EUR_MBIT_DOWN,
    REF_EUR_MBIT_UP,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.TarifeCalc = api;
})(typeof window !== 'undefined' ? window : globalThis);
