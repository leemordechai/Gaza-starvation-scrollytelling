<script lang="ts">
  import { navVisible } from '$lib/stores/nav';
  import { browser } from '$app/environment';

  function scrollToTop() {
    if (!browser) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
</script>

<button
  class="btt-btn"
  class:btt-btn--visible={$navVisible}
  onclick={scrollToTop}
  aria-label="חזור לראש הדף"
  title="חזור לראש הדף"
>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
</button>

<style>
  .btt-btn {
    position: fixed;
    inset-inline-end: 1.5rem;
    bottom: 2rem;
    z-index: 500;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(12, 11, 8, 0.88);
    border: 1px solid rgba(196, 162, 74, 0.35);
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.4s ease, transform 0.4s ease, border-color 0.2s, color 0.2s, background 0.2s;
    pointer-events: none;
    backdrop-filter: blur(8px);
  }

  .btt-btn--visible {
    opacity: 1;
    transform: translateY(0);
    pointer-events: all;
  }

  .btt-btn:hover {
    border-color: rgba(196, 162, 74, 0.8);
    color: rgba(196, 162, 74, 0.9);
    background: rgba(12, 11, 8, 0.95);
  }
</style>
