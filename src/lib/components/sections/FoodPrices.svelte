<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { initGsap, killScrollTriggers } from '$lib/utils/gsap';
  import { viewport } from '$lib/actions/viewport';
  import SectionHead from '$lib/components/ui/SectionHead.svelte';
  import priceData from '$lib/data/foodPrices.json';
  import { foodPrices as foodPricesText } from '$lib/data/story.js';

  // ── Chart geometry ────────────────────────────────────────────────────────
  const W = 600, H = 300;
  const PAD = { top: 28, right: 20, bottom: 44, left: 58 };
  const CW = W - PAD.left - PAD.right;
  const CH = H - PAD.top - PAD.bottom;

  // ── Active step state ─────────────────────────────────────────────────────
  let activeStep = $state(0);
  let triggers: any[] = [];

  // ── Hover / touch state ────────────────────────────────────────────────────
  type HoverPoint = { svgX: number; svgY: number; price: number; period: string } | null;
  let hoverPoint = $state<HoverPoint>(null);
  let pinnedPoint = $state<HoverPoint>(null);
  let svgEl = $state<SVGSVGElement | null>(null);
  let isTouchDevice = $state(false);
  let showTapHint = $derived(isTouchDevice && pinnedPoint === null);
  let baselineHover = $state(false);
  let baselineHoverStyle = $state('');
  let baselineDrawn = $state(false);

  // ── Current commodity series ──────────────────────────────────────────────
  const commodityKeys = foodPricesText.steps.map(s => s.commodity) as string[];

  type SeriesPoint = { period: string; price: number };
  type CommodityData = { labelHe: string; unit: string; baselinePrice: number; series: SeriesPoint[] };

  function getCommodity(key: string): CommodityData {
    return (priceData.commodities as Record<string, CommodityData>)[key];
  }

  let currentCommodity = $derived(getCommodity(commodityKeys[activeStep]));

  // ── Period → timestamp ────────────────────────────────────────────────────
  function periodToDate(p: string): number {
    const parts = p.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    let day = 15;
    if (parts[2]) {
      if (parts[2].startsWith('W')) day = (parseInt(parts[2].slice(1)) - 1) * 7 + 4;
      if (parts[2].startsWith('H')) day = parts[2] === 'H1' ? 8 : 22;
    }
    return new Date(year, month, day).getTime();
  }

  const WAR_START    = new Date(2023, 9, 1).getTime(); // Oct 2023
  const DOMAIN_END   = new Date(2026, 2, 1).getTime();

  // Per-commodity domain start: first observation after Oct 2023, snapped to month start
  let domainStart = $derived((() => {
    const c = currentCommodity;
    if (!c?.series?.length) return new Date(2024, 4, 1).getTime();
    const postWar = c.series
      .map(p => periodToDate(p.period))
      .filter(t => t > WAR_START);
    if (!postWar.length) return new Date(2024, 4, 1).getTime();
    const earliest = Math.min(...postWar);
    // Snap to first of that month for a clean left edge
    const d = new Date(earliest);
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  })());

  function xPos(period: string): number {
    const t = periodToDate(period);
    return PAD.left + ((t - domainStart) / (DOMAIN_END - domainStart)) * CW;
  }

  function yPos(price: number, maxPrice: number): number {
    return PAD.top + CH - (price / maxPrice) * CH;
  }

  // ── Visible series: only points within the domain ─────────────────────────
  let visibleSeries = $derived(() => {
    const c = currentCommodity;
    if (!c?.series?.length) return [];
    return c.series.filter(p => periodToDate(p.period) >= domainStart);
  });

  // ── Build SVG paths from visible series only ──────────────────────────────
  let chartPolyline = $derived(() => {
    const pts = visibleSeries();
    if (!pts.length) return '';
    const maxP = Math.max(...currentCommodity.series.map(p => p.price)) * 1.1;
    return pts.map(p => `${xPos(p.period).toFixed(1)},${yPos(p.price, maxP).toFixed(1)}`).join(' ');
  });

  let chartFill = $derived(() => {
    const pts = visibleSeries();
    if (!pts.length) return '';
    const maxP = Math.max(...currentCommodity.series.map(p => p.price)) * 1.1;
    const coords = pts.map(p => `${xPos(p.period).toFixed(1)},${yPos(p.price, maxP).toFixed(1)}`).join(' ');
    const firstX = xPos(pts[0].period).toFixed(1);
    const lastX  = xPos(pts[pts.length - 1].period).toFixed(1);
    const base   = (PAD.top + CH).toFixed(1);
    return `${firstX},${base} ${coords} ${lastX},${base}`;
  });

  // ── X-axis ticks — derived so they update with domainStart ────────────────
  let xTicks = $derived((() => {
    const ticks = [];
    // First tick: label the domain start month
    const ds = new Date(domainStart);
    const monthNames = ['ינו׳','פבר׳','מרץ','אפר׳','מאי','יוני','יולי','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳'];
    ticks.push({ label: `${monthNames[ds.getMonth()]} ${ds.getFullYear()}`, t: domainStart });
    // Jan 2025 if it falls inside domain
    const jan25 = new Date(2025, 0, 1).getTime();
    if (jan25 > domainStart) ticks.push({ label: '2025', t: jan25 });
    // Jan 2026 if inside domain
    const jan26 = new Date(2026, 0, 1).getTime();
    if (jan26 > domainStart) ticks.push({ label: '2026', t: jan26 });
    return ticks;
  })());

  function xFromTime(t: number): number {
    return PAD.left + ((t - domainStart) / (DOMAIN_END - domainStart)) * CW;
  }

  // ── Event bands — derived so x positions update with domainStart ───────────
  let events = $derived(priceData.metadata.events.map(e => ({
    ...e,
    x1: xFromTime(new Date(e.start + '-15').getTime()),
    x2: e.end ? xFromTime(new Date(e.end + '-15').getTime()) : xFromTime(DOMAIN_END),
  })));

  // ── Format period for tooltip ─────────────────────────────────────────────
  function formatPeriod(p: string): string {
    const monthNames = ['ינו׳','פבר׳','מרץ','אפר׳','מאי','יוני','יולי','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳'];
    const parts = p.split('-');
    const month = parseInt(parts[1]) - 1;
    return `${monthNames[month]} ${parts[0]}`;
  }

  // ── HTML tooltip position (% of SVG render box) ───────────────────────────
  let tooltipStyle = $derived(() => {
    if (!hoverPoint || !svgEl) return '';
    const rect = svgEl.getBoundingClientRect();
    const scaleX = rect.width / W;
    const scaleY = rect.height / H;
    const px = hoverPoint.svgX * scaleX;
    const py = hoverPoint.svgY * scaleY;
    // Flip tooltip to the left if point is in the right 60% of the chart
    const flipH = hoverPoint.svgX > PAD.left + CW * 0.6;
    const flipV = hoverPoint.svgY > PAD.top + CH * 0.5;
    const left  = flipH ? `${px - 8}px` : `${px + 10}px`;
    const top   = flipV ? `${py - 52}px` : `${py + 8}px`;
    const transform = flipH ? 'translateX(-100%)' : 'none';
    return `left:${left}; top:${top}; transform:${transform};`;
  });

  // ── Pointer handling (unified mouse + touch) ──────────────────────────────
  function findNearest(clientX: number): HoverPoint {
    const c = currentCommodity;
    if (!c?.series?.length || !svgEl) return null;
    const rect = svgEl.getBoundingClientRect();
    const scaleX = W / rect.width;
    const posX = (clientX - rect.left) * scaleX;
    const maxP = Math.max(...c.series.map(p => p.price)) * 1.1;
    const vis = visibleSeries();
    let nearest: SeriesPoint | null = null;
    let minDist = Infinity;
    for (const pt of vis) {
      const dist = Math.abs(xPos(pt.period) - posX);
      if (dist < minDist) { minDist = dist; nearest = pt; }
    }
    if (!nearest || minDist >= 28) return null;
    return {
      svgX: xPos(nearest.period),
      svgY: yPos(nearest.price, maxP),
      price: nearest.price,
      period: nearest.period,
    };
  }

  function handlePointerMove(e: PointerEvent) {
    if (isTouchDevice) return;
    hoverPoint = findNearest(e.clientX);
    // Detect proximity to baseline
    const c = currentCommodity;
    if (c && svgEl) {
      const rect = svgEl.getBoundingClientRect();
      const scaleY = H / rect.height;
      const mouseY = (e.clientY - rect.top) * scaleY;
      const maxP = Math.max(...c.series.map(p => p.price)) * 1.1;
      const by = yPos(c.baselinePrice, maxP);
      if (Math.abs(mouseY - by) < 10) {
        baselineHover = true;
        // Position tooltip: px coords relative to svg-wrap
        const tooltipX = e.clientX - rect.left;
        const tooltipY = (by / H) * rect.height;
        baselineHoverStyle = `left:${tooltipX}px; top:${tooltipY}px;`;
      } else {
        baselineHover = false;
      }
    }
  }

  function handlePointerLeave() {
    if (isTouchDevice) return;
    hoverPoint = null;
    baselineHover = false;
  }

  function handlePointerDown(e: PointerEvent) {
    if (!isTouchDevice) return;
    const candidate = findNearest(e.clientX);
    if (!candidate) { pinnedPoint = null; hoverPoint = null; return; }
    if (candidate.period === pinnedPoint?.period) {
      pinnedPoint = null; hoverPoint = null;
    } else {
      pinnedPoint = candidate; hoverPoint = candidate;
    }
  }

  // ── ScrollTrigger wiring ──────────────────────────────────────────────────
  onMount(async () => {
    if (!browser) return;
    isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    const result = await initGsap();
    if (!result) return;
    const { ScrollTrigger } = result;

    const steps = document.querySelectorAll('.fp-step');
    steps.forEach((step, i) => {
      const st = ScrollTrigger.create({
        trigger: step,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => { activeStep = i; hoverPoint = null; pinnedPoint = null; },
        onEnterBack: () => { activeStep = i; hoverPoint = null; pinnedPoint = null; },
      });
      triggers.push(st);
    });
  });

  onDestroy(() => killScrollTriggers(triggers));
</script>

<section class="fp-section section-topo" id="food-prices">
  <div class="container-wide">
    <SectionHead
      label={foodPricesText.sectionLabel}
      title={foodPricesText.sectionTitle}
      sub={foodPricesText.sectionSub}
    />

    <div class="fp-grid">
      <!-- Scrolling steps — first in DOM = right column in RTL -->
      <div class="fp-steps">
        {#each foodPricesText.steps as step, i}
          <div class="fp-step" class:fp-step--active={activeStep === i} data-step={i}>
            <div class="fp-step-num">{step.num}</div>
            <span class="fp-step-tag">{step.tag}</span>
            <h3 class="fp-step-title">{step.title}</h3>
            <p class="fp-step-body">{step.body}</p>
            <div class="fp-delta">
              <span class="fp-delta-before">{step.beforePrice} <small>ש"ח</small></span>
              <span class="fp-delta-arrow">&#8592;</span>
              <span class="fp-delta-after">{step.afterPrice} <small>ש"ח</small></span>
              <span class="fp-delta-mult">{step.multiplier}</span>
            </div>
            <div class="fp-unit-note">{step.unit}</div>
          </div>
        {/each}
      </div>

      <!-- Sticky chart — second in DOM = left column in RTL -->
      <div class="fp-sticky">
        <div class="fp-chart-wrap" use:viewport={{ onEnter: () => { baselineDrawn = true; }, once: true, threshold: 0.4 }}>
          <div class="fp-commodity-meta">
            <span class="fp-commodity-name">{currentCommodity?.labelHe}</span>
            <span class="fp-commodity-unit">{currentCommodity?.unit}</span>
          </div>

          <!-- SVG wrapper for tooltip positioning -->
          <div class="fp-svg-wrap" style={isTouchDevice ? 'cursor: pointer;' : ''}>
            <svg
              bind:this={svgEl}
              viewBox="0 0 {W} {H}"
              class="fp-svg"
              role="img"
              aria-label="תרשים מחירים"
              onpointermove={handlePointerMove}
              onpointerleave={handlePointerLeave}
              onpointerdown={handlePointerDown}
            >
              <!-- Defs -->
              <defs>
                <linearGradient id="fp-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stop-color="var(--accent)" stop-opacity="0.25"/>
                  <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.02"/>
                </linearGradient>
                <clipPath id="fp-clip">
                  <rect x={PAD.left} y={PAD.top} width={CW} height={CH}/>
                </clipPath>
              </defs>

              <!-- Event bands (no inline labels — placed as HTML overlay below) -->
              {#each events as ev}
                <rect x={ev.x1} y={PAD.top} width={ev.x2 - ev.x1} height={CH} fill={ev.color}/>
              {/each}

              <!-- Y gridlines -->
              {#each [0, 0.25, 0.5, 0.75, 1.0] as frac}
                {@const y = PAD.top + CH * (1 - frac)}
                {@const maxP = currentCommodity ? Math.max(...currentCommodity.series.map(p => p.price)) * 1.1 : 100}
                <line x1={PAD.left} y1={y} x2={PAD.left + CW} y2={y} stroke="var(--border)" stroke-width="0.5"/>
                <text x={PAD.left - 7} y={y + 4} class="fp-axis-label" text-anchor="end">
                  {Math.round(maxP * frac)}
                </text>
              {/each}

              <!-- X axis ticks -->
              {#each xTicks as tick}
                {@const x = xFromTime(tick.t)}
                <line x1={x} y1={PAD.top + CH} x2={x} y2={PAD.top + CH + 5} stroke="var(--border-mid)" stroke-width="1"/>
                <text x={x} y={PAD.top + CH + 19} class="fp-axis-label" text-anchor="middle">{tick.label}</text>
              {/each}

              <!-- Baseline (Sep 2023 price) dashed reference — draws left-to-right on scroll reveal -->
              {#if currentCommodity}
                {@const maxP = Math.max(...currentCommodity.series.map(p => p.price)) * 1.1}
                {@const by = yPos(currentCommodity.baselinePrice, maxP)}
                <g style="clip-path: {baselineDrawn ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)'}; transition: clip-path 0.9s cubic-bezier(0.22, 1, 0.36, 1);">
                  <rect x={PAD.left} y={by} width={CW} height={PAD.top + CH - by}
                    fill="rgba(196,162,74,0.05)" pointer-events="none"/>
                  <line x1={PAD.left} y1={by} x2={PAD.left + CW} y2={by}
                    stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.7"
                    pointer-events="none"/>
                </g>
              {/if}

              <!-- Fill area (clipped to domain) -->
              {#if chartFill()}
                <polygon points={chartFill()} fill="url(#fp-area-grad)" clip-path="url(#fp-clip)"/>
              {/if}

              <!-- Price line (clipped to domain) -->
              {#if chartPolyline()}
                <polyline points={chartPolyline()} fill="none" stroke="var(--accent)" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round" clip-path="url(#fp-clip)"/>
              {/if}

              <!-- Data dots -->
              {#if currentCommodity}
                {@const maxP = Math.max(...currentCommodity.series.map(p => p.price)) * 1.1}
                {#each visibleSeries() as pt}
                  <circle
                    cx={xPos(pt.period)}
                    cy={yPos(pt.price, maxP)}
                    r="1.5"
                    fill="var(--accent)"
                    opacity="0.65"
                  />
                {/each}
              {/if}

              <!-- Hover crosshair dot only -->
              {#if hoverPoint}
                <line
                  x1={hoverPoint.svgX} y1={PAD.top}
                  x2={hoverPoint.svgX} y2={PAD.top + CH}
                  stroke="var(--accent)" stroke-width="1" stroke-dasharray="3 3" opacity="0.4"
                />
                <circle cx={hoverPoint.svgX} cy={hoverPoint.svgY} r="5" fill="var(--accent)" opacity="0.9"/>
              {/if}
            </svg>

            <!-- HTML tooltip — proper RTL, positioned over SVG -->
            {#if hoverPoint}
              <div class="fp-tooltip" style={tooltipStyle()}>
                <span class="fp-tooltip-period">{formatPeriod(hoverPoint.period)}</span>
                <span class="fp-tooltip-price">₪{hoverPoint.price.toLocaleString('he-IL', { maximumFractionDigits: 2 })}</span>
              </div>
            {/if}

            <!-- Event band labels — staggered to avoid overlap at shared boundaries -->
            {#each events as ev, ei}
              {@const midXPct = ((ev.x1 + ev.x2) / 2 / W * 100).toFixed(1)}
              {@const topPct  = (PAD.top / H * 100).toFixed(1)}
              <div
                class="fp-band-label"
                class:fp-band-label--low={ei % 2 === 1}
                style="left:{midXPct}%; top:{topPct}%;"
              >{ev.label}</div>
            {/each}

            <!-- Baseline hover tooltip -->
            {#if baselineHover && currentCommodity}
              <div class="fp-baseline-tooltip" style={baselineHoverStyle}>
                מחיר טרם המלחמה · ₪{currentCommodity.baselinePrice.toLocaleString('he-IL', { maximumFractionDigits: 2 })}
              </div>
            {/if}
          </div>
          {#if showTapHint}
            <p class="fp-tap-hint">הקש על הגרף לצפייה בנתונים</p>
          {/if}

          <p class="fp-source">{foodPricesText.source}</p>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .fp-section { padding: 4rem 0 2rem; }

  /* Steps first (right in RTL), chart second (left in RTL) */
  .fp-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: start;
  }
  @media (max-width: 800px) {
    .fp-grid { grid-template-columns: 1fr; gap: 0; }
    .fp-sticky { order: -1; }
  }

  /* ── Sticky chart ─── */
  .fp-sticky {
    position: sticky;
    top: clamp(4rem, 15vh, 8rem);
    align-self: start;
  }

  .fp-chart-wrap {
    background: var(--bg-card);
    border: 1px solid var(--border-mid);
    border-top: 2px solid var(--accent);
    padding: 1rem 1rem 0.75rem;
  }

  .fp-commodity-meta {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .fp-commodity-name {
    font-family: var(--font-disp);
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--sand);
  }

  .fp-commodity-unit {
    font-family: var(--font-ui);
    font-size: 0.6rem;
    color: var(--text-muted);
    letter-spacing: 0.08em;
  }

  /* ── SVG wrapper for tooltip positioning ─── */
  .fp-svg-wrap {
    position: relative;
    min-height: 200px;
  }

  .fp-svg {
    width: 100%;
    height: auto;
    min-height: 180px;
    display: block;
    overflow: visible;
    cursor: crosshair;
  }

  /* ── Event band labels (HTML, just above chart top edge) ─── */
  .fp-band-label {
    position: absolute;
    /* translateY(-100%) moves up by own height; then -3px gives a tiny gap */
    transform: translateX(-50%) translateY(calc(-100% - 3px));
    font-family: var(--font-ui);
    font-size: 0.52rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    white-space: nowrap;
    pointer-events: none;
    direction: rtl;
  }
  /* Stagger: odd labels go one extra line up to avoid overlap at shared boundaries */
  .fp-band-label--low {
    transform: translateX(-50%) translateY(calc(-200% - 6px));
  }

  /* ── Baseline hover tooltip ─── */
  .fp-baseline-tooltip {
    position: absolute;
    transform: translateX(-50%) translateY(calc(-100% - 6px));
    font-family: var(--font-ui);
    font-size: 0.5rem;
    font-weight: 600;
    color: var(--accent);
    background: rgba(247,242,240,0.97);
    border: 1px solid var(--accent);
    border-radius: 2px;
    padding: 0.12rem 0.4rem;
    white-space: nowrap;
    pointer-events: none;
    direction: rtl;
    box-shadow: 0 1px 6px rgba(0,0,0,0.1);
    z-index: 5;
  }

  /* ── HTML tooltip (RTL-native) ─── */
  .fp-tooltip {
    position: absolute;
    pointer-events: none;
    background: rgba(247, 242, 240, 0.97);
    border: 1px solid var(--accent);
    border-radius: 3px;
    padding: 0.3rem 0.55rem;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.1rem;
    direction: rtl;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    z-index: 10;
  }

  .fp-tooltip-period {
    font-family: var(--font-ui);
    font-size: 0.65rem;
    color: var(--text-muted);
    letter-spacing: 0.03em;
  }

  .fp-tooltip-price {
    font-family: var(--font-ui);
    font-size: 1rem;
    font-weight: 800;
    color: var(--accent);
  }

  .fp-axis-label {
    font-family: var(--font-ui);
    font-size: 11px;
    fill: var(--text-muted);
  }

  .fp-baseline-label {
    font-family: var(--font-ui);
    font-size: 9px;
    fill: var(--accent);
    font-weight: 600;
  }

  .fp-event-label {
    font-family: var(--font-ui);
    fill: var(--text-muted);
    font-weight: 700;
  }

  .fp-source {
    font-family: var(--font-ui);
    font-size: 0.55rem;
    color: var(--text-muted);
    opacity: 0.65;
    margin-top: 0.5rem;
    text-align: center;
  }

  /* ── Steps ─── */
  .fp-steps { padding: 1rem 0 4rem; }

  .fp-step {
    padding: 1.5rem 0;
    min-height: calc(var(--vh, 1vh) * 55);
    display: flex;
    flex-direction: column;
    justify-content: center;
    opacity: 0.3;
    transition: opacity 0.45s ease;
  }

  .fp-step--active { opacity: 1; }

  .fp-step-num {
    font-family: var(--font-ui);
    font-size: 4.5rem;
    font-weight: 800;
    line-height: 1;
    color: var(--border-mid);
    margin-bottom: -0.5rem;
  }

  .fp-step-tag {
    font-family: var(--font-ui);
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--accent);
    margin-bottom: 0.4rem;
  }

  .fp-step-title {
    font-family: var(--font-disp);
    font-size: 1.45rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 0.8rem;
    line-height: 1.25;
  }

  .fp-step-body {
    font-size: 0.97rem;
    line-height: 1.78;
    color: var(--text);
    margin-bottom: 1.25rem;
  }

  /* ── Price delta ─── */
  .fp-delta {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .fp-delta-before {
    font-family: var(--font-ui);
    font-size: 1rem;
    color: var(--text-muted);
    text-decoration: line-through;
    text-decoration-color: var(--border-mid);
  }

  .fp-delta-arrow {
    color: var(--border-mid);
    font-size: 1rem;
  }

  .fp-delta-after {
    font-family: var(--font-ui);
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--accent-light);
  }

  .fp-tap-hint {
    font-family: var(--font-ui);
    font-size: 0.55rem;
    color: var(--text-muted);
    text-align: center;
    padding: 0.25rem 0;
    opacity: 0.65;
    pointer-events: none;
    letter-spacing: 0.04em;
  }

  .fp-delta-before small, .fp-delta-after small {
    font-size: 0.55em;
    font-weight: 500;
    opacity: 0.75;
    margin-inline-start: 0.15em;
  }

  .fp-delta-mult {
    font-family: var(--font-ui);
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--accent);
    background: var(--bg-card);
    border: 1px solid var(--accent);
    padding: 0.1rem 0.4rem;
    border-radius: 2px;
    letter-spacing: 0.04em;
  }

  .fp-unit-note {
    font-family: var(--font-ui);
    font-size: 0.6rem;
    color: var(--text-muted);
    margin-top: 0.4rem;
    letter-spacing: 0.06em;
  }
</style>
