<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import SectionHead from '$lib/components/ui/SectionHead.svelte';
  import { initGsap, killScrollTriggers } from '$lib/utils/gsap';
  import { animateCounter } from '$lib/utils/counter';
  import phasesData from '$lib/data/aidPhases.json';

  // ── Grid config ───────────────────────────────────────────────────────────
  // 600 cells = max trucks in any phase; 30 columns × 20 rows
  const GRID_TOTAL = 600;
  const COLS = 30;

  // ── Phase data ────────────────────────────────────────────────────────────
  const phases = phasesData.map(p => ({
    ...p,
    activeCount: Math.min(p.avgPerDay, GRID_TOTAL),
  }));

  // Precompute a seeded shuffle per phase so active cells aren't always top-left
  function seededShuffle(n: number, seed: number): number[] {
    const arr = Array.from({ length: n }, (_, i) => i);
    let s = seed;
    for (let i = arr.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      const j = Math.abs(s) % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr; // arr[i] = display-order index; position i is active if arr[i] < activeCount
  }
  // For each phase, shuffledOrder[phaseIdx] maps cell index → truck index
  // A cell i is active if shuffledOrder[i] < activeCount
  const shuffles = phases.map((_, i) => seededShuffle(GRID_TOTAL, i * 997 + 42));

  // ── State ─────────────────────────────────────────────────────────────────
  let activePhase = $state(0);
  let counterEl: HTMLElement | undefined = $state(undefined);
  let triggers: any[] = [];

  // ── Derived ───────────────────────────────────────────────────────────────
  let current    = $derived(phases[activePhase]);
  let isBlockade = $derived(current.isBlockade);
  let shuffle    = $derived(shuffles[activePhase]);

  // Stagger delay per cell: active cells animate in left-to-right, top-to-bottom
  // Cap at 800ms total so 500 trucks finish in under a second
  function cellDelay(cellIdx: number, activeCount: number): number {
    if (activeCount === 0) return 0;
    return Math.round((cellIdx / GRID_TOTAL) * 800);
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

    const setVh = () => document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px');
    setVh();
    window.addEventListener('resize', setVh, { passive: true });

    initGsap().then(result => {
      if (!result) return;
      const { ScrollTrigger } = result;

      document.querySelectorAll('.td-step').forEach((el, i) => {
        const st = ScrollTrigger.create({
          trigger: el,
          start: 'top center',
          end: 'bottom center',
          onEnter:     () => { activePhase = i; },
          onEnterBack: () => { activePhase = i; },
        });
        triggers.push(st);
      });
    });

    return () => window.removeEventListener('resize', setVh);
  });

  onDestroy(() => {
    killScrollTriggers(triggers);
  });
</script>

<section class="td-section section-topo" id="truck-dots">
  <div class="container-wide">
    <SectionHead
      label="נתח נתונים"
      title="כמה משאיות נכנסו לרצועה?"
      sub="שישה שלבים, שנתיים וחצי"
    />

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
  .td-section {
    padding: clamp(2.5rem, 7vw, 5rem) 0 clamp(3rem, 8vw, 6rem);
  }

  /* ── Two-column layout: wide grid | narrow narrative ─────────────────── */
  .td-layout {
    display: grid;
    grid-template-columns: 1fr 24ch;
    gap: 3rem 2.5rem;
    align-items: start;
    direction: rtl;
  }

  .td-sticky {
    position: sticky;
    top: 70px;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
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
    /* Clip rows that would push below the viewport on short/laptop screens.
       Info bar ≈ 4.5rem, scale note ≈ 1.5rem, gaps ≈ 1.5rem, sticky top = 70px */
    max-height: calc(var(--vh, 1vh) * 100 - 70px - 8rem);
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
    /* position below the days row */
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
    aspect-ratio: 935 / 655; /* matches truck image proportions */
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

  /* Truck image fills its cell */
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
  .td-narrative { padding: 2rem 0 8rem; }

  .td-step {
    padding: 2.5rem 0;
    min-height: calc(var(--vh, 1vh) * 40);
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.5rem;
    opacity: 0.2;
    transition: opacity 0.5s ease;
    border-top: 1px solid var(--border);
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

  /* ── Tablet (900px and below) ─────────────────────────────────────────── */
  @media (max-width: 900px) {
    .td-layout { grid-template-columns: 1fr 20ch; gap: 2rem 1.5rem; }
    .td-step { min-height: calc(var(--vh, 1vh) * 35); }
  }

  /* ── Small tablet / large phone (700px and below) ────────────────────── */
  @media (max-width: 700px) {
    /* Stack: grid on top, narrative below */
    .td-layout { grid-template-columns: 1fr; gap: 0; }

    /* Sticky panel sits just below the nav bar */
    .td-sticky { position: sticky; top: 56px; z-index: 5; }

    /* Reduce grid columns to 20 so trucks stay visible */
    .td-grid { grid-template-columns: repeat(20, 1fr); }

    /* Recalculate max-height for mobile nav offset */
    .td-grid-wrap { max-height: calc(var(--vh, 1vh) * 100 - 56px - 8rem); }

    /* Counter larger on small screens where 4vw is too small */
    .td-counter { font-size: clamp(2rem, 7vw, 2.8rem); }

    /* Blockade days — scale for narrow screens */
    .td-blockade-num      { font-size: clamp(5rem, 22vw, 10rem); }
    .td-blockade-daylabel { font-size: clamp(1.4rem, 6vw, 3rem); }

    /* Steps are all visible when stacked; remove min-height */
    .td-step { min-height: 0; opacity: 1; padding: 1.5rem 0; }
    .td-narrative { padding: 1rem 0 4rem; }
  }

  /* ── Phone (480px and below) ─────────────────────────────────────────── */
  @media (max-width: 480px) {
    /* Further reduce columns so each truck cell stays legible */
    .td-grid { grid-template-columns: repeat(15, 1fr); }

    .td-info { flex-wrap: wrap; gap: 0.75rem; }
    .td-counter { font-size: clamp(2rem, 9vw, 2.6rem); }

    .td-blockade-num      { font-size: clamp(4.5rem, 26vw, 8rem); }
    .td-blockade-daylabel { font-size: clamp(1.2rem, 7vw, 2.5rem); }

    .td-step-heading { font-size: 1.15rem; }
    .td-step-body    { font-size: 0.85rem; }
  }
</style>
