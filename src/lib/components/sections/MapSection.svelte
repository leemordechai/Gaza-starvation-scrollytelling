<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  import SectionHead from '$lib/components/ui/SectionHead.svelte';
  import mapPins from '$lib/data/mapPins.json';
  import { mapTooltip } from '$lib/stores/mapTooltip';

  let selectedPin = $state(-1);

  function showTooltip(e: MouseEvent, pin: typeof mapPins[0]) {
    mapTooltip.set({ visible: true, text: pin.label, x: e.clientX + 12, y: e.clientY - 8 });
  }

  function hideTooltip() {
    mapTooltip.set({ visible: false, text: '', x: 0, y: 0 });
    selectedPin = -1;
  }

  function selectPin(i: number, e: MouseEvent, pin: typeof mapPins[0]) {
    selectedPin = selectedPin === i ? -1 : i;
    showTooltip(e, pin);
  }
</script>

<section class="map-section section-topo" id="map">
  <div class="container-wide">
    <div class="map-head">
      <SectionHead label="Geography" title="Where They Want to Return" sub="Proposed settlement zones based on advocacy documents and historical Gush Katif locations" />
    </div>

    <div class="map-container reveal" use:reveal>
      <div class="map-watermark" aria-hidden="true">
        <p>Interactive Map</p>
        <p>Gaza Strip</p>
        <p>Illustrative</p>
      </div>

      {#each mapPins as pin, i}
        <button
          class="map-pin"
          class:gold={pin.color === 'gold'}
          class:pin-selected={selectedPin === i}
          style="top: {pin.top}%; left: {pin.left}%; animation-delay: {pin.delay}s;"
          aria-label={pin.label}
          onmouseenter={(e) => showTooltip(e, pin)}
          onmouseleave={hideTooltip}
          onclick={(e) => selectPin(i, e, pin)}
        ></button>
        {#if pin.showLabel}
          <span class="map-label-pin" style="top: {pin.top}%; left: {pin.left}%;">{pin.displayLabel}</span>
        {/if}
      {/each}

      <div class="map-legend">
        <div class="map-legend-title">Legend</div>
        <div class="legend-item"><span class="legend-dot red"></span> Proposed resettlement sites</div>
        <div class="legend-item"><span class="legend-dot gold"></span> Former Gush Katif settlements</div>
        <div class="legend-item"><span class="legend-dot green"></span> IDF operational zones</div>
      </div>
    </div>
  </div>
</section>

<!-- Tooltip (portal-like, rendered at section level) -->
<div class="map-tooltip" class:show={$mapTooltip.visible} style="left: {$mapTooltip.x}px; top: {$mapTooltip.y}px;">{$mapTooltip.text}</div>

<style>
  .map-section { padding: 5rem 0; background: var(--bg-section); }
  .map-head { margin-bottom: 2.5rem; }

  .map-container {
    position: relative;
    width: 100%;
    height: 480px;
    background: var(--bg-card);
    background-image: url('/images/map-bg.jpg');
    background-size: cover;
    background-position: center;
    border: 1px solid var(--border-mid);
    overflow: hidden;
  }
  .map-container::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(12, 11, 8, 0.55);
  }

  .map-pin {
    position: absolute;
    width: 10px; height: 10px;
    border-radius: 50%;
    background: var(--red-light);
    border: 2px solid var(--bg);
    transform: translate(-50%, -50%);
    cursor: pointer;
    transition: transform 0.2s;
    z-index: 2;
    padding: 0;
  }
  .map-pin::after {
    content: '';
    position: absolute;
    inset: -5px;
    border-radius: 50%;
    border: 1px solid var(--red-light);
    opacity: 0;
    animation: pinpulse 2.5s ease-out infinite;
  }
  @keyframes pinpulse {
    0% { transform: scale(0.8); opacity: 0.6; }
    100% { transform: scale(3.0); opacity: 0; }
  }
  .map-pin.gold { background: var(--accent); }
  .map-pin.gold::after { border-color: var(--accent); animation-delay: 0.8s; }
  .map-pin:hover { transform: translate(-50%, -50%) scale(1.65); }
  .map-pin.pin-selected { box-shadow: 0 0 0 5px rgba(196, 162, 74, 0.35); }

  .map-label-pin {
    position: absolute;
    transform: translate(8px, -50%);
    font-family: var(--font-ui);
    font-size: 0.58rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    white-space: nowrap;
    pointer-events: none;
  }

  .map-legend {
    position: absolute;
    bottom: 1rem; right: 1rem;
    background: rgba(12, 11, 8, 0.92);
    border: 1px solid var(--border-mid);
    padding: 0.7rem 1rem;
  }
  .map-legend-title {
    font-family: var(--font-ui);
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
  }
  .legend-item {
    font-family: var(--font-ui);
    font-size: 0.58rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.15rem 0;
  }
  .legend-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .legend-dot.red { background: var(--red-light); }
  .legend-dot.gold { background: var(--accent); }
  .legend-dot.green { background: #3a7a5a; }

  .map-watermark {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    pointer-events: none;
  }
  .map-watermark p {
    font-family: var(--font-ui);
    font-size: 0.68rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--text-muted);
    opacity: 0.35;
    line-height: 2;
  }

  .map-tooltip {
    position: fixed;
    background: rgba(12, 11, 8, 0.97);
    border: 1px solid var(--accent);
    color: var(--sand);
    font-family: var(--font-ui);
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.07em;
    padding: 0.3rem 0.7rem;
    border-radius: 2px;
    z-index: 2500;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.18s;
    white-space: nowrap;
  }
  .map-tooltip.show { opacity: 1; }
</style>
