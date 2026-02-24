<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { reveal } from '$lib/actions/reveal';
  import SectionHead from '$lib/components/ui/SectionHead.svelte';

  let wrapper: HTMLElement;
  let slider: HTMLElement;
  let afterLayer: HTMLElement;
  let handle: HTMLElement;
  let pct = $state(50);
  let dragging = false;

  function updatePosition(clientX: number) {
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    pct = (x / rect.width) * 100;
  }

  function onPointerDown(e: PointerEvent) {
    dragging = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updatePosition(e.clientX);
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    updatePosition(e.clientX);
  }

  function onPointerUp() {
    dragging = false;
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') pct = Math.max(0, pct - 2);
    else if (e.key === 'ArrowRight') pct = Math.min(100, pct + 2);
  }
</script>

<section class="compare-section section-topo" id="compare">
  <div class="container-wide">
    <div class="compare-head reveal" use:reveal>
      <SectionHead label="Visual Evidence" title="Before and After" sub="Drag the slider to compare a Gaza neighborhood before and after military operations" />
    </div>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="compare-wrapper"
      bind:this={wrapper}
      onpointerdown={onPointerDown}
      onpointermove={onPointerMove}
      onpointerup={onPointerUp}
      onpointercancel={onPointerUp}>

      <!-- Before layer -->
      <div class="compare-layer compare-before">
        <img src="/images/before-neighborhood.jpg" alt="Intact Gaza neighborhood with orderly buildings, trees, and a mosque" />
        <span class="compare-label-overlay before-label">Before</span>
      </div>

      <!-- After layer -->
      <div class="compare-layer compare-after" bind:this={afterLayer} style="clip-path: inset(0 0 0 {pct}%);">
        <img src="/images/after-neighborhood.jpg" alt="Same Gaza neighborhood destroyed: collapsed buildings, rubble, craters" />
        <span class="compare-label-overlay after-label">After</span>
      </div>

      <!-- Slider -->
      <div class="compare-slider" bind:this={slider} style="left: {pct}%;">
        <div class="compare-handle" role="slider" aria-label="Comparison slider" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} tabindex={0} onkeydown={onKeyDown}>
          <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M5 3L1 8L5 13" stroke="#0c0b08" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M11 3L15 8L11 13" stroke="#0c0b08" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </div>

    <div class="compare-labels">
      <span>Before</span>
      <span>After</span>
    </div>
  </div>
</section>

<style>
  .compare-section { padding: 5rem 0; }
  .compare-wrapper {
    position: relative;
    max-width: 800px;
    margin: 0 auto;
    aspect-ratio: 3 / 2;
    overflow: hidden;
    border-radius: 2px;
    border: 1px solid var(--border-mid);
    cursor: ew-resize;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
  }
  .compare-layer { position: absolute; inset: 0; }
  .compare-layer img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .compare-slider {
    position: absolute; top: 0; bottom: 0;
    width: 2px; background: var(--gold);
    transform: translateX(-50%); z-index: 3;
    pointer-events: none;
  }
  .compare-handle {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 36px; height: 36px; border-radius: 50%;
    background: var(--gold); border: 2px solid var(--bg);
    box-shadow: 0 0 12px rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center;
    pointer-events: auto;
  }
  .compare-handle :global(svg) { width: 16px; height: 16px; }

  .compare-label-overlay {
    position: absolute;
    bottom: 1rem;
    font-family: var(--font-ui);
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #fff;
    background: rgba(0,0,0,0.55);
    padding: 0.25rem 0.6rem;
    border-radius: 2px;
    pointer-events: none;
  }
  .before-label { left: 1rem; }
  .after-label { right: 1rem; }

  .compare-labels {
    display: flex; justify-content: space-between;
    max-width: 800px; margin: 0.75rem auto 0;
    font-family: var(--font-ui); font-size: 0.7rem;
    font-weight: 600; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--text-muted);
  }
</style>
