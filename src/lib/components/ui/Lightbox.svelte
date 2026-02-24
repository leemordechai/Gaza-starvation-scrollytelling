<script lang="ts">
  import { lightboxOpen, lightboxContent, closeLightbox } from '$lib/stores/lightbox';

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') closeLightbox();
  }

  function onBackdropClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('lightbox')) closeLightbox();
  }
</script>

<svelte:window on:keydown={onKeyDown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="lightbox" class:open={$lightboxOpen} onclick={onBackdropClick}>
  <div class="lb-inner">
    <button class="lb-close" aria-label="Close" onclick={closeLightbox}>&times;</button>
    <div class="lb-content">
      {@html $lightboxContent.html}
    </div>
    {#if $lightboxContent.caption}
      <p class="lb-caption">{$lightboxContent.caption}</p>
    {/if}
  </div>
</div>

<style>
  .lightbox {
    position: fixed; inset: 0; z-index: 2000;
    background: rgba(6, 5, 3, 0.95);
    backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; pointer-events: none;
    transition: opacity 0.3s;
  }
  .lightbox.open { opacity: 1; pointer-events: all; }

  .lb-inner {
    position: relative;
    max-width: min(90vw, 900px);
    max-height: calc(var(--vh, 1vh) * 88);
    width: 100%;
  }
  .lb-content {
    width: 100%;
    max-height: calc(var(--vh, 1vh) * 78);
    overflow: hidden;
    transform: scale(0.92);
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .lightbox.open .lb-content { transform: scale(1); }
  .lb-content :global(svg) {
    width: 100%; height: auto; display: block;
    max-height: calc(var(--vh, 1vh) * 78);
  }
  .lb-close {
    position: absolute; top: -2.8rem; right: 0;
    background: none; border: 1px solid var(--border-mid);
    color: var(--text-muted); font-size: 0.85rem;
    width: 2.2rem; height: 2.2rem; border-radius: 50%;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: color 0.2s, border-color 0.2s;
  }
  .lb-close:hover { color: var(--gold); border-color: var(--gold); }
  .lb-caption {
    margin-top: 0.65rem;
    font-family: var(--font-ui); font-size: 0.58rem;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--text-muted); text-align: center;
  }
</style>
