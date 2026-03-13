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

  <!-- ── Mobile layout: 6 full-screen cards (grid on top, text below) ──── -->
  <div class="ap-mobile-cards">
    {#each phases as phase, i}
      {@const phaseShuf = shuffles[i]}
      <div class="ap-mob-card" class:ap-mob-card--blockade={phase.isBlockade}>

        <!-- Grid -->
        <div class="ap-mob-grid-wrap">
          <div class="ap-mob-info" style="--phase-color: {phase.color};">
            <span class="ap-mob-tag" style="color:{phase.color}; border-color:{phase.color}40;">{phase.tag}</span>
            <div class="ap-mob-counter-row">
              <span class="ap-mob-counter" style="color:{phase.color};">{phase.avgPerDay}</span>
              <span class="ap-mob-counter-unit">משאיות / יום</span>
            </div>
          </div>
          <div
            class="ap-mob-grid"
            style="--cols: 20;"
            role="img"
            aria-label="{phase.activeCount} מתוך {GRID_TOTAL} משאיות ביום"
          >
            {#each Array(GRID_TOTAL) as _, cellIdx}
              {@const truckIdx = phaseShuf[cellIdx]}
              {@const active = truckIdx < phase.activeCount}
              <span
                class="ap-mob-cell"
                class:ap-mob-cell--active={active}
                class:ap-mob-cell--blockade={phase.isBlockade && !active}
              >
                {#if active}
                  <img class="ap-mob-truck" src="/images/truck-sketch.png" alt="" aria-hidden="true" loading="lazy" />
                {/if}
              </span>
            {/each}
          </div>
          {#if phase.isBlockade}
            <div class="ap-mob-blockade-overlay">
              <span class="ap-mob-blockade-num">79</span>
              <span class="ap-mob-blockade-label">יום</span>
            </div>
          {/if}
        </div>

        <!-- Text -->
        <div class="ap-mob-text">
          <span class="ap-mob-period">{phase.period}</span>
          <h3 class="ap-mob-heading" style="color:{phase.color};">{phase.annotation}</h3>
          <p class="ap-mob-body">{phase.narrative}</p>
          <p class="ap-mob-detail">{phase.detail}</p>
        </div>

      </div>
    {/each}
  </div>

  <div class="container-wide ap-desktop-layout">
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
          <div class="td-step" class:td-step--active={activePhase === i} class:td-step--blockade={phase.isBlockade}>
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

  /* ── Mobile cards: hidden on desktop ─────────────────────────────────── */
  .ap-mobile-cards { display: none; }

  /* ── Small tablet / large phone (700px and below) ────────────────────── */
  /* Mobile: 6 full-screen cards (grid on top, text below). No sticky.      */
  @media (max-width: 700px) {
    /* Hide desktop two-column layout */
    .ap-desktop-layout { display: none; }

    /* Show mobile cards */
    .ap-mobile-cards {
      display: flex;
      flex-direction: column;
      padding: 0 1rem;
    }

    .ap-mob-card {
      min-height: 100svh;
      display: flex;
      flex-direction: column;
      padding: 1rem 0 2rem;
      border-top: 1px solid var(--border, #e8dbd8);
    }
    .ap-mob-card:first-child { border-top: none; }

    /* Grid section: fills available width, fixed aspect for predictable height */
    .ap-mob-grid-wrap {
      position: relative;
      flex: 0 0 auto;
    }

    .ap-mob-info {
      display: flex;
      align-items: baseline;
      gap: 1rem;
      padding-bottom: 0.4rem;
      border-bottom: 2px solid var(--phase-color, #7ab3d4);
      margin-bottom: 0.5rem;
    }

    .ap-mob-tag {
      font-family: var(--font-ui);
      font-size: 0.56rem;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      display: inline-block;
      padding: 0.15rem 0.45rem;
      border: 1px solid;
      border-radius: 2px;
    }

    .ap-mob-counter-row {
      display: flex;
      align-items: baseline;
      gap: 0.4rem;
    }

    .ap-mob-counter {
      font-family: var(--font-ui);
      font-size: clamp(1.8rem, 8vw, 2.6rem);
      font-weight: 900;
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }

    .ap-mob-counter-unit {
      font-family: var(--font-ui);
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .ap-mob-grid {
      display: grid;
      grid-template-columns: repeat(var(--cols, 20), 1fr);
      gap: 2px;
      width: 100%;
    }

    .ap-mob-cell {
      aspect-ratio: 935 / 655;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--border, #e8dbd8);
      border-radius: 1px;
      opacity: 0.18;
    }

    .ap-mob-cell--active {
      background: transparent;
      opacity: 1;
    }

    .ap-mob-cell--blockade {
      background: rgba(139, 26, 16, 0.12);
      opacity: 0.25;
    }

    .ap-mob-truck {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
      mix-blend-mode: multiply;
    }

    .ap-mob-blockade-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.2em;
      pointer-events: none;
    }

    .ap-mob-blockade-num {
      font-family: var(--font-ui);
      font-size: clamp(3rem, 20vw, 6rem);
      font-weight: 900;
      color: #8b1a10;
      line-height: 1;
    }

    .ap-mob-blockade-label {
      font-family: var(--font-ui);
      font-size: clamp(1rem, 6vw, 2rem);
      font-weight: 700;
      color: #8b1a10;
      opacity: 0.75;
      align-self: flex-end;
      padding-bottom: 0.1em;
    }

    /* Text section below the grid */
    .ap-mob-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.5rem;
      padding-top: 1.2rem;
    }

    .ap-mob-period {
      font-family: var(--font-ui);
      font-size: 0.62rem;
      font-weight: 500;
      color: var(--text-muted);
      opacity: 0.7;
      letter-spacing: 0.04em;
    }

    .ap-mob-heading {
      font-family: var(--font-ui);
      font-size: 1.35rem;
      font-weight: 900;
      line-height: 1.1;
      margin: 0;
    }

    .ap-mob-body {
      font-family: var(--font-body);
      font-size: 0.9rem;
      line-height: 1.7;
      color: var(--text-muted);
      margin: 0;
    }

    .ap-mob-detail {
      font-family: var(--font-ui);
      font-size: 0.65rem;
      color: var(--text-muted);
      opacity: 0.6;
      letter-spacing: 0.07em;
      margin: 0;
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
