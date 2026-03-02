<script lang="ts">
  import SectionHead from '$lib/components/ui/SectionHead.svelte';
  import explorerData from '$lib/data/priceExplorer.json';

  // ── Chart geometry ──────────────────────────────────────────────────────────
  const W = 640, H = 300;
  const PAD = { top: 32, right: 24, bottom: 50, left: 62 };
  const CW = W - PAD.left - PAD.right;
  const CH = H - PAD.top - PAD.bottom;

  // ── State ───────────────────────────────────────────────────────────────────
  let activeCategory = $state<'food' | 'nonfood'>('food');
  let activeCommodity = $state('Wheat Flour');

  // ── Hover state (HTML overlay) ──────────────────────────────────────────────
  type HoverPoint = { svgX: number; svgY: number; price: number; period: string } | null;
  let hoverPoint = $state<HoverPoint>(null);
  let svgEl = $state<SVGSVGElement | null>(null);
  let baselineHover = $state(false);
  let baselineTooltipStyle = $state('');

  // ── Derived data ────────────────────────────────────────────────────────────
  const hebrewNames = explorerData.hebrewNames as Record<string, string>;

  const commodityIcons: Record<string, string> = {
    'Chickpeas': '🫘', 'Cucumbers': '🥒', 'Dry Fava Beans': '🫘',
    'Dry Onions': '🧅', 'Eggplants': '🍆', 'Eggs': '🥚',
    'Egyptian Rice': '🍚', 'Lentils-Brown': '🫘', 'Potatoes': '🥔',
    'Red Lentils': '🫘', 'Salt': '🧂', 'Sugar': '🍬',
    'Sunflower Oil': '🫙', 'Tomatoes': '🍅', 'Wheat Flour': '🌾',
    'Baby Diapers': '🧷', 'Cooking Gas': '🔥', 'Diesel': '⛽',
    'Drinking Water': '💧', 'Firewood': '🪵', 'Gasoline': '⛽',
    'Sanitary Pads': '🩹', 'Tent': '⛺',
  };

  type SeriesPoint = { period: string; price: number };
  type CommodityItem = { unit: string; series: SeriesPoint[] };

  function getCategoryItems(cat: 'food' | 'nonfood'): Record<string, CommodityItem> {
    return (explorerData.categories[cat]?.items ?? {}) as Record<string, CommodityItem>;
  }

  let categoryItems = $derived(getCategoryItems(activeCategory));
  let commodityKeys = $derived(Object.keys(categoryItems));

  $effect(() => {
    const keys = Object.keys(getCategoryItems(activeCategory));
    if (!keys.includes(activeCommodity)) activeCommodity = keys[0] ?? '';
  });

  let currentItem = $derived(categoryItems[activeCommodity] as CommodityItem | undefined);

  // ── Period → timestamp ──────────────────────────────────────────────────────
  function periodToMs(p: string): number {
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

  const DOMAIN_START = new Date(2024, 4, 1).getTime();
  const DOMAIN_END   = new Date(2026, 2, 1).getTime();
  const DOMAIN_SPAN  = DOMAIN_END - DOMAIN_START;

  function xPos(period: string): number {
    return PAD.left + ((periodToMs(period) - DOMAIN_START) / DOMAIN_SPAN) * CW;
  }
  function xFromMs(ms: number): number {
    return PAD.left + ((ms - DOMAIN_START) / DOMAIN_SPAN) * CW;
  }
  function yPos(price: number, maxP: number): number {
    return PAD.top + CH - (price / maxP) * CH;
  }

  // ── X-axis ticks ────────────────────────────────────────────────────────────
  const xTicks = [
    { label: "מאי׳ 2024", t: new Date(2024, 4, 1).getTime() },
    { label: "2025",       t: new Date(2025, 0, 1).getTime() },
    { label: "2026",       t: new Date(2026, 0, 1).getTime() },
  ];

  // ── Visible series (domain-filtered) ───────────────────────────────────────
  let visibleSeries = $derived(() => {
    if (!currentItem?.series?.length) return [];
    return currentItem.series.filter(p => periodToMs(p.period) >= DOMAIN_START);
  });

  // ── Derived chart paths ─────────────────────────────────────────────────────
  let maxPrice = $derived(() => {
    if (!currentItem?.series?.length) return 100;
    return Math.max(...currentItem.series.map(p => p.price)) * 1.15;
  });

  let polylinePoints = $derived(() => {
    const pts = visibleSeries();
    if (!pts.length) return '';
    const mp = maxPrice();
    return pts.map(p => `${xPos(p.period).toFixed(1)},${yPos(p.price, mp).toFixed(1)}`).join(' ');
  });

  let fillPoints = $derived(() => {
    const pts = visibleSeries();
    if (!pts.length) return '';
    const mp = maxPrice();
    const coords = pts.map(p => `${xPos(p.period).toFixed(1)},${yPos(p.price, mp).toFixed(1)}`).join(' ');
    const firstX = xPos(pts[0].period).toFixed(1);
    const lastX  = xPos(pts[pts.length - 1].period).toFixed(1);
    const base   = (PAD.top + CH).toFixed(1);
    return `${firstX},${base} ${coords} ${lastX},${base}`;
  });

  // ── Baseline: first data point price ────────────────────────────────────────
  let baselinePrice = $derived(currentItem?.series?.[0]?.price ?? 0);

  // ── Multiplier: peak / first ────────────────────────────────────────────────
  let multiplierText = $derived(() => {
    if (!currentItem?.series || currentItem.series.length < 2) return '';
    const first = currentItem.series[0].price;
    const peak  = Math.max(...currentItem.series.map(p => p.price));
    const mult  = peak / first;
    if (mult < 1.5) return '';
    return `פי ${Math.round(mult)}`;
  });

  // ── HTML tooltip position ───────────────────────────────────────────────────
  let tooltipStyle = $derived(() => {
    if (!hoverPoint || !svgEl) return '';
    const rect  = svgEl.getBoundingClientRect();
    const scaleX = rect.width / W;
    const scaleY = rect.height / H;
    const px = hoverPoint.svgX * scaleX;
    const py = hoverPoint.svgY * scaleY;
    const flipH = hoverPoint.svgX > PAD.left + CW * 0.65;
    const flipV = hoverPoint.svgY > PAD.top + CH * 0.5;
    const left  = flipH ? `${px - 8}px` : `${px + 10}px`;
    const top   = flipV ? `${py - 56}px` : `${py + 8}px`;
    const transform = flipH ? 'translateX(-100%)' : 'none';
    return `left:${left}; top:${top}; transform:${transform};`;
  });

  // ── Hover logic ─────────────────────────────────────────────────────────────
  function handleMouseMove(e: MouseEvent) {
    if (!svgEl) return;
    const rect   = svgEl.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top)  * scaleY;
    const mp     = maxPrice();

    // Data point hover
    if (currentItem?.series?.length) {
      const visible = visibleSeries();
      let nearest: SeriesPoint | null = null;
      let minDist = Infinity;
      for (const pt of visible) {
        const dist = Math.abs(xPos(pt.period) - mouseX);
        if (dist < minDist) { minDist = dist; nearest = pt; }
      }
      hoverPoint = (nearest && minDist < 30) ? {
        svgX: xPos(nearest.period),
        svgY: yPos(nearest.price, mp),
        price: nearest.price,
        period: nearest.period,
      } : null;
    }

    // Baseline hover
    if (baselinePrice > 0) {
      const by = yPos(baselinePrice, mp);
      if (Math.abs(mouseY - by) < 10 && mouseX >= PAD.left && mouseX <= PAD.left + CW) {
        baselineHover = true;
        const tooltipX = e.clientX - rect.left;
        const tooltipY = (by / H) * rect.height;
        baselineTooltipStyle = `left:${tooltipX}px; top:${tooltipY}px;`;
      } else {
        baselineHover = false;
      }
    }
  }

  function handleMouseLeave() { hoverPoint = null; baselineHover = false; }

  // ── Format period ───────────────────────────────────────────────────────────
  function formatPeriod(p: string): string {
    const monthNames = ['ינו׳','פבר׳','מרץ','אפר׳','מאי','יוני','יולי','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳'];
    const parts = p.split('-');
    const month = parseInt(parts[1]) - 1;
    return `${monthNames[month]} ${parts[0]}`;
  }
</script>

<section class="pe-section section-topo" id="price-explorer">
  <div class="container-wide">
    <SectionHead
      label="סייר מחירים"
      title="כל המוצרים — מסקירה לפרטים"
      sub="בחרו קטגוריה ומוצר לצפייה במגמת המחיר מאז מאי 2024. העבירו עכבר על הגרף לנתונים מדויקים."
    />

    <div class="pe-layout">
      <!-- Selector panel (right in RTL) -->
      <div class="pe-selector-col">
        <div class="pe-tabs" role="tablist">
          <button
            class="pe-tab" class:pe-tab--active={activeCategory === 'food'}
            role="tab" aria-selected={activeCategory === 'food'}
            onclick={() => { activeCategory = 'food'; }}
          >🍞 מזון</button>
          <button
            class="pe-tab" class:pe-tab--active={activeCategory === 'nonfood'}
            role="tab" aria-selected={activeCategory === 'nonfood'}
            onclick={() => { activeCategory = 'nonfood'; }}
          >🧴 אחר</button>
        </div>

        <div class="pe-pills" role="group" aria-label="בחר מוצר">
          {#each commodityKeys as key}
            <button
              class="pe-pill" class:pe-pill--active={activeCommodity === key}
              onclick={() => { activeCommodity = key; hoverPoint = null; }}
            >{#if commodityIcons[key]}<span class="pe-pill-icon" aria-hidden="true">{commodityIcons[key]}</span>{/if}{hebrewNames[key] ?? key}</button>
          {/each}
        </div>
      </div>

      <!-- Chart (left in RTL) -->
      <div class="pe-chart-col">
        <div class="pe-chart-wrap">
          <div class="pe-chart-header">
            <span class="pe-chart-name">{hebrewNames[activeCommodity] ?? activeCommodity}</span>
            {#if currentItem}
              <span class="pe-chart-unit">{currentItem.unit}</span>
            {/if}
            {#if multiplierText()}
              <span class="pe-multiplier">{multiplierText()} מהמחיר לפני המלחמה</span>
            {/if}
          </div>

          <!-- SVG wrapper for tooltip positioning -->
          <div class="pe-svg-wrap">
            <svg
              bind:this={svgEl}
              viewBox="0 0 {W} {H}"
              class="pe-svg"
              role="img"
              aria-label="תרשים מחיר {hebrewNames[activeCommodity] ?? activeCommodity}"
              onmousemove={handleMouseMove}
              onmouseleave={handleMouseLeave}
            >
              <defs>
                <linearGradient id="pe-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stop-color="var(--accent)" stop-opacity="0.22"/>
                  <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.02"/>
                </linearGradient>
                <clipPath id="pe-clip">
                  <rect x={PAD.left} y={PAD.top} width={CW} height={CH} />
                </clipPath>
              </defs>

              <!-- Grid lines + Y labels -->
              {#if currentItem}
                {@const mp = maxPrice()}
                {#each [0, 0.25, 0.5, 0.75, 1.0] as frac}
                  {@const y = PAD.top + CH * (1 - frac)}
                  <line x1={PAD.left} y1={y} x2={PAD.left + CW} y2={y} stroke="var(--border)" stroke-width="0.5"/>
                  <text x={PAD.left - 6} y={y + 4} class="pe-axis-label" text-anchor="end">{Math.round(mp * frac)}</text>
                {/each}
              {/if}

              <!-- X-axis ticks -->
              {#each xTicks as tick}
                {@const x = xFromMs(tick.t)}
                <line x1={x} y1={PAD.top + CH} x2={x} y2={PAD.top + CH + 5} stroke="var(--border-mid)" stroke-width="1"/>
                <text x={x} y={PAD.top + CH + 18} class="pe-axis-label" text-anchor="middle">{tick.label}</text>
              {/each}

              <text x={PAD.left - 6} y={PAD.top - 8} class="pe-axis-unit" text-anchor="end">₪</text>

              <!-- Baseline reference line (first / pre-war price) -->
              {#if currentItem && baselinePrice > 0}
                {@const mp = maxPrice()}
                {@const by = yPos(baselinePrice, mp)}
                <line
                  x1={PAD.left} y1={by} x2={PAD.left + CW} y2={by}
                  stroke="var(--accent)" stroke-width="1.2" stroke-dasharray="5 4" opacity="0.55"
                  clip-path="url(#pe-clip)"
                />
              {/if}

              <!-- Area fill -->
              {#if fillPoints()}
                <polygon points={fillPoints()} fill="url(#pe-area-grad)" clip-path="url(#pe-clip)"/>
              {/if}

              <!-- Price line -->
              {#if polylinePoints()}
                <polyline
                  points={polylinePoints()}
                  fill="none"
                  stroke="var(--accent)"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  clip-path="url(#pe-clip)"
                />
              {/if}

              <!-- Data dots -->
              {#if currentItem}
                {@const mp = maxPrice()}
                {#each visibleSeries() as pt}
                  <circle cx={xPos(pt.period)} cy={yPos(pt.price, mp)} r="1.5" fill="var(--accent)" opacity="0.6"/>
                {/each}
              {/if}

              <!-- Crosshair only (no SVG tooltip) -->
              {#if hoverPoint}
                <line
                  x1={hoverPoint.svgX} y1={PAD.top}
                  x2={hoverPoint.svgX} y2={PAD.top + CH}
                  stroke="var(--accent)" stroke-width="1" stroke-dasharray="3 3" opacity="0.4"
                />
                <circle cx={hoverPoint.svgX} cy={hoverPoint.svgY} r="5" fill="var(--accent)" opacity="0.9"/>
              {/if}
            </svg>

            <!-- HTML tooltip — RTL-native -->
            {#if hoverPoint}
              <div class="pe-tooltip" style={tooltipStyle()}>
                <span class="pe-tooltip-period">{formatPeriod(hoverPoint.period)}</span>
                <span class="pe-tooltip-price">₪{hoverPoint.price.toLocaleString('he-IL', { maximumFractionDigits: 2 })}</span>
              </div>
            {/if}

            <!-- Baseline hover tooltip -->
            {#if baselineHover && baselinePrice > 0}
              <div class="pe-baseline-tooltip" style={baselineTooltipStyle}>
                מחיר טרם המלחמה · ₪{baselinePrice.toLocaleString('he-IL', { maximumFractionDigits: 2 })}
              </div>
            {/if}
          </div>

          <p class="pe-source">WFP Market Monitor · ממוצע ממשלות עזה · ש"ח</p>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .pe-section { padding: 4rem 0 2rem; }

  .pe-layout {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1.75rem;
    align-items: start;
  }

  .pe-selector-col {
    width: clamp(160px, 22vw, 210px);
    position: sticky;
    top: 2rem;
  }

  .pe-chart-col { min-width: 0; }

  /* ── Tabs ── */
  .pe-tabs { display: flex; gap: 0.4rem; margin-bottom: 1rem; }

  .pe-tab {
    font-family: var(--font-ui);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    padding: 0.45rem 0.7rem;
    border: 1px solid var(--border-mid);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
    border-radius: 2px;
    flex: 1;
  }
  .pe-tab--active { border-color: var(--accent); color: #fff; background: var(--accent); }
  .pe-tab:hover:not(.pe-tab--active) { border-color: var(--accent); color: var(--accent); }

  /* ── Pills ── */
  .pe-pills { display: flex; flex-direction: column; gap: 0.3rem; }

  .pe-pill {
    font-family: var(--font-ui);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    padding: 0.42rem 0.85rem;
    border: 1px solid var(--border);
    background: var(--bg-card);
    color: var(--text-muted);
    cursor: pointer;
    border-radius: 3px;
    transition: border-color 0.18s, color 0.18s, background 0.18s;
    white-space: nowrap;
    text-align: right;
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }
  .pe-pill--active { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }
  .pe-pill:hover:not(.pe-pill--active) { border-color: rgba(155, 42, 33, 0.35); color: var(--text); }
  .pe-pill-icon { font-size: 1em; opacity: 0.9; flex-shrink: 0; }

  /* ── Chart ── */
  .pe-chart-wrap {
    background: var(--bg-card);
    border: 1px solid var(--border-mid);
    border-top: 2px solid var(--accent);
    padding: 1.25rem 1.25rem 0.75rem;
  }

  .pe-chart-header {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }

  .pe-chart-name { font-family: var(--font-disp); font-size: 1.1rem; font-weight: 700; color: var(--sand); }
  .pe-chart-unit { font-family: var(--font-ui); font-size: 0.6rem; color: var(--text-muted); letter-spacing: 0.04em; }

  .pe-multiplier {
    font-family: var(--font-ui);
    font-size: 0.68rem;
    font-weight: 700;
    color: var(--accent-light);
    margin-right: auto;
    border: 1px solid var(--accent-light);
    padding: 0.1rem 0.5rem;
    border-radius: 2px;
    opacity: 0.9;
  }

  /* ── SVG wrapper + tooltip ── */
  .pe-svg-wrap { position: relative; }

  .pe-svg {
    width: 100%;
    height: auto;
    display: block;
    overflow: visible;
    cursor: crosshair;
  }

  /* HTML tooltip — RTL-native */
  .pe-tooltip {
    position: absolute;
    pointer-events: none;
    background: rgba(250, 246, 244, 0.97);
    border: 1px solid var(--accent);
    border-radius: 3px;
    padding: 0.3rem 0.6rem;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.1rem;
    direction: rtl;
    white-space: nowrap;
    box-shadow: 0 2px 10px rgba(0,0,0,0.13);
    z-index: 10;
  }

  .pe-tooltip-period {
    font-family: var(--font-ui);
    font-size: 0.65rem;
    color: var(--text-muted);
    letter-spacing: 0.02em;
  }

  .pe-tooltip-price {
    font-family: var(--font-ui);
    font-size: 1rem;
    font-weight: 800;
    color: var(--accent);
  }

  .pe-axis-label { font-family: var(--font-ui); font-size: 9px; fill: var(--text-muted); }
  .pe-axis-unit  { font-family: var(--font-ui); font-size: 10px; fill: var(--accent); opacity: 0.7; }

  /* ── Baseline hover tooltip ── */
  .pe-baseline-tooltip {
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

  .pe-source {
    font-family: var(--font-ui);
    font-size: 0.55rem;
    color: var(--text-muted);
    opacity: 0.6;
    margin-top: 0.5rem;
    text-align: center;
  }

  @media (max-width: 640px) {
    .pe-layout { grid-template-columns: 1fr; }
    .pe-selector-col { position: static; width: 100%; }
    .pe-pills { flex-direction: row; flex-wrap: wrap; }
    .pe-pill { flex-direction: row; }
  }
</style>
