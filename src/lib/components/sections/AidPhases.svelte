<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { initGsap, killScrollTriggers } from '$lib/utils/gsap';
  import { animateCounter } from '$lib/utils/counter';
  import phasesData from '$lib/data/aidPhases.json';
  import { aidPhases as aidPhasesText } from '$lib/data/story.js';

  // ── Grid config ───────────────────────────────────────────────────────────
  const GRID_TOTAL = 600;
  const COLS = 30;

  // ── Phase data ────────────────────────────────────────────────────────────
  const phases = phasesData.map(p => ({
    ...p,
    activeCount: Math.min(p.avgPerDay, GRID_TOTAL),
  }));

  function seededShuffle(n: number, seed: number): number[] {
    const arr = Array.from({ length: n }, (_, i) => i);
    let s = seed;
    for (let i = arr.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      const j = Math.abs(s) % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  const shuffles = phases.map((_, i) => seededShuffle(GRID_TOTAL, i * 997 + 42));

  // ── State ─────────────────────────────────────────────────────────────────
  let activePhase = $state(0);
  let counterEl: HTMLElement | undefined = $state(undefined);
  let triggers: any[] = [];

  // ── Derived ───────────────────────────────────────────────────────────────
  let current    = $derived(phases[activePhase]);
  let isBlockade = $derived(current.isBlockade);
  let shuffle    = $derived(shuffles[activePhase]);

  function cellDelay(cellIdx: number, activeCount: number): number {
    if (activeCount === 0) return 0;
    // Shorter animation window on mobile to reduce GPU load
    const maxDelay = typeof window !== 'undefined' && window.innerWidth <= 700 ? 300 : 800;
    return Math.round((cellIdx / GRID_TOTAL) * maxDelay);
  }

  // ── Counter animation on phase change ────────────────────────────────────
  $effect(() => {
    if (counterEl && browser) {
      animateCounter(counterEl, current.avgPerDay, 900);
    }
  });

  // ── GSAP ScrollTrigger ────────────────────────────────────────────────────
  onMount(() => {
    if (!browser) return;

    // --vh is managed globally in +layout.svelte (width-gated, debounced).
    // No local setter needed.

    initGsap().then(result => {
      if (!result) return;
      const { ScrollTrigger } = result;

      // Use IntersectionObserver for step activation — avoids GSAP init-time
      // misfires that happen when triggers are created while the section is
      // already partially scrolled.
      const stepEls = Array.from(document.querySelectorAll('.td-step'));

      // Track which steps are currently intersecting
      const intersecting = new Set<HTMLElement>();

      // Fire when a step's top edge crosses the 40% mark from the top of the viewport.
      // isIntersecting=true means the step just entered that zone (scrolling down into it).
      // Keep activePhase at whatever last fired — don't reset between steps.
      const stepObs = new IntersectionObserver(
        (entries) => {
          const sorted = [...entries].sort((a, b) =>
            stepEls.indexOf(a.target as HTMLElement) - stepEls.indexOf(b.target as HTMLElement)
          );
          for (const entry of sorted) {
            if (entry.isIntersecting) {
              const idx = stepEls.indexOf(entry.target as HTMLElement);
              if (idx !== -1) activePhase = idx;
            }
          }
        },
        { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
      );

      stepEls.forEach(el => stepObs.observe(el));

      // Store cleanup on the triggers array (we repurpose it for the observer)
      const fakeKill = { kill: () => stepObs.disconnect() } as any;
      triggers.push(fakeKill);
    });
  });

  onDestroy(() => {
    killScrollTriggers(triggers);
  });
</script>

<section class="ap-section" id="aid-phases">
  <!-- Section title spans full width above the grid -->
  <div class="container-wide">
    <div class="td-section-head">
      <span class="td-sh-label">{aidPhasesText.sectionLabel}</span>
      <h3 class="td-sh-title">{aidPhasesText.sectionTitle}</h3>
      <p class="td-sh-sub">{aidPhasesText.sectionSub}</p>
    </div>
  </div>

  <div class="container-wide">
    <div class="td-layout">

      <!-- ── Sticky visualization ───────────────────────────────────────── -->
      <div class="td-sticky">

        <!-- Info bar -->
        <div class="td-info" style="--phase-color: {current.color};" class:td-info--blockade={isBlockade}>
          <span class="td-tag" style="color: {current.color}; border-color: {current.color}40;">{current.tag}</span>
          <div class="td-counter-row">
            <span bind:this={counterEl} class="td-counter" style="color: {current.color};">0</span>
            <span class="td-counter-unit">משאיות / יום</span>
          </div>
        </div>

        <!-- Waffle grid -->
        <div class="td-grid-wrap">
          {#key activePhase}
            <div
              class="td-grid"
              style="--cols: {COLS}; --phase-color: {current.color};"
              role="img"
              aria-label="{current.activeCount} מתוך {GRID_TOTAL} משאיות ביום"
            >
              {#each Array(GRID_TOTAL) as _, cellIdx}
                {@const truckIdx = shuffle[cellIdx]}
                {@const active = truckIdx < current.activeCount}
                <span
                  class="td-cell"
                  class:td-cell--active={active}
                  class:td-cell--blockade={isBlockade && !active}
                  style={active ? `--delay: ${cellDelay(cellIdx, current.activeCount)}ms;` : ''}
                >
                  {#if active}
                    <img
                      class="td-truck"
                      src="/images/truck-sketch.png"
                      alt=""
                      aria-hidden="true"
                    />
                  {/if}
                </span>
              {/each}
            </div>
          {/key}

          {#if isBlockade}
            <div class="td-blockade-overlay">
              <div class="td-blockade-days">
                <span class="td-blockade-num">79</span>
                <span class="td-blockade-daylabel">יום</span>
              </div>
              <p class="td-blockade-sub">אפס משאיות</p>
            </div>
          {/if}
        </div>

        <p class="td-scale-note">כל אייקון = משאית אחת ביום</p>
      </div>

      <!-- ── Scrolling narrative ─────────────────────────────────────────── -->
      <div class="td-narrative">
        {#each phases as phase, i}
          {@const MOBILE_TOTAL = 200}
          {@const mobileActive = Math.round((phase.activeCount / GRID_TOTAL) * MOBILE_TOTAL)}
          <div class="td-step" class:td-step--active={activePhase === i} class:td-step--blockade={phase.isBlockade}>

            <!-- Mobile-only inline grid for this phase -->
            <div class="td-step-grid-wrap" aria-hidden="true">
              <div class="td-step-info" style="--step-color: {phase.color};">
                <span class="td-step-counter" style="color:{phase.color};">{phase.avgPerDay}</span>
                <span class="td-step-counter-unit">משאיות / יום</span>
              </div>
              <!-- Mobile grid: 200 cells (10 cols × 20 rows) for compact display -->
            <div class="td-step-grid" role="img" aria-label="{mobileActive} מתוך {MOBILE_TOTAL} משאיות">
                {#each Array(MOBILE_TOTAL) as _, cellIdx}
                  {@const active = cellIdx < mobileActive}
                  <span
                    class="td-step-cell"
                    class:td-step-cell--active={active}
                    class:td-step-cell--blockade={phase.isBlockade && !active}
                  >
                    {#if active}
                      <img class="td-step-truck" src="/images/truck-sketch.png" alt="" aria-hidden="true" />
                    {/if}
                  </span>
                {/each}
              </div>
            </div>

            <span class="td-step-tag" style="color: {phase.color}; border-color: {phase.color}40;">{phase.tag}</span>
            <span class="td-step-period">{phase.period}</span>
            <h3 class="td-step-heading" style="color: {phase.color};">{phase.annotation}</h3>
            <p class="td-step-body">{phase.narrative}</p>
            <p class="td-step-detail">{phase.detail}</p>
          </div>
        {/each}
      </div>

    </div>
  </div>
</section>

<style>
  /* ── Section ──────────────────────────────────────────────────────────── */
  .ap-section {
    padding: clamp(1rem, 3vw, 2rem) 0 clamp(1.5rem, 4vw, 3rem);
  }

  /* ── Inline section head — sits in the narrative column ──────────────── */
  .td-section-head {
    padding: clamp(1.5rem, 3vh, 2.5rem) 0 clamp(1.5rem, 3vh, 2rem);
    border-bottom: 1px solid rgba(90, 50, 15, 0.18);
    margin-bottom: clamp(1rem, 2vh, 1.5rem);
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .td-sh-label {
    font-family: var(--font-ui);
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #9b2a21;
  }
  .td-sh-title {
    font-family: var(--font-disp);
    font-size: clamp(1.2rem, 2vw, 1.8rem);
    font-weight: 700;
    line-height: 1.2;
    color: #1a0e05;
    margin: 0;
  }
  .td-sh-sub {
    font-family: var(--font-body);
    font-size: 0.82rem;
    line-height: 1.55;
    color: #4a3018;
    opacity: 0.75;
    margin: 0;
  }

  /* ── Two-column layout: wide grid | narrow narrative ─────────────────── */
  .td-layout {
    display: grid;
    grid-template-columns: 1fr 26ch;
    gap: 3rem 2.5rem;
    align-items: start;
    direction: rtl;
  }

  @media (min-width: 1400px) {
    .td-layout { grid-template-columns: 1fr 32ch; gap: 4rem 3.5rem; }
  }

  .td-sticky {
    position: sticky;
    top: calc(var(--vh, 1vh) * 15);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  @media (max-width: 900px) {
    .td-sticky { top: calc(var(--vh, 1vh) * 10); }
  }

  /* ── Info bar ─────────────────────────────────────────────────────────── */
  .td-info {
    display: flex;
    align-items: baseline;
    gap: 1.25rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid var(--phase-color, #7ab3d4);
    transition: border-color 0.4s ease;
  }

  .td-info--blockade { border-color: #8b1a10; }

  .td-tag {
    font-family: var(--font-ui);
    font-size: 0.56rem;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    display: inline-block;
    padding: 0.15rem 0.45rem;
    border: 1px solid;
    border-radius: 2px;
    width: fit-content;
  }

  .td-counter-row {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    line-height: 1;
  }

  .td-counter {
    font-family: var(--font-ui);
    font-size: clamp(1.8rem, 4vw, 3.2rem);
    font-weight: 900;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    transition: color 0.4s ease;
  }

  .td-counter-unit {
    font-family: var(--font-ui);
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--text-muted);
    letter-spacing: 0.04em;
  }

  /* ── Waffle grid ──────────────────────────────────────────────────────── */
  .td-grid-wrap {
    position: relative;
    overflow: hidden;
  }

  .td-blockade-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .td-blockade-days {
    display: flex;
    align-items: flex-end;
    gap: 0.2em;
    line-height: 1;
  }

  .td-blockade-num {
    font-family: var(--font-ui);
    font-size: clamp(6rem, 18vw, 14rem);
    font-weight: 900;
    color: #8b1a10;
    line-height: 1;
    text-shadow: 0 0 60px rgba(139, 26, 16, 0.3);
  }

  .td-blockade-daylabel {
    font-family: var(--font-ui);
    font-size: clamp(1.8rem, 5vw, 4rem);
    font-weight: 700;
    color: #8b1a10;
    opacity: 0.75;
    padding-bottom: 0.12em;
    letter-spacing: 0.02em;
  }

  .td-blockade-sub {
    font-family: var(--font-ui);
    font-size: clamp(0.75rem, 1.8vw, 1.1rem);
    font-weight: 700;
    color: #8b1a10;
    opacity: 0.6;
    letter-spacing: 0.08em;
    text-align: center;
    margin: 0;
    position: absolute;
    bottom: 18%;
    left: 0; right: 0;
  }

  .td-grid {
    display: grid;
    grid-template-columns: repeat(var(--cols, 30), 1fr);
    gap: 2px;
    width: 100%;
  }

  .td-cell {
    aspect-ratio: 935 / 655;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--border, #e8dbd8);
    border-radius: 1px;
    opacity: 0.18;
    transition: background 0.3s ease;
  }

  .td-cell--active {
    background: transparent;
    opacity: 0;
    animation: td-pop 0.18s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    animation-delay: var(--delay, 0ms);
  }

  .td-cell--blockade {
    background: rgba(139, 26, 16, 0.12);
    opacity: 0.25;
  }

  @keyframes td-pop {
    to { opacity: 1; }
  }

  .td-truck {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    mix-blend-mode: multiply;
  }

  /* ── Scale note ───────────────────────────────────────────────────────── */
  .td-scale-note {
    font-family: var(--font-ui);
    font-size: 0.58rem;
    color: var(--text-muted);
    opacity: 0.55;
    letter-spacing: 0.06em;
    margin: 0;
  }

  /* Mobile inline grids: hidden on desktop, shown on mobile via media query */
  .td-step-grid-wrap { display: none; }

  /* ── Narrative steps ──────────────────────────────────────────────────── */
  /* Bottom padding keeps phase 6 pinned at the top long enough for the
     IntersectionObserver to register it before the sticky panel releases. */
  .td-narrative { padding: 1rem 0 calc(var(--vh, 1vh) * 40); }

  .td-step {
    padding: 1.5rem 0;
    min-height: calc(var(--vh, 1vh) * 55);
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.5rem;
    opacity: 0.2;
    transition: opacity 0.5s ease;
    border-top: 1px solid var(--border);
    scroll-snap-align: start;
  }

  .td-step:first-child { border-top: none; padding-top: 0; }
  .td-step--active { opacity: 1; }

  .td-step--blockade {
    background: linear-gradient(to bottom, transparent, #8b1a1006, transparent);
  }

  .td-step-tag {
    font-family: var(--font-ui);
    font-size: 0.56rem;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    display: inline-block;
    padding: 0.15rem 0.45rem;
    border: 1px solid;
    border-radius: 2px;
    width: fit-content;
  }

  .td-step-period {
    font-family: var(--font-ui);
    font-size: 0.62rem;
    font-weight: 500;
    color: var(--text-muted);
    letter-spacing: 0.04em;
    opacity: 0.7;
  }

  .td-step-heading {
    font-family: var(--font-ui);
    font-size: 1.35rem;
    font-weight: 900;
    line-height: 1.1;
    margin: 0;
  }

  .td-step-body {
    font-family: var(--font-body);
    font-size: 0.9rem;
    line-height: 1.7;
    color: var(--text-muted);
    margin: 0.15rem 0 0;
  }

  .td-step-detail {
    font-family: var(--font-ui);
    font-size: 0.65rem;
    color: var(--text-muted);
    opacity: 0.6;
    letter-spacing: 0.07em;
    margin: 0;
  }

  /* ── Laptop / small desktop (1100px and below) ───────────────────────── */
  @media (max-width: 1100px) {
    .td-layout { grid-template-columns: 1fr 22ch; gap: 2.5rem 2rem; }
  }

  /* ── Tablet (900px and below) ─────────────────────────────────────────── */
  @media (max-width: 900px) {
    .td-layout { grid-template-columns: 1fr 20ch; gap: 2rem 1.5rem; }
    .td-step { min-height: calc(var(--vh, 1vh) * 100); }
  }

  /* ── Small tablet / large phone (700px and below) ────────────────────── */
  /* Mobile: single-column, no sticky. Each step is a self-contained card   */
  /* with its own mini-grid above the text. Grid updates via IO on the step. */
  @media (max-width: 700px) {
    .td-layout {
      grid-template-columns: 1fr;
      gap: 0;
    }

    /* Hide the shared sticky panel — mobile uses per-step inline grids */
    .td-sticky { display: none; }

    .td-narrative { padding: 0 0 2rem; }

    .td-step {
      min-height: auto;
      opacity: 1;
      padding: 2rem 0 3rem;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: 0.6rem;
      border-top: 1px solid var(--border);
    }
    .td-step:first-child { border-top: none; }

    /* Per-step inline grid shown only on mobile */
    .td-step-grid-wrap {
      display: block;
      margin-bottom: 1rem;
    }
    .td-step-info {
      display: flex;
      align-items: baseline;
      gap: 1rem;
      padding-bottom: 0.4rem;
      border-bottom: 2px solid var(--step-color, #7ab3d4);
      margin-bottom: 0.5rem;
    }
    .td-step-counter {
      font-family: var(--font-ui);
      font-size: clamp(2rem, 9vw, 2.8rem);
      font-weight: 900;
      line-height: 1;
      color: var(--step-color, #7ab3d4);
      font-variant-numeric: tabular-nums;
    }
    .td-step-counter-unit {
      font-family: var(--font-ui);
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .td-step-grid-wrap {
      max-height: 130px;
      overflow: hidden;
    }
    .td-step-grid {
      display: grid;
      grid-template-columns: repeat(20, 1fr);
      gap: 2px;
      width: 100%;
    }
    .td-step-cell {
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--border, #e8dbd8);
      border-radius: 1px;
      opacity: 0.18;
    }
    .td-step-cell--active {
      background: transparent;
      opacity: 1;
    }
    .td-step-cell--blockade {
      background: rgba(139, 26, 16, 0.12);
      opacity: 0.25;
    }
    .td-step-truck {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
      mix-blend-mode: multiply;
    }
  }

  /* ── Phone (480px and below) ─────────────────────────────────────────── */
  @media (max-width: 480px) {
    .td-grid { grid-template-columns: repeat(10, 1fr); }
    .td-info { flex-wrap: wrap; gap: 0.75rem; }
    .td-counter { font-size: clamp(2rem, 9vw, 2.6rem); }
    .td-blockade-num      { font-size: clamp(4.5rem, 26vw, 8rem); }
    .td-blockade-daylabel { font-size: clamp(1.2rem, 7vw, 2.5rem); }
    .td-step-heading { font-size: 1.15rem; }
    .td-step-body    { font-size: 0.85rem; }
  }
</style>
