<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { fade } from 'svelte/transition';
  import { killScrollTriggers } from '$lib/utils/gsap';
  import { reveal } from '$lib/actions/reveal';
  import SectionHead from '$lib/components/ui/SectionHead.svelte';
  import data from '$lib/data/foodDiversity.json';

  const { foodGroups, steps, maxDays, source } = data;
  const baseline = steps[0].values;
  // Only "scored" groups count toward the diversity score (excludes oil & sugar)
  const scoredGroups = (foodGroups as any[]).filter(g => g.scored !== false);
  const maxScore = maxDays * scoredGroups.length; // 42

  // Compute the step with the lowest diversity score (nadir)
  function _stepScore(step: typeof steps[0]): number {
    return scoredGroups.reduce((s: number, g: any) => s + ((step.values as any)[g.key] ?? 0), 0);
  }
  const nadirStepIndex = steps.reduce((minI, step, i, arr) =>
    _stepScore(step) < _stepScore(arr[minI]) ? i : minI, 0);

  let activeStep = $state(0);
  let triggers: any[] = [];

  // Derived state
  let current = $derived(steps[activeStep]);
  let currentValues = $derived(current.values as Record<string, number | null>);
  let score = $derived(
    scoredGroups.reduce((sum: number, g: any) => sum + ((currentValues[g.key] as number) ?? 0), 0)
  );
  let scorePct = $derived(Math.round((score / maxScore) * 100));
  let baselineScore = $derived(
    scoredGroups.reduce((sum: number, g: any) => sum + (((baseline as any)[g.key] as number) ?? 0), 0)
  );
  let baselinePct = $derived(Math.round((baselineScore / maxScore) * 100));

  /**
   * For a food group value (0–7), compute the fill fraction for a given cell (0–6).
   * Cell 0 fills first, cell 6 fills last.
   */
  function cellFill(value: number, cellIndex: number): number {
    return Math.min(1, Math.max(0, value - cellIndex));
  }

  /**
   * Map fill fraction to visual opacity.
   * 0 → 0 (empty), >0 → at least 0.18 for visibility.
   */
  function fillOpacity(fill: number): number {
    if (fill <= 0) return 0;
    return 0.18 + fill * 0.82;
  }

  onMount(() => {
    if (!browser) return;

    const stepEls = Array.from(document.querySelectorAll('.fd-step')) as HTMLElement[];
    const visible = new Set<number>();

    const stepObs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = stepEls.indexOf(entry.target as HTMLElement);
          if (idx === -1) continue;
          if (entry.isIntersecting) {
            visible.add(idx);
          } else {
            visible.delete(idx);
          }
        }
        if (visible.size > 0) {
          // Pick the lowest-index visible step — the one the user is reading
          activeStep = Math.min(...visible);
        }
      },
      { threshold: 0.05 }
    );
    stepEls.forEach(el => stepObs.observe(el));

    const fakeKill = { kill: () => stepObs.disconnect() } as any;
    triggers.push(fakeKill);
  });

  onDestroy(() => {
    killScrollTriggers(triggers);
  });
</script>

<section class="fd-section section-topo" id="food-diversity">
  <div class="container-wide">
    <div class="reveal" use:reveal>
      <SectionHead
        label={data.sectionLabel}
        title={data.sectionTitle}
        sub={data.sectionSub}
      />
    </div>

    <div class="fd-inner">
    <div class="fd-layout">
      <!-- Sticky visualization -->
      <div class="fd-sticky">
        <div class="fd-viz" class:fd-viz--nadir={activeStep === nadirStepIndex}>
          <!-- Period header -->
          <div class="fd-period">
            <span class="fd-period-tag">{current.tag}</span>
            <h3 class="fd-period-label">{current.period}</h3>
          </div>

          <!-- Score bar -->
          <div class="fd-score">
            <div class="fd-score-header">
              <span class="fd-score-title">מגוון תזונתי</span>
              <span class="fd-score-value">
                {scorePct}<span class="fd-score-unit">%</span>
              </span>
            </div>
            <div class="fd-score-track">
              <div
                class="fd-score-fill"
                style="width: {scorePct}%;"
              ></div>
              <!-- Baseline marker always visible at pre-war position (RTL: right-anchored) -->
              <div
                class="fd-score-baseline"
                class:fd-score-baseline--no-label={activeStep > 0}
                style="left: {100 - baselinePct}%;"
                title="רמה לפני המלחמה: {baselinePct}%"
              ></div>
            </div>
            {#if activeStep > 0}
              <span class="fd-score-delta">
                {scorePct < baselinePct ? '▼' : '▲'}
                {Math.round(Math.abs(scorePct - baselinePct) / baselinePct * 100)}% מרמת התזונה מלפני המלחמה
              </span>
            {/if}
          </div>

          <!-- Nadir annotation — shown only on the worst step -->
          {#if activeStep === nadirStepIndex}
            <div class="fd-nadir-badge" transition:fade={{ duration: 400 }}>
              <span class="fd-nadir-label">⚠ השפל המוחלט — יוני 2025</span>
            </div>
          {/if}

          <!-- Food group grid -->
          <div class="fd-grid">
            {#each foodGroups as group, rowIdx}
              {#if !(group as any).scored && rowIdx > 0 && (foodGroups[rowIdx - 1] as any).scored !== false}
                <div class="fd-divider">
                  <span class="fd-divider-label">גם נעקב לפני 2025</span>
                </div>
              {/if}
              {@const val = (currentValues as Record<string, number | null>)[group.key] ?? null}
              {@const isNull = val === null}
              <div class="fd-row">
                <span class="fd-label" class:fd-label--muted={isNull}>{group.label}</span>
                <div class="fd-cells">
                  {#each { length: maxDays } as _, cellIdx}
                    {#if isNull}
                      <div class="fd-cell fd-cell--null"></div>
                    {:else}
                      {@const fill = cellFill(val as number, cellIdx)}
                      <div
                        class="fd-cell"
                        class:fd-cell--empty={fill <= 0}
                        style="--fill-opacity: {fillOpacity(fill)}; --row: {rowIdx}; --col: {cellIdx};"
                      >
                        <div class="fd-cell-fill"></div>
                      </div>
                    {/if}
                  {/each}
                </div>
                <span class="fd-val" class:fd-val--zero={!isNull && val === 0} class:fd-val--null={isNull}>
                  {isNull ? '—' : val === 0 ? '0' : (val as number).toFixed(1)}
                </span>
              </div>
            {/each}
          </div>

          <!-- Day labels -->
          <div class="fd-day-labels">
            <span class="fd-day-spacer"></span>
            <div class="fd-day-row">
              {#each ['ש', 'ו', 'ה', 'ד', 'ג', 'ב', 'א'] as day}
                <span class="fd-day">{day}</span>
              {/each}
            </div>
            <span class="fd-day-spacer-right"></span>
          </div>

          <!-- Footer -->
          <p class="fd-source">ימים בשבוע · {source}</p>
        </div>
      </div>

      <!-- Scrolling narrative -->
      <div class="fd-narrative">
        {#each steps as step, i}
          <div
            class="fd-step"
            class:active={activeStep === i}
          >
            <span class="fd-step-tag">{step.tag}</span>
            <h3 class="fd-step-heading">{step.heading}</h3>
            <p class="fd-step-body">{step.body}</p>
            {#if step.note}
              <p class="fd-step-note">{step.note}</p>
            {/if}
          </div>
        {/each}
      </div>
    </div>
    </div>
  </div>
</section>

<style>
  /* ===== Nadir badge ===== */
  .fd-nadir-badge {
    background: rgba(139, 26, 16, 0.08);
    border: 1px solid #c04030;
    border-inline-start: 3px solid #c04030;
    padding: 0.3rem 0.65rem;
    border-radius: 2px;
    margin-top: 0.5rem;
    margin-bottom: 1rem;
  }
  .fd-nadir-label {
    font-family: var(--font-ui);
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: #c04030;
  }

  /* ===== Section ===== */
  .fd-section {
    padding: clamp(2.5rem, 7vw, 5rem) 0 2rem;
  }

  /* ===== Narrow wrapper (80% of container-wide) ===== */
  .fd-inner {
    max-width: 80%;
    margin-inline: auto;
  }
  @media (max-width: 760px) {
    .fd-inner { max-width: 100%; }
  }

  /* ===== Layout: sticky viz + scrolling text ===== */
  .fd-layout {
    display: grid;
    grid-template-columns: 0.9fr 1.1fr;
    gap: 4rem;
    align-items: start;
    margin-top: 3rem;
  }

  @media (min-width: 1400px) {
    .fd-layout { gap: 6rem; grid-template-columns: 0.9fr 1.1fr; }
  }

  @media (max-width: 1100px) {
    .fd-layout { gap: 3rem; }
  }

  @media (max-width: 760px) {
    .fd-layout {
      grid-template-columns: 1fr;
      gap: 0;
    }
  }

  /* ===== Sticky panel ===== */
  .fd-sticky {
    position: sticky;
    top: calc(var(--vh, 1vh) * 10);
  }

  @media (max-width: 760px) {
    .fd-sticky {
      position: sticky;
      top: 56px;
      z-index: 5;
      padding-bottom: 0.5rem;
    }
    /* Hide source note on mobile — saves vertical space in sticky panel */
    .fd-sticky .fd-source { display: none; }
  }

  .fd-viz {
    background: var(--bg-card);
    border: 1px solid var(--border-mid);
    border-radius: 3px;
    padding: 1.5rem 1.75rem 1.25rem;
    transition: background 0.7s ease, border-color 0.4s ease;
  }
  .fd-viz--nadir {
    background: rgba(140, 30, 22, 0.06);
    border-color: var(--accent);
  }

  @media (max-width: 760px) {
    .fd-viz {
      padding: 1rem 1rem 0.75rem;
      background: var(--bg-card);
      border-color: var(--border);
    }
  }

  /* ===== Period header ===== */
  .fd-period {
    margin-bottom: 1.25rem;
    border-inline-start: 3px solid var(--accent);
    padding-inline-start: 0.9rem;
  }

  .fd-period-tag {
    font-family: var(--font-ui);
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.22em;
    color: var(--accent);
    display: block;
    margin-bottom: 0.15rem;
  }

  .fd-period-label {
    font-family: var(--font-disp);
    font-size: clamp(1.1rem, 1.8vw, 1.5rem);
    font-weight: 700;
    color: var(--text);
    line-height: 1.2;
    margin: 0 0 0.1rem;
    transition: none;
  }

  @media (max-width: 760px) {
    .fd-period-label { font-size: 1.05rem; }
  }

  /* ===== Score bar ===== */
  .fd-score {
    margin-bottom: 1.25rem;
  }

  .fd-score-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.35rem;
  }

  .fd-score-title {
    font-family: var(--font-ui);
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .fd-score-value {
    font-family: var(--font-ui);
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--accent);
    line-height: 1;
    transition: color 0.4s ease;
  }

  .fd-score-unit {
    font-size: 0.75rem;
    font-weight: 600;
    opacity: 0.7;
  }

  .fd-score-track {
    width: 100%;
    height: 6px;
    background: var(--border);
    border-radius: 3px;
    position: relative;
    overflow: visible;
  }

  .fd-score-fill {
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, var(--accent), var(--accent-light));
    transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
    box-shadow: 0 0 8px rgba(196, 162, 74, 0.3);
  }

  .fd-score-baseline {
    position: absolute;
    top: -18px;
    bottom: -4px;
    width: 2px;
    background: var(--text-muted);
    opacity: 0.6;
    border-radius: 1px;
  }
  .fd-score-baseline::before {
    content: 'לפני המלחמה';
    position: absolute;
    top: 0;
    right: 4px;
    font-family: var(--font-ui);
    font-size: 0.44rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    white-space: nowrap;
  }
  .fd-score-baseline--no-label::before {
    display: none;
  }

  .fd-score-delta {
    display: block;
    font-family: var(--font-ui);
    font-size: 0.58rem;
    font-weight: 600;
    color: var(--text-muted);
    margin-top: 0.3rem;
    letter-spacing: 0.04em;
  }

  /* ===== Food group grid ===== */
  .fd-grid {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .fd-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .fd-label {
    font-family: var(--font-ui);
    font-size: clamp(0.58rem, 0.9vw, 0.68rem);
    font-weight: 600;
    color: var(--sand);
    width: clamp(90px, 12vw, 130px);
    flex-shrink: 0;
    text-align: right;
    letter-spacing: 0.02em;
  }

  @media (max-width: 760px) {
    .fd-label {
      width: 70px;
      font-size: 0.52rem;
    }
  }

  .fd-cells {
    display: flex;
    gap: 3px;
    flex: 1;
  }

  /* ===== Individual cell ===== */
  .fd-cell {
    flex: 1;
    aspect-ratio: 1.3;
    max-width: 32px;
    border-radius: 3px;
    background: var(--border);
    position: relative;
    overflow: hidden;
  }

  .fd-cell-fill {
    position: absolute;
    inset: 0;
    background: var(--accent);
    border-radius: 3px;
    opacity: var(--fill-opacity, 0);
    transition:
      opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1);
    transition-delay: calc(var(--row, 0) * 40ms + var(--col, 0) * 25ms);
  }

  .fd-cell--empty {
    background: rgba(37, 32, 24, 0.6);
  }

  .fd-cell--null {
    background: repeating-linear-gradient(
      45deg,
      var(--border),
      var(--border) 1.5px,
      transparent 1.5px,
      transparent 5px
    );
    opacity: 0.35;
  }

  /* ===== Value display ===== */
  .fd-val {
    font-family: var(--font-ui);
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--accent-light);
    width: 28px;
    flex-shrink: 0;
    text-align: right;
    transition: color 0.4s ease;
  }

  .fd-val--zero {
    color: var(--red-light);
  }

  .fd-val--null {
    color: var(--text-muted);
    opacity: 0.4;
  }

  /* ===== Divider between scored / unscored groups ===== */
  .fd-divider {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.5rem 0 0.3rem;
  }

  .fd-divider::before,
  .fd-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
    opacity: 0.5;
  }

  .fd-divider-label {
    font-family: var(--font-ui);
    font-size: 0.46rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-muted);
    opacity: 0.5;
    white-space: nowrap;
  }

  .fd-label--muted {
    opacity: 0.5;
  }

  @media (max-width: 760px) {
    .fd-val { font-size: 0.6rem; width: 24px; }
    .fd-divider-label { font-size: 0.58rem; opacity: 0.75; }
  }

  /* ===== Day labels ===== */
  .fd-day-labels {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 0.3rem;
  }

  .fd-day-spacer {
    width: clamp(90px, 12vw, 130px);
    flex-shrink: 0;
  }

  @media (max-width: 760px) {
    .fd-day-spacer { width: 70px; }
  }

  .fd-day-row {
    display: flex;
    flex-direction: row-reverse;
    gap: 3px;
    flex: 1;
  }

  .fd-day {
    flex: 1;
    max-width: 32px;
    text-align: center;
    font-family: var(--font-ui);
    font-size: 0.48rem;
    font-weight: 500;
    color: var(--text-muted);
    opacity: 0.5;
    letter-spacing: 0.05em;
  }

  .fd-day-spacer-right {
    width: 28px;
    flex-shrink: 0;
  }

  @media (max-width: 760px) {
    .fd-day-spacer-right { width: 24px; }
  }

  /* ===== Source footer ===== */
  .fd-source {
    font-family: var(--font-ui);
    font-size: 0.72rem;
    color: var(--text-muted);
    opacity: 0.7;
    text-align: end;
    direction: rtl;
    margin-top: 0.75rem;
    letter-spacing: 0.03em;
  }

  /* ===== Narrative steps ===== */
  .fd-narrative {
    padding: 3rem 0 10rem;
  }

  @media (max-width: 760px) {
    .fd-narrative {
      padding: 1.5rem 0 calc(var(--vh, 1vh) * 40);
    }
  }

  @keyframes fd-step-reveal {
    from { opacity: 0.2; }
    to   { opacity: 1; }
  }

  .fd-step {
    padding: 3rem 0;
    min-height: calc(var(--vh, 1vh) * 70);
    display: flex;
    flex-direction: column;
    justify-content: center;
    animation: fd-step-reveal linear both;
    animation-timeline: view();
    /* fade in as step enters from bottom, complete at 30% from top */
    animation-range: entry 0% cover 70%;
  }

  @media (max-width: 760px) {
    .fd-step {
      min-height: calc(var(--vh, 1vh) * 50);
      animation: none;
      opacity: 0.3;
      transition: opacity 0.25s ease;
      padding: 1.75rem 0;
      border-bottom: 1px solid var(--border);
    }
    .fd-step.active { opacity: 1; }
    .fd-step:last-child { border-bottom: none; }
  }

.fd-step-tag {
    font-family: var(--font-ui);
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 0.5rem;
    display: block;
  }

  .fd-step-heading {
    font-family: var(--font-disp);
    font-size: clamp(1.2rem, 2vw, 1.65rem);
    font-weight: 700;
    color: var(--text);
    margin-bottom: 0.8rem;
    line-height: 1.25;
  }

  .fd-step-body {
    font-family: var(--font-body);
    font-size: clamp(0.9rem, 1.2vw, 1.05rem);
    line-height: 1.78;
    color: var(--text);
    white-space: pre-line;
  }

  .fd-step-note {
    font-family: var(--font-ui);
    font-size: 0.6rem;
    color: var(--text-muted);
    margin-top: 0.75rem;
    font-style: italic;
    line-height: 1.5;
    opacity: 0.7;
  }
</style>
