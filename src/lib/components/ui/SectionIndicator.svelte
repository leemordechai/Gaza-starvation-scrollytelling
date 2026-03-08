<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { activeSection, visitedSections } from '$lib/stores/nav';
  import navData from '$lib/data/nav.json';

  let observer: IntersectionObserver | undefined;

  onMount(() => {
    if (!browser) return;

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target.id) {
            activeSection.set(entry.target.id);
            visitedSections.update(s => { const next = new Set(s); next.add(entry.target.id); return next; });
          }
        }
      },
      { threshold: 0.35 }
    );

    for (const ind of navData.indicators) {
      const el = document.querySelector(ind.target);
      if (el) observer.observe(el);
    }
  });

  onDestroy(() => {
    observer?.disconnect();
  });

  function scrollTo(target: string) {
    const el = document.querySelector(target);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
</script>

<div class="section-indicator">
  {#each navData.indicators as ind}
    <button
      class="ind-dot"
      class:ind-active={$activeSection === ind.target.slice(1)}
      data-label={ind.label}
      aria-label={`Go to ${ind.label}`}
      onclick={() => scrollTo(ind.target)}
    ></button>
  {/each}
</div>

<style>
  .section-indicator {
    position: fixed;
    left: 1.25rem;
    top: 50%;
    transform: translateY(-50%);
    z-index: 900;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    align-items: center;
  }
  @media (max-width: 960px) { .section-indicator { display: none; } }

  .ind-dot {
    position: relative;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--border-mid);
    border: none;
    cursor: pointer;
    padding: 0;
    transition: background 0.25s, transform 0.25s;
  }
  .ind-dot:hover,
  .ind-dot.ind-active { background: var(--accent); transform: scale(1.5); }

  .ind-dot::after {
    content: attr(data-label);
    position: absolute;
    left: calc(100% + 10px);
    top: 50%;
    transform: translateY(-50%);
    font-family: var(--font-ui);
    font-size: 0.56rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
  }
  .ind-dot:hover::after { opacity: 1; }
</style>
