<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { killScrollTriggers } from '$lib/utils/gsap';
  import { viewport } from '$lib/actions/viewport';
  import SectionHead from '$lib/components/ui/SectionHead.svelte';
  import priceData from '$lib/data/foodPrices.json';
  import { foodPrices as foodPricesText } from '$lib/data/story.js';

  // ── Chart geometry ────────────────────────────────────────────────────────
  const W = 360, H = 252;
  const PAD = { top: 20, right: 8, bottom: 36, left: 44 };
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
  let chartVisible = $state(false);
  // Increments each time the line should re-animate (visible + step change)
  let revealKey = $state(0);
  $effect(() => {
    if (chartVisible) revealKey = activeStep;
  });

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

  // Shared domain start across all commodities — May 2024, the earliest post-war observation.
  // Using a fixed value keeps all 4 charts on the same x-axis scale.
  const domainStart = new Date(2024, 4, 1).getTime(); // May 2024

  function xPos(period: string): number {
    const t = periodToDate(period);
    return PAD.left + ((t - domainStart) / (DOMAIN_END - domainStart)) * CW;
  }

  function yPos(price: number, maxPrice: number): number {
    return PAD.top + CH - (price / maxPrice) * CH;
  }

  // ── Visible series: only points within the domain ─────────────────────────
  let visibleSeries = $derived(
    currentCommodity?.series?.filter(p => periodToDate(p.period) >= domainStart) ?? []
  );

  // ── Single maxPrice computation — shared by all chart elements ────────────
  let maxPrice = $derived(
    currentCommodity?.series?.length
      ? Math.max(...currentCommodity.series.map(p => p.price)) * 1.1
      : 100
  );

  // ── Build SVG paths from visible series only ──────────────────────────────
  let chartPolyline = $derived(
    visibleSeries.length
      ? visibleSeries.map(p => `${xPos(p.period).toFixed(1)},${yPos(p.price, maxPrice).toFixed(1)}`).join(' ')
      : ''
  );

  let chartFill = $derived((() => {
    const pts = visibleSeries;
    if (!pts.length) return '';
    const coords = pts.map(p => `${xPos(p.period).toFixed(1)},${yPos(p.price, maxPrice).toFixed(1)}`).join(' ');
    const firstX = xPos(pts[0].period).toFixed(1);
    const lastX  = xPos(pts[pts.length - 1].period).toFixed(1);
    const base   = (PAD.top + CH).toFixed(1);
    return `${firstX},${base} ${coords} ${lastX},${base}`;
  })());

  // ── X-axis ticks ──────────────────────────────────────────────────────────
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

  // ── Event bands ────────────────────────────────────────────────────────────
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
  let _rafPending = false;

  function findNearest(clientX: number): HoverPoint {
    const c = currentCommodity;
    if (!c?.series?.length || !svgEl) return null;
    const rect = svgEl.getBoundingClientRect();
    const scaleX = W / rect.width;
    const posX = (clientX - rect.left) * scaleX;
    const vis = visibleSeries;
    let nearest: SeriesPoint | null = null;
    let minDist = Infinity;
    for (const pt of vis) {
      const dist = Math.abs(xPos(pt.period) - posX);
      if (dist < minDist) { minDist = dist; nearest = pt; }
    }
    if (!nearest || minDist >= 28) return null;
    return {
      svgX: xPos(nearest.period),
      svgY: yPos(nearest.price, maxPrice),
      price: nearest.price,
      period: nearest.period,
    };
  }

  function handlePointerMove(e: PointerEvent) {
    if (isTouchDevice) return;
    if (_rafPending) return;
    _rafPending = true;
    const cx = e.clientX, cy = e.clientY;
    requestAnimationFrame(() => {
      _rafPending = false;
      hoverPoint = findNearest(cx);
      // Detect proximity to baseline
      const c = currentCommodity;
      if (c && svgEl) {
        const rect = svgEl.getBoundingClientRect();
        const scaleY = H / rect.height;
        const mouseY = (cy - rect.top) * scaleY;
        const by = yPos(c.baselinePrice, maxPrice);
        if (Math.abs(mouseY - by) < 10) {
          baselineHover = true;
          const tooltipX = cx - rect.left;
          const tooltipY = (by / H) * rect.height;
          baselineHoverStyle = `left:${tooltipX}px; top:${tooltipY}px;`;
        } else {
          baselineHover = false;
        }
      }
    });
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

  // ── Step activation via IntersectionObserver ──────────────────────────────
  onMount(async () => {
    if (!browser) return;
    isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    const steps = Array.from(document.querySelectorAll('.fp-step')) as HTMLElement[];

    // Use a narrow central band (-35% top/bottom) so only the step occupying
    // the viewport centre triggers. rootMargin shrinks the intersection root so
    // a step must reach the middle 30% of the screen before activating.
    const intersecting = new Set<number>();
    const stepObs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = steps.indexOf(entry.target as HTMLElement);
          if (idx === -1) continue;
          if (entry.isIntersecting) intersecting.add(idx);
          else intersecting.delete(idx);
        }
        if (intersecting.size > 0) {
          activeStep = Math.max(...intersecting);
          hoverPoint = null;
          pinnedPoint = null;
        }
      },
      { rootMargin: '-35% 0px -35% 0px', threshold: 0 }
    );
    steps.forEach(el => stepObs.observe(el));

    const fakeKill = { kill: () => stepObs.disconnect() } as any;
    triggers.push(fakeKill);
  });

  onDestroy(() => killScrollTriggers(triggers));
</script>

<div class="fp-intro section-topo" id="food-prices">
  <div class="container-wide">
    <SectionHead
      label={foodPricesText.sectionLabel}
      title={foodPricesText.sectionTitle}
      sub={foodPricesText.sectionSub}
    />
  </div>
</div>

<section class="fp-section section-topo">
  <div class="container-wide">
    <div class="fp-grid">
      <!-- Scrolling steps — first in DOM = right column in RTL -->
      <div class="fp-steps">
        {#each foodPricesText.steps as step, i}
          <div class="fp-step" class:fp-step--active={activeStep === i} data-step={i}>
            <div class="fp-step-num">{step.num}</div>
            <span class="fp-step-tag">{step.tag}</span>
            <h3 class="fp-step-title">{step.title}</h3>
            <p class="fp-step-body">{step.body}</p>
            <div class="fp-delta-box">
              <div class="fp-delta">
                <span class="fp-delta-before"><span class="fp-delta-before-num">{step.beforePrice}</span> <small>ש"ח</small></span>
                <span class="fp-delta-arrow">&#8592;</span>
                <span class="fp-delta-after">{step.afterPrice} <small>ש"ח</small></span>
                <span class="fp-delta-mult">{step.multiplier}</span>
              </div>
              <div class="fp-unit-note">{step.unit}</div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Sticky chart — second in DOM = left column in RTL -->
      <div class="fp-sticky">
        <div class="fp-chart-wrap" use:viewport={{ onEnter: () => { baselineDrawn = true; chartVisible = true; }, once: true, threshold: 0.4 }}>
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
              <defs>
                <linearGradient id="fp-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stop-color="var(--accent)" stop-opacity="0.25"/>
                  <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.02"/>
                </linearGradient>
                <!-- Static domain clip -->
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
                <line x1={PAD.left} y1={y} x2={PAD.left + CW} y2={y} stroke="var(--border)" stroke-width="0.5"/>
                <text x={PAD.left - 4} y={y + 4} class="fp-axis-label" text-anchor="end">
                  {Math.round(maxPrice * frac)}
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
                {@const by = yPos(currentCommodity.baselinePrice, maxPrice)}
                <g style="clip-path: {baselineDrawn ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)'}; transition: clip-path 0.9s cubic-bezier(0.22, 1, 0.36, 1);">
                  <rect x={PAD.left} y={by} width={CW} height={PAD.top + CH - by}
                    fill="rgba(196,162,74,0.05)" pointer-events="none"/>
                  <line x1={PAD.left} y1={by} x2={PAD.left + CW} y2={by}
                    stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.7"
                    pointer-events="none"/>
                </g>
              {/if}

              <!-- Animated reveal clipPath — only rendered after viewport entry, re-keyed on step change -->
              {#if chartVisible}
                {#key revealKey}
                  <defs>
                    <clipPath id="fp-reveal-clip">
                      <rect class="fp-reveal-rect" x={PAD.left} y={PAD.top} height={CH}/>
                    </clipPath>
                  </defs>
                {/key}
              {/if}

              <!-- Line + area + dots: only rendered after viewport entry so they draw in via animated clip -->
              {#if chartVisible}
                {#if chartFill}
                  <polygon points={chartFill} fill="url(#fp-area-grad)" clip-path="url(#fp-reveal-clip)"/>
                {/if}
                {#if chartPolyline}
                  <polyline points={chartPolyline} fill="none" stroke="var(--accent)" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" clip-path="url(#fp-reveal-clip)"/>
                {/if}
                {#if currentCommodity}
                  {#each visibleSeries as pt}
                    <circle cx={xPos(pt.period)} cy={yPos(pt.price, maxPrice)} r="1.5" fill="var(--accent)" opacity="0.65"
                      clip-path="url(#fp-reveal-clip)"/>
                  {/each}
                {/if}
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
              {@const isCeasefire = ev.label.includes('הפסקת')}
              <div
                class="fp-band-label"
                class:fp-band-label--low={ei % 2 === 1}
                class:fp-band-label--ceasefire={isCeasefire}
                class:fp-band-label--blockade={!isCeasefire}
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
  .fp-intro {
    min-height: calc(var(--vh, 1vh) * 100);
    display: flex;
    align-items: center;
    padding: clamp(2rem, 6vw, 4rem) 0;
    background: var(--bg-section);
  }
  @media (max-width: 768px) {
    .fp-intro {
      min-height: 0;
      padding-block: clamp(2rem, 6vh, 3.5rem);
    }
  }

  .fp-section { padding: 0 0 2rem; background: var(--bg-section); }

  /* Steps first (right in RTL), chart second (left in RTL) */
  .fp-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 3rem;
    align-items: start;
    max-width: 900px;
    margin-inline: auto;
  }
  @media (min-width: 1400px) {
    .fp-grid { max-width: 1000px; gap: 4rem; grid-template-columns: 1.2fr 1fr; }
  }
  @media (max-width: 1100px) {
    .fp-grid { max-width: 100%; }
  }
  @media (max-width: 700px) {
    .fp-grid { grid-template-columns: 1fr; gap: 0; max-width: 100%; }
    .fp-sticky { order: -1; }
  }

  /* ── Sticky chart ─── */
  .fp-sticky {
    position: sticky;
    top: 0;
    height: calc(var(--vh, 1vh) * 100);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-self: start;
    padding: clamp(1.5rem, 3vh, 3rem) 0;
    box-sizing: border-box;
  }

  @media (max-width: 700px) {
    .fp-sticky {
      position: sticky;
      top: 56px; /* below nav */
      height: auto;
      padding: 0.5rem 0 0.75rem;
      z-index: 10;
      background: var(--bg-section);
      /* chart takes ~45vh so steps are visible below */
      max-height: calc(var(--vh, 1vh) * 45);
      justify-content: flex-start;
      /* subtle bottom shadow to separate chart from scrolling steps */
      box-shadow: 0 4px 16px rgba(0,0,0,0.18);
    }
  }

  .fp-chart-wrap {
    background: var(--bg-card);
    border: 1px solid var(--border-mid);
    border-top: 2px solid var(--accent);
    padding: 1.25rem 1.25rem 1rem;
    width: 100%;
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
    min-height: 240px;
  }

  .fp-svg {
    width: 100%;
    height: auto;
    min-height: 240px;
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
  .fp-band-label--ceasefire { color: #4aaa6a; }
  .fp-band-label--blockade  { color: #c04030; }

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

  /* ── Chart reveal animation ─── */
  @keyframes fp-reveal {
    from { width: 0; }
    to   { width: 9999px; }
  }
  :global(.fp-reveal-rect) {
    animation: fp-reveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .fp-axis-label {
    font-family: var(--font-ui);
    font-size: 9px;
    fill: var(--text-muted);
  }

  .fp-source {
    font-family: var(--font-ui);
    font-size: 0.55rem;
    color: var(--text-muted);
    opacity: 0.65;
    margin-top: 0.5rem;
    text-align: end;
    direction: rtl;
  }

  /* ── Steps ─── */
  .fp-steps { padding: 1rem 0 4rem; }

  .fp-step {
    padding: clamp(1.5rem, 12vh, 18vh) 0 1.5rem;
    min-height: calc(var(--vh, 1vh) * 100);
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    opacity: 0.3;
    transition: opacity 0.45s ease;
  }

  /* Last step (cooking gas): same top padding as other steps */
  .fp-step:last-child {
    padding-top: clamp(1.5rem, 12vh, 18vh);
  }

  @media (max-width: 700px) {
    .fp-step {
      /* tall enough so one step fills the lower half of the screen */
      min-height: calc(var(--vh, 1vh) * 55);
      opacity: 0.3;
      padding: 1.5rem 0 1.5rem;
      border-bottom: 1px solid var(--border);
      /* push content down so it's readable below the sticky chart */
      justify-content: center;
    }
    .fp-step--active { opacity: 1; }
    .fp-step:last-child {
      border-bottom: none;
    }
  }

  @media (max-width: 700px) {
    .fp-band-label { font-size: 0.62rem; }
    .fp-baseline-tooltip { font-size: 0.62rem; }
  }

  .fp-step--active { opacity: 1; }

  .fp-step-num {
    font-family: var(--font-ui);
    font-size: clamp(2.5rem, 6vw, 4.5rem);
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
    font-size: clamp(1.2rem, 2vw, 1.6rem);
    font-weight: 700;
    color: var(--text);
    margin-bottom: 0.8rem;
    line-height: 1.25;
  }

  .fp-step-body {
    font-size: clamp(0.9rem, 1.2vw, 1.05rem);
    line-height: 1.78;
    color: var(--text);
    margin-bottom: 1.25rem;
  }

  /* ── Price delta box ─── */
  .fp-delta-box {
    background: rgba(247, 242, 237, 0.07);
    border: 1px solid var(--border);
    border-radius: 3px;
    padding: 0.85rem 1rem 0.7rem;
    display: inline-flex;
    flex-direction: column;
    gap: 0.35rem;
    width: fit-content;
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
  }

  .fp-delta-before-num {
    text-decoration: line-through;
    text-decoration-color: var(--accent);
    text-decoration-thickness: 2px;
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
    letter-spacing: 0.06em;
  }
</style>
