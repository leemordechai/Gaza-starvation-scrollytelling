<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { reveal } from '$lib/actions/reveal';
  import { viewport } from '$lib/actions/viewport';
  import SectionHead from '$lib/components/ui/SectionHead.svelte';
  import rawData from '$lib/data/aidTrucks.json';
  import { aidBlockade } from '$lib/data/story.js';

  // ── Types ──────────────────────────────────────────────────────────────────
  type SeriesPoint = { key: string; trucks: number; trucksPerDay: number; tons: number; tonsPerDay: number };
  type SubSeries = { key: string; series: SeriesPoint[] };

  // ── Data ───────────────────────────────────────────────────────────────────
  const months      = rawData.months;
  const totals      = rawData.totals as SeriesPoint[];
  const byClassification = rawData.byClassification as SubSeries[];
  const byOrg       = rawData.byOrg as SubSeries[];

  // ── State ──────────────────────────────────────────────────────────────────
  type Mode    = 'classification' | 'org';
  type Metric  = 'trucksPerDay' | 'tonsPerDay';

  let mode:   Mode   = $state('classification');
  let metric: Metric = $state('trucksPerDay');
  let hoveredSub: string | null = $state(null);
  let tooltipMonth: number | null = $state(null);   // index into months[]
  let isTouchDevice = $state(false);
  let pinnedMonth: number | null = $state(null);
  let showTapHint = $derived(isTouchDevice && pinnedMonth === null);
  let chartVisible = $state(false);
  let revealCounter = $state(0);
  let revealKey = $derived(chartVisible ? `${metric}-${revealCounter}` : 'hidden');

  // ── Derived ────────────────────────────────────────────────────────────────
  let subSeries = $derived(mode === 'classification' ? byClassificationMerged : byOrg);

  let maxVal = $derived(
    Math.max(...totals.map(d => d[metric]))
  );

  // Gap months (Mar–Apr 2025 blockade: 2025-03 and 2025-04 missing)
  const monthKeys = months.map(m => m.key);

  // ── Chart geometry ─────────────────────────────────────────────────────────
  const W = 880;
  const H = 360;
  const PAD = { top: 58, right: 24, bottom: 44, left: 62 };
  const CW = W - PAD.left - PAD.right;
  const CH = H - PAD.top  - PAD.bottom;

  function xPos(i: number): number {
    return PAD.left + (i / (months.length - 1)) * CW;
  }
  function yPos(val: number): number {
    return PAD.top + CH - (val / maxVal) * CH;
  }

  // Build SVG path — zero values draw to the baseline so the line is continuous.
  // This makes the Mar–Apr 2025 blockade visibly drop to zero rather than gap.
  function buildPath(series: SeriesPoint[]): string {
    let d = '';
    for (let i = 0; i < months.length; i++) {
      const v = series[i][metric];
      const x = xPos(i);
      const y = yPos(v); // zero → y = baseline
      if (i === 0) {
        d += `M ${x} ${y}`;
      } else {
        d += ` L ${x} ${y}`;
      }
    }
    return d;
  }

  // Build area path for total fill — also draws through zeros
  function buildArea(series: SeriesPoint[]): string {
    if (!months.length) return '';
    const baseY = PAD.top + CH;
    let d = `M ${xPos(0)} ${baseY}`;
    for (let i = 0; i < months.length; i++) {
      const v = series[i][metric];
      d += ` L ${xPos(i)} ${yPos(v)}`;
    }
    d += ` L ${xPos(months.length - 1)} ${baseY} Z`;
    return d;
  }

  let totalPath = $derived(buildPath(totals));
  let totalArea = $derived(buildArea(totals));

  // ── Tick values for Y axis ──────────────────────────────────────────────────
  let yTicks = $derived(() => {
    const nTicks = 5;
    const step = maxVal / nTicks;
    const ticks = [];
    for (let i = 0; i <= nTicks; i++) {
      const v = Math.round(step * i);
      ticks.push(v);
    }
    return ticks;
  });

  // ── Tooltip data ───────────────────────────────────────────────────────────
  let tooltipData = $derived(tooltipMonth !== null ? (() => {
    const idx = tooltipMonth as number;
    const total = totals[idx][metric];
    const subs = subSeries.map(s => ({
      key: s.key,
      val: s.series[idx][metric]
    })).filter(s => s.val > 0).sort((a, b) => b.val - a.val);
    return { month: hebrewMonthLabel(months[idx].key), total, subs };
  })() : null);

  // ── Tooltip X position ─────────────────────────────────────────────────────
  let tooltipX = $derived(tooltipMonth !== null ? xPos(tooltipMonth as number) : 0);
  let tooltipY = $derived(tooltipMonth !== null ? yPos(totals[tooltipMonth as number][metric]) : 0);

  // ── Mouse/touch hit detection ──────────────────────────────────────────────
  let svgEl: SVGSVGElement | undefined = $state();

  function findNearestMonth(clientX: number): number | null {
    if (!svgEl) return null;
    const rect = svgEl.getBoundingClientRect();
    const scale = W / rect.width;
    const svgX = (clientX - rect.left) * scale;
    if (svgX < PAD.left || svgX > W - PAD.right) return null;
    const frac = (svgX - PAD.left) / CW;
    return Math.min(months.length - 1, Math.max(0, Math.round(frac * (months.length - 1))));
  }

  function onPointerMove(e: PointerEvent) {
    if (isTouchDevice) return;
    tooltipMonth = findNearestMonth(e.clientX);
  }
  function onPointerLeave() {
    if (isTouchDevice) return;
    tooltipMonth = null;
  }
  function onPointerDown(e: PointerEvent) {
    if (!isTouchDevice) return;
    const m = findNearestMonth(e.clientX);
    if (m === null) { pinnedMonth = null; tooltipMonth = null; return; }
    if (m === pinnedMonth) {
      pinnedMonth = null; tooltipMonth = null;
    } else {
      pinnedMonth = m; tooltipMonth = m;
    }
  }

  onMount(() => {
    if (browser) isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  });

  // ── Keys to collapse into "אחר" ────────────────────────────────────────────
  const OTHER_KEYS = new Set([
    'Essential infrastructure equipment',
    'Medical equipment - for field hospital',
    'UN and International organizations equipment',
    'Water',
  ]);

  // Build a merged byClassification where the four "other" series are summed
  // into a single synthetic "אחר" series, keeping the rest unchanged.
  const byClassificationMerged: SubSeries[] = (() => {
    const months = rawData.months as { key: string }[];
    // Sum the four series per month
    const otherSeries: SeriesPoint[] = months.map(m => ({
      key: m.key, trucks: 0, trucksPerDay: 0, tons: 0, tonsPerDay: 0
    }));
    for (const sub of byClassification) {
      if (!OTHER_KEYS.has(sub.key)) continue;
      for (let i = 0; i < sub.series.length; i++) {
        const p = sub.series[i];
        otherSeries[i].trucks      += p.trucks;
        otherSeries[i].trucksPerDay = +((otherSeries[i].trucksPerDay + p.trucksPerDay).toFixed(1));
        otherSeries[i].tons        += p.tons;
        otherSeries[i].tonsPerDay   = +((otherSeries[i].tonsPerDay   + p.tonsPerDay).toFixed(1));
      }
    }
    const kept = byClassification.filter(s => !OTHER_KEYS.has(s.key));
    return [...kept, { key: '__other__', series: otherSeries }];
  })();

  // ── Color palettes ─────────────────────────────────────────────────────────
  const classColors: Record<string, string> = {
    'Food':            '#9b2a21',
    'Medical supplies':'#7ec8a0',
    'Shelter equipment':'#7ab3d4',
    'Fuel':            '#e07040',
    'Mixed aid':       '#b07acc',
    'Gas':             '#d4904a',
    '__other__':       '#7a8898',
  };
  const orgColors: Record<string, string> = {
    'International Organizations & NGOs':  '#9b2a21',
    'UN Agencies':                         '#7ec8a0',
    'Private sector':                      '#e07040',
    'Countries':                           '#7ab3d4',
    'Mixed donors':                        '#b07acc',
  };

  function getColor(key: string): string {
    const map = mode === 'classification' ? classColors : orgColors;
    return map[key] ?? '#888';
  }

  // ── Ceasefire bands ────────────────────────────────────────────────────────
  // Given a month key + fractional day (1-based), return an SVG x coordinate.
  function xPosFrac(monthKey: string, day: number): number {
    const idx = monthKeys.indexOf(monthKey);
    if (idx < 0) return -1;
    const daysInMonth = months[idx].days;
    const frac = (day - 1) / daysInMonth;            // 0 = start, 1 = end
    // Interpolate between this month's centre and adjacent centres
    // by using the raw position of the month index + fractional step
    const prev = idx > 0 ? xPos(idx - 1) : xPos(idx);
    const next = idx < months.length - 1 ? xPos(idx + 1) : xPos(idx);
    // Each month's x covers half-step to the left and right
    const halfStepL = (xPos(idx) - prev) / 2;
    const halfStepR = (next - xPos(idx)) / 2;
    return xPos(idx) - halfStepL + frac * (halfStepL + halfStepR);
  }

  type CeasefireBand = { x1: number; x2: number; midX: number; line1: string; line2: string };

  const ceasefireBands: CeasefireBand[] = (() => {
    const bands: CeasefireBand[] = [];

    // 1. First ceasefire: Nov 23 – Dec 1, 2023
    const cf1x1 = xPosFrac('2023-11', 23);
    const cf1x2 = xPosFrac('2023-12', 1);
    if (cf1x1 > 0 && cf1x2 > 0) {
      bands.push({ x1: cf1x1, x2: cf1x2, midX: (cf1x1 + cf1x2) / 2,
        line1: 'הפסקת האש', line2: 'הראשונה' });
    }

    // 2. Second ceasefire: Jan 18 – Mar 18, 2025
    const cf2x1 = xPosFrac('2025-01', 18);
    const cf2x2 = xPosFrac('2025-03', 18);
    if (cf2x1 > 0 && cf2x2 > 0) {
      bands.push({ x1: cf2x1, x2: cf2x2, midX: (cf2x1 + cf2x2) / 2,
        line1: 'הפסקת האש', line2: 'השנייה' });
    }

    // 3. Third ceasefire: Oct 10, 2025 onwards (to end of chart)
    const cf3x1 = xPosFrac('2025-10', 10);
    const cf3x2 = xPos(monthKeys.length - 1) + (xPos(1) - xPos(0)) * 0.5; // to right edge
    if (cf3x1 > 0) {
      bands.push({ x1: cf3x1, x2: Math.min(cf3x2, W - PAD.right),
        midX: (cf3x1 + Math.min(cf3x2, W - PAD.right)) / 2,
        line1: 'הפסקת האש', line2: 'השלישית' });
    }

    return bands;
  })();

  // ── Gap annotation: shading covers March + April (zero months) ────────────
  // Extended by a full column-step on each side for visual clarity.
  // Label reads "Mar – May 19" to reflect when aid actually resumed.
  let gapIndices = $derived((() => {
    const marIdx = monthKeys.indexOf('2025-03');
    const aprIdx = monthKeys.indexOf('2025-04');
    if (marIdx < 0 || aprIdx < 0) return null;
    // Column spacing = distance between adjacent month positions
    const colStep = marIdx > 0 ? xPos(marIdx) - xPos(marIdx - 1) : xPos(1) - xPos(0);
    const x1 = xPos(marIdx) - colStep * 0.8;
    const x2 = xPos(aprIdx) + colStep * 0.8;
    return { x1, x2, midX: (x1 + x2) / 2 };
  })());

  // ── Metric formatter ───────────────────────────────────────────────────────
  function fmt(val: number): string {
    if (metric === 'trucksPerDay') return val % 1 === 0 ? val.toString() : val.toFixed(1);
    // tonsPerDay
    if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
    return val % 1 === 0 ? val.toString() : val.toFixed(1);
  }

  function metricUnit(): string {
    return metric === 'trucksPerDay' ? 'משאיות / יום' : 'טון / יום';
  }

  // ── Hebrew display labels ──────────────────────────────────────────────────
  const hebrewLabels: Record<string, string> = {
    // Classification keys
    'Food':             'מזון',
    'Medical supplies': 'ציוד רפואי',
    'Shelter equipment':'ציוד מחסה',
    'Fuel':             'דלק',
    'Mixed aid':        'סיוע מעורב',
    'Gas':              'גז לבישול',
    '__other__':        'אחר',
    // Org keys
    'International Organizations & NGOs': 'ארגונים בינ"ל ועמותות',
    'UN Agencies':   'סוכנויות האו"ם',
    'Private sector':'מגזר פרטי',
    'Countries':     'מדינות',
    'Mixed donors':  'תורמים מעורבים',
  };
  function label(key: string): string {
    return hebrewLabels[key] ?? key;
  }

  // ── Hebrew month labels from YYYY-MM key ────────────────────────────────────
  const hebrewMonths = ['ינו׳','פבר׳','מרץ','אפר׳','מאי','יוני','יולי','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳'];
  function hebrewMonthLabel(key: string): string {
    const [year, mon] = key.split('-');
    const mIdx = parseInt(mon) - 1;
    const shortYear = year.slice(2);
    return `${hebrewMonths[mIdx]} ${shortYear}`;
  }
</script>

<section class="at-section" id="aid-trucks">
  <div class="container-wide">
    <!-- Controls -->
    <div class="at-controls reveal" use:reveal>
      <div class="at-toggle-group">
        <span class="at-toggle-label">פילוח לפי</span>
        <div class="at-toggle">
          <button
            class="at-btn"
            class:active={mode === 'classification'}
            onclick={() => { mode = 'classification'; }}
          >סוג סיוע</button>
          <button
            class="at-btn"
            class:active={mode === 'org'}
            onclick={() => { mode = 'org'; }}
          >ארגון תורם</button>
        </div>
      </div>

      <div class="at-toggle-group">
        <span class="at-toggle-label">מדד</span>
        <div class="at-toggle">
          <button
            class="at-btn"
            class:active={metric === 'trucksPerDay'}
            onclick={() => { metric = 'trucksPerDay'; }}
          >משאיות / יום</button>
          <button
            class="at-btn"
            class:active={metric === 'tonsPerDay'}
            onclick={() => { metric = 'tonsPerDay'; }}
          >טון / יום</button>
        </div>
      </div>
    </div>

    <!-- Chart + legend wrapper -->
    <div class="at-chart-wrap reveal" use:reveal>

      <!-- SVG chart -->
      <div class="at-chart-container" use:viewport={{ onEnter: () => { chartVisible = true; }, onLeave: () => { chartVisible = false; revealCounter++; }, threshold: 0.15 }}>
        <svg
          bind:this={svgEl}
          viewBox="0 0 {W} {H}"
          class="at-chart"
          overflow="visible"
          role="img"
          aria-label="משאיות סיוע שנכנסו לעזה לפי חודש"
          onpointermove={onPointerMove}
          onpointerleave={onPointerLeave}
          onpointerdown={onPointerDown}
        >
          <!-- Static defs: gradient always present -->
          <defs>
            <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.5"/>
              <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.02"/>
            </linearGradient>
          </defs>

          <!-- Ceasefire highlight bands (rendered first, behind everything) -->
          {#each ceasefireBands as band, bi}
            {@const bandW = band.x2 - band.x1}
            {@const labelX = Math.max(PAD.left + bandW / 2, Math.min(band.midX, W - PAD.right - bandW / 2))}
            {@const anchor = 'middle'}
            <rect
              x={band.x1}
              y={PAD.top}
              width={bandW}
              height={CH}
              class="at-ceasefire-band"
            />
            <!-- Two-row label above chart area -->
            <text x={labelX} text-anchor={anchor}>
              <tspan x={labelX} y={PAD.top - 14} class="at-ceasefire-label">{band.line1}</tspan>
              <tspan x={labelX} dy="10" class="at-ceasefire-label">{band.line2}</tspan>
            </text>
            <!-- Tick line connecting label to band top -->
            <line
              x1={band.midX} y1={PAD.top - 3}
              x2={band.midX} y2={PAD.top}
              class="at-ceasefire-tick"
            />
          {/each}

          <!-- Y axis grid lines + labels -->
          {#each yTicks() as tick}
            {@const y = yPos(tick)}
            <line
              x1={PAD.left} y1={y}
              x2={W - PAD.right} y2={y}
              class="at-gridline"
            />
            <text
              x={PAD.left - 8}
              y={y}
              class="at-axis-label at-axis-label--y"
              dominant-baseline="middle"
              text-anchor="end"
            >{tick === 0 ? '' : fmt(tick)}</text>
          {/each}

          <!-- X axis labels (every 3rd month to avoid crowding) -->
          {#each months as m, i}
            {#if i % 3 === 0 || i === months.length - 1}
              <text
                x={xPos(i)}
                y={H - PAD.bottom + 18}
                class="at-axis-label at-axis-label--x"
                text-anchor="middle"
              >{hebrewMonthLabel(m.key)}</text>
            {/if}
          {/each}

          <!-- Axis baseline -->
          <line
            x1={PAD.left} y1={PAD.top + CH}
            x2={W - PAD.right} y2={PAD.top + CH}
            class="at-axis-line"
          />

          <!-- Lines + area wrapped in a reveal group — clip-path: inset() wipes from right to left on entry -->
          {#if chartVisible}
            {#key revealKey}
              <g class="at-reveal-g">
                <!-- Total area fill -->
                <path d={totalArea} class="at-total-area"/>

                <!-- Sub-series lines (dimmer) -->
                {#each subSeries as sub}
                  {@const isHov = hoveredSub === sub.key}
                  <path
                    role="graphics-symbol"
                    aria-label={sub.key}
                    d={buildPath(sub.series)}
                    class="at-sub-line"
                    class:at-sub-line--hovered={isHov}
                    class:at-sub-line--dimmed={hoveredSub !== null && !isHov}
                    stroke={getColor(sub.key)}
                    onmouseenter={() => { hoveredSub = sub.key; }}
                    onmouseleave={() => { hoveredSub = null; }}
                  />
                {/each}

                <!-- Total line (drawn on top) -->
                <path d={totalPath} class="at-total-line"/>
              </g>
            {/key}
          {/if}

          <!-- Gap band (blockade period) -->
          {#if gapIndices}
            <rect
              x={gapIndices.x1}
              y={PAD.top}
              width={gapIndices.x2 - gapIndices.x1}
              height={CH}
              class="at-gap-band"
            />
            <text x={gapIndices.midX} text-anchor="middle">
              <tspan x={gapIndices.midX} y={PAD.top - 14} class="at-gap-label at-gap-label--small">מצור</tspan>
              <tspan x={gapIndices.midX} dy="10" class="at-gap-label at-gap-label--small">מוחלט</tspan>
            </text>
          {/if}

          <!-- Tooltip vertical rule -->
          {#if tooltipMonth !== null}
            <line
              x1={tooltipX} y1={PAD.top}
              x2={tooltipX} y2={PAD.top + CH}
              class="at-tooltip-rule"
            />
            <!-- Dot on total line -->
            {#if totals[tooltipMonth][metric] > 0}
              <circle
                cx={tooltipX}
                cy={tooltipY}
                r="4"
                class="at-tooltip-dot"
              />
            {/if}
          {/if}
        </svg>

        <!-- HTML tooltip (absolutely positioned over chart) -->
        {#if tooltipData}
          {@const tipLeft = tooltipX / W * 100}
          <div
            class="at-tooltip"
            class:at-tooltip--right={tipLeft > 60}
            style="left: {tipLeft}%;"
          >
            <div class="at-tooltip-month">{tooltipData.month}</div>
            <div class="at-tooltip-total">
              <span class="at-tooltip-total-val">{fmt(tooltipData.total)}</span>
              <span class="at-tooltip-total-unit">{metricUnit()}</span>
            </div>
            <div class="at-tooltip-subs">
              {#each tooltipData.subs as s}
                <div class="at-tooltip-row">
                  <span class="at-tooltip-swatch" style="background:{getColor(s.key)};"></span>
                  <span class="at-tooltip-sub-label">{label(s.key)}</span>
                  <span class="at-tooltip-sub-val">{fmt(s.val)}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
        {#if showTapHint}
          <p class="at-tap-hint">הקש על הגרף לצפייה בנתונים</p>
        {/if}
      </div>

      <!-- Legend -->
      <div class="at-legend">
        <div class="at-legend-total">
          <span class="at-legend-swatch at-legend-swatch--total"></span>
          <span class="at-legend-key">סך הכל</span>
        </div>
        {#each subSeries as sub}
          <button
            class="at-legend-item"
            class:at-legend-item--hovered={hoveredSub === sub.key}
            class:at-legend-item--dimmed={hoveredSub !== null && hoveredSub !== sub.key}
            onmouseenter={() => { hoveredSub = sub.key; }}
            onmouseleave={() => { hoveredSub = null; }}
            onfocus={() => { hoveredSub = sub.key; }}
            onblur={() => { hoveredSub = null; }}
          >
            <span class="at-legend-swatch" style="background:{getColor(sub.key)};"></span>
            <span class="at-legend-key">{label(sub.key)}</span>
          </button>
        {/each}
      </div>
    </div>

    <p class="at-source">מקור: {aidBlockade.source}</p>
  </div>
</section>

<style>
  /* ── Section ───────────────────────────────────────────────────────────── */
  .at-section {
    padding: 0 0 clamp(1.5rem, 4vw, 3rem);
  }

  /* ── Controls ──────────────────────────────────────────────────────────── */
  .at-controls {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
    margin: 2rem 0 1.5rem;
    align-items: center;
  }

  .at-toggle-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .at-toggle-label {
    font-family: var(--font-ui);
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    color: var(--text-muted);
  }

  .at-toggle {
    display: flex;
    border: 1px solid var(--border-mid);
    border-radius: 3px;
    overflow: hidden;
  }

  .at-btn {
    font-family: var(--font-ui);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    padding: 0.3rem 0.85rem;
    background: transparent;
    color: var(--text-muted);
    border: none;
    cursor: pointer;
    transition: background 0.18s, color 0.18s;
    white-space: nowrap;
  }

  .at-btn:hover {
    background: var(--accent-dim);
    color: var(--sand);
  }

  .at-btn.active {
    background: var(--accent);
    color: #1a1509;
    font-weight: 700;
  }

  @media (max-width: 600px) {
    .at-controls { gap: 1rem; }
    .at-btn { padding: 0.6rem 0.85rem; font-size: 0.78rem; min-height: 44px; }
  }

  /* ── Chart wrapper ─────────────────────────────────────────────────────── */
  .at-chart-wrap {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 2rem;
    align-items: start;
  }

  @media (max-width: 720px) {
    .at-chart-wrap {
      grid-template-columns: 1fr;
    }
  }

  /* ── Chart container (relative for tooltip) ────────────────────────────── */
  .at-chart-container {
    position: relative;
    width: 100%;
    min-height: 240px;
    background: var(--bg-card);
    border: 1px solid var(--border-mid);
    border-radius: 3px;
    overflow: visible;
    padding-top: 2rem;
  }

  .at-chart {
    display: block;
    width: 100%;
    height: auto;
    min-height: 220px;
    cursor: crosshair;
    touch-action: pan-y;
    overflow: visible;
  }

  /* ── SVG elements ──────────────────────────────────────────────────────── */
  .at-gridline {
    stroke: var(--border-mid);
    stroke-width: 1;
  }

  .at-axis-line {
    stroke: var(--border-mid);
    stroke-width: 1;
  }

  .at-axis-label {
    font-family: var(--font-ui);
    font-size: 0.6rem;  /* SVG px — will scale */
    fill: var(--text-muted);
  }

  /* Override: SVG px are in the 880-wide viewBox, so need larger nominal size */
  .at-axis-label--y {
    font-size: 10px;
  }
  .at-axis-label--x {
    font-size: 9.5px;
  }

  /* Total area */
  .at-total-area {
    fill: url(#totalGradient);
    opacity: 0.22;
    pointer-events: none;
    transition: d 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  }

  /* Sub-series lines */
  .at-sub-line {
    fill: none;
    stroke-width: 1.5;
    opacity: 0.45;
    transition:
      opacity 0.2s ease,
      stroke-width 0.2s ease,
      d 0.5s cubic-bezier(0.22, 1, 0.36, 1);
    cursor: pointer;
  }

  .at-sub-line--hovered {
    opacity: 1;
    stroke-width: 2.5;
  }

  .at-sub-line--dimmed {
    opacity: 0.1;
  }

  /* Total line */
  .at-total-line {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2.5;
    pointer-events: none;
    transition: d 0.5s cubic-bezier(0.22, 1, 0.36, 1);
    filter: drop-shadow(0 0 6px rgba(196,162,74,0.4));
  }

  /* Chart reveal animation — wipes from right to left using clip-path: inset() on the SVG <g> */
  @keyframes at-reveal {
    from { clip-path: inset(0 100% 0 0); }
    to   { clip-path: inset(0 0% 0 0); }
  }
  :global(.at-reveal-g) {
    animation: at-reveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  /* Ceasefire bands */
  .at-ceasefire-band {
    fill: #2a6b3a;
    opacity: 0.1;
    pointer-events: none;
  }

  .at-ceasefire-label {
    font-family: var(--font-ui);
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.05em;
    fill: #4aaa6a;
    opacity: 0.85;
    pointer-events: none;
  }

  .at-ceasefire-tick {
    stroke: #4aaa6a;
    stroke-width: 1;
    opacity: 0.4;
    pointer-events: none;
  }

  /* Gap band */
  .at-gap-band {
    fill: #8b1a10;
    opacity: 0.12;
    pointer-events: none;
  }

  .at-gap-label {
    font-family: var(--font-ui);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    fill: #c04030;
    pointer-events: none;
  }

  .at-gap-label--small {
    font-size: 8px;
    letter-spacing: 0.05em;
  }

  /* Tooltip rule + dot */
  .at-tooltip-rule {
    stroke: var(--accent);
    stroke-width: 1;
    stroke-dasharray: 3 3;
    opacity: 0.4;
    pointer-events: none;
  }

  .at-tooltip-dot {
    fill: var(--accent);
    stroke: var(--bg-card);
    stroke-width: 2;
    pointer-events: none;
    filter: drop-shadow(0 0 4px rgba(196,162,74,0.6));
  }

  /* ── HTML Tooltip ──────────────────────────────────────────────────────── */
  .at-tooltip {
    position: absolute;
    top: 16px;
    transform: translateX(12px);
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 3px;
    padding: 0.75rem 0.9rem;
    min-width: 170px;
    max-width: min(220px, 85vw);
    pointer-events: none;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15), 0 4px 24px rgba(0,0,0,0.12);
  }

  .at-tooltip--right {
    transform: translateX(calc(-100% - 12px));
  }

  @media (max-width: 480px) {
    .at-tooltip {
      min-width: 0;
      font-size: 0.9em;
    }
  }

  .at-tooltip-month {
    font-family: var(--font-ui);
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    margin-bottom: 0.3rem;
  }

  .at-tooltip-total {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    margin-bottom: 0.6rem;
    padding-bottom: 0.6rem;
    border-bottom: 1px solid var(--border-mid);
  }

  .at-tooltip-total-val {
    font-family: var(--font-ui);
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--accent);
    line-height: 1;
  }

  .at-tooltip-total-unit {
    font-family: var(--font-ui);
    font-size: 0.62rem;
    color: var(--text-muted);
    font-weight: 600;
    letter-spacing: 0.04em;
  }

  .at-tooltip-subs {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .at-tooltip-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .at-tooltip-swatch {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .at-tooltip-sub-label {
    font-family: var(--font-ui);
    font-size: 0.6rem;
    color: var(--sand);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .at-tooltip-sub-val {
    font-family: var(--font-ui);
    font-size: 0.62rem;
    font-weight: 700;
    color: var(--text);
    flex-shrink: 0;
  }

  /* ── Legend ────────────────────────────────────────────────────────────── */
  .at-legend {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding-top: 0.25rem;
    min-width: 160px;
  }

  @media (min-width: 1400px) {
    .at-legend { min-width: 200px; gap: 0.45rem; }
    .at-legend-key { font-size: 0.75rem; }
  }

  @media (max-width: 720px) {
    .at-legend {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 0.4rem 1rem;
    }
  }

  .at-legend-total {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.4rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-mid);
  }

  .at-legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0.15rem 0;
    transition: opacity 0.18s;
    text-align: left;
  }

  .at-legend-item--hovered .at-legend-key {
    color: var(--text);
  }

  .at-legend-item--dimmed {
    opacity: 0.3;
  }

  .at-legend-swatch {
    width: 24px;
    height: 3px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .at-legend-swatch--total {
    background: var(--accent);
    height: 3px;
    box-shadow: 0 0 6px rgba(196,162,74,0.5);
  }

  .at-legend-key {
    font-family: var(--font-ui);
    font-size: 0.65rem;
    color: var(--text-muted);
    line-height: 1.3;
    transition: color 0.15s;
    white-space: nowrap;
  }

  /* ── Source note ───────────────────────────────────────────────────────── */
  .at-source {
    font-family: var(--font-ui);
    font-size: 0.58rem;
    color: var(--text-muted);
    letter-spacing: 0.04em;
    margin-top: 0.8rem;
    opacity: 0.7;
  }

  .at-tap-hint {
    font-family: var(--font-ui);
    font-size: 0.6rem;
    color: var(--text-muted);
    text-align: center;
    padding: 0.4rem 0;
    opacity: 0.7;
    pointer-events: none;
    letter-spacing: 0.04em;
  }
</style>
