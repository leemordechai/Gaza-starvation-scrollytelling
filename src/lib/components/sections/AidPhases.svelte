<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { reveal } from '$lib/actions/reveal';
  import SectionHead from '$lib/components/ui/SectionHead.svelte';
  import phasesData from '$lib/data/aidPhases.json';
  import { aidPhases as aidPhasesText } from '$lib/data/story.js';
  import { animateCounter } from '$lib/utils/counter';

  // ── Sprite sheet layout ───────────────────────────────────────────────────
  // trucks-sprite.png: 1024×546px, 10 cols × 10 rows = 100 variants
  // Source cell: 102.4px wide × 54.6px tall
  // We inset slightly (1px per edge) to avoid bleeding into adjacent cells.
  const SPRITE_COLS  = 10;
  const SPRITE_ROWS  = 10;
  const SPRITE_TOTAL = SPRITE_COLS * SPRITE_ROWS;

  // Render each truck at 38×20px.
  // The sprite sheet (1024×546, 10×10 cells) has thin border lines between cells.
  // We clip each truck div with overflow:hidden and position the background so the
  // border lines fall outside the visible area. INSET=3 crops 3px from each edge,
  // which hides the grid lines that appear between sprite cells.
  const RENDER_W = 38;
  const RENDER_H = 20;
  const INSET    = 3; // px cropped per edge — hides sprite-sheet grid lines

  function spriteStyle(globalIdx: number, color: string): string {
    const variant = globalIdx % SPRITE_TOTAL;
    const col = variant % SPRITE_COLS;
    const row = Math.floor(variant / SPRITE_COLS);
    // Each displayed cell is (RENDER_W - 2*INSET) × (RENDER_H - 2*INSET) visible content.
    // The background-size makes the full sheet fill SPRITE_COLS × that cell width, etc.
    const cellW = RENDER_W - 2 * INSET;
    const cellH = RENDER_H - 2 * INSET;
    const bgW = cellW * SPRITE_COLS;
    const bgH = cellH * SPRITE_ROWS;
    // Shift the background so this cell's content is centred in the visible area.
    // A positive INSET means we move the bg right/down by INSET to push the left/top
    // border line out of view (it goes behind the container's overflow:hidden edge).
    const posX = -(col * cellW) + INSET;
    const posY = -(row * cellH) + INSET;

    const cssFilter = colorFilter(color);

    return [
      `background-image: url('/images/trucks-sprite.png')`,
      `background-size: ${bgW}px ${bgH}px`,
      `background-position: ${posX}px ${posY}px`,
      `background-repeat: no-repeat`,
      `width: ${RENDER_W}px`,
      `height: ${RENDER_H}px`,
      `filter: ${cssFilter}`,
    ].join('; ');
  }

  // Produce a CSS filter string that tints a black-on-white sprite to a target color.
  // Strategy: invert (white bg → black trucks on white → inverted = white trucks on black-ish)
  // then use sepia+saturate+hue-rotate to shift to the target hue, then brightness.
  function colorFilter(hex: string): string {
    // Parse hex to hue (rough approximation for the hues we use)
    const r = parseInt(hex.slice(1,3),16)/255;
    const g = parseInt(hex.slice(3,5),16)/255;
    const b = parseInt(hex.slice(5,7),16)/255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h = 0;
    if (max !== min) {
      const d = max - min;
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    const hueDeg = Math.round(h * 360);
    // brightness reflects lightness of the color
    const l = (max + min) / 2;
    const bright = Math.max(0.5, Math.min(1.0, l * 1.8)).toFixed(2);
    // invert() makes black ink → white ink, then colorize
    return `invert(1) sepia(1) saturate(3) hue-rotate(${hueDeg}deg) brightness(${bright})`;
  }

  // ── Phase definitions (loaded from aidPhases.json) ───────────────────────
  const phases = phasesData;

  // ── Staggered intersection reveal ─────────────────────────────────────────
  let phaseEls: (HTMLElement | undefined)[] = $state(phases.map(() => undefined));
  let visible: boolean[] = $state(phases.map(() => false));
  let daySpanEl: HTMLElement | undefined = $state(undefined);
  let animated: boolean[] = $state(phases.map(() => false));

  $effect(() => {
    phases.forEach((phase, i) => {
      if (visible[i] && !animated[i] && phase.isBlockade) {
        animated[i] = true;
        if (daySpanEl) animateCounter(daySpanEl, 79, 1500);
      }
    });
  });

  onMount(() => {
    if (!browser) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = parseInt(entry.target.getAttribute('data-phase-idx') ?? '-1');
          if (idx >= 0 && entry.isIntersecting && !visible[idx]) {
            visible[idx] = true;
          }
        }
      },
      { threshold: 0.1 }
    );
    phaseEls.forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  });

  // Running icon counter so each phase continues the global variant index
  function getStartIdx(phaseIdx: number): number {
    let total = 0;
    for (let i = 0; i < phaseIdx; i++) total += phases[i].iconCount;
    return total;
  }

  // Seeded shuffle so truck order is random but stable per phase
  function shuffledIndices(count: number, seed: number): number[] {
    const arr = Array.from({ length: count }, (_, i) => i);
    let s = seed;
    for (let i = arr.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      const j = Math.abs(s) % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
</script>

<section class="ap-section" id="aid-phases">
  <div class="container-wide">
    <div class="reveal" use:reveal>
      <SectionHead label={aidPhasesText.sectionLabel} title={aidPhasesText.sectionTitle} sub={aidPhasesText.sectionSub} />
    </div>

    <div class="ap-phases">
      {#each phases as phase, i}
        {@const startIdx = getStartIdx(i)}
        <div
          class="ap-phase"
          class:ap-phase--blockade={phase.isBlockade}
          data-phase-idx={i}
          bind:this={phaseEls[i]}
        >
          <!-- Right (first in RTL): text -->
          <div class="ap-text-col">
            <span class="ap-tag" style="color: {phase.color}; border-color: {phase.color}40;">{phase.tag}</span>
            <h3 class="ap-period">{phase.period}</h3>
            <p class="ap-annotation" style="color: {phase.color};">{phase.annotation}</p>
            <p class="ap-narrative">{phase.narrative}</p>
          </div>

          <!-- Center: truck grid OR blockade void -->
          <div class="ap-grid-col">
            {#if phase.isBlockade}
              <div class="ap-blockade-void" class:ap-blockade-void--visible={visible[i]}>
                <span class="ap-blockade-zero">0</span>
                <span class="ap-blockade-label">חסימה מוחלטת · <span bind:this={daySpanEl}>79</span> יום</span>
              </div>
            {:else}
              {@const order = shuffledIndices(phase.iconCount, i * 997 + 42)}
              <div
                class="ap-grid"
                class:ap-grid--visible={visible[i]}
                aria-label="{phase.iconCount} משאיות, {phase.annotation}"
              >
                {#each order as t}
                  <img
                    class="ap-truck"
                    style="--delay: {Math.min(t * 3, 800)}ms;"
                    src="/images/truck-hand-3.png"
                    width="38" height="24"
                    alt=""
                    aria-hidden="true"
                  />
                {/each}
              </div>
            {/if}
          </div>

          <!-- Left (last in RTL): phase number -->
          <div class="ap-num" style="color: {phase.color};">{phase.num}</div>
        </div>

        {#if i < phases.length - 1}
          <div class="ap-connector" style="border-color: {phase.color}22;"></div>
        {/if}
      {/each}
    </div>

  </div>
</section>

<style>
  /* ── Section ───────────────────────────────────────────────────────────── */
  .ap-section {
    padding: 5rem 0 3rem;
  }

  /* ── Phases list ───────────────────────────────────────────────────────── */
  .ap-phases {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  /* ── Phase row: text | grid | num (renders as: text on right, trucks in middle, num on left in RTL) */
  .ap-phase {
    display: grid;
    grid-template-columns: 28ch 1fr 2rem;
    gap: 1.5rem 2rem;
    padding: 2rem 0;
    border-top: 1px solid var(--border-mid);
    align-items: start;
  }

  .ap-phase--blockade {
    background: #8b1a1008;
  }

  @media (max-width: 900px) {
    .ap-phase {
      grid-template-columns: 1fr 2rem;
      grid-template-rows: auto auto;
    }
    .ap-text-col {
      grid-column: 1;
      grid-row: 1;
    }
    .ap-grid-col {
      grid-column: 1;
      grid-row: 2;
    }
    .ap-num {
      grid-column: 2;
      grid-row: 1;
    }
  }

  @media (max-width: 600px) {
    .ap-phase {
      grid-template-columns: 1fr 1.5rem;
      gap: 0.75rem 1rem;
    }
  }

  /* ── Phase number ──────────────────────────────────────────────────────── */
  .ap-num {
    font-family: var(--font-ui);
    font-size: 2rem;
    font-weight: 900;
    line-height: 1;
    opacity: 0.25;
    padding-top: 0.15rem;
    text-align: center;
  }

  /* ── Grid column ───────────────────────────────────────────────────────── */
  .ap-grid-col {
    min-width: 0;
  }

  /* ── Truck grid ────────────────────────────────────────────────────────── */
  .ap-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0;
    padding: 0.3rem 0.2rem;
    background: var(--bg-card);
    border: 1px solid var(--border-mid);
    border-radius: 3px;
    min-height: 28px;
    line-height: 0;
    font-size: 0;
  }

  .ap-truck {
    display: inline-block;
    vertical-align: top;
    width: 38px;
    height: 24px;
    object-fit: fill;
    opacity: 0;
    transform: scale(0.5);
    transition: opacity 0.12s ease, transform 0.12s ease;
    transition-delay: var(--delay);
  }

  .ap-grid--visible .ap-truck {
    opacity: 1;
    transform: scale(1);
  }

  /* ── Blockade void ─────────────────────────────────────────────────────── */
  .ap-blockade-void {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 1.1rem 1.25rem;
    background: #8b1a1010;
    border: 1px solid #8b1a1050;
    border-radius: 3px;
    opacity: 0;
    transition: opacity 0.8s ease;
    min-height: 28px;
  }

  .ap-blockade-void--visible {
    opacity: 1;
  }

  .ap-blockade-zero {
    font-family: var(--font-ui);
    font-size: 3rem;
    font-weight: 900;
    color: #8b1a10;
    line-height: 1;
    opacity: 0.7;
  }

  .ap-blockade-label {
    font-family: var(--font-ui);
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    color: #c04030;
    opacity: 0.8;
  }

  /* ── Text column ───────────────────────────────────────────────────────── */
  .ap-text-col {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding-top: 0.1rem;
  }

  .ap-tag {
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

  .ap-period {
    font-family: var(--font-disp);
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text);
    line-height: 1.2;
    margin: 0;
  }

  .ap-annotation {
    font-family: var(--font-ui);
    font-size: 0.95rem;
    font-weight: 800;
    line-height: 1;
    margin: 0;
  }

  .ap-narrative {
    font-family: var(--font-body);
    font-size: 0.83rem;
    line-height: 1.65;
    color: var(--text-muted);
    margin: 0.15rem 0 0;
  }

  /* ── Phase connector ───────────────────────────────────────────────────── */
  .ap-connector {
    height: 1px;
    border-top: 1px dashed;
    margin: 0 0 0 3.5rem;
    opacity: 0.25;
  }

  /* ── Source note ───────────────────────────────────────────────────────── */
  .ap-source {
    font-family: var(--font-ui);
    font-size: 0.58rem;
    color: var(--text-muted);
    letter-spacing: 0.04em;
    margin-top: 2rem;
    opacity: 0.7;
  }
</style>
