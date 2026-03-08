<script lang="ts">
  import { viewport } from '$lib/actions/viewport';
  import { animateCounter } from '$lib/utils/counter';
  import statsData from '$lib/data/stats.json';

  let items: HTMLElement[] = [];
  let animated = false;

  function onEnter() {
    if (animated) return;
    animated = true;
    for (const el of items) {
      const numEl = el.querySelector('.stat-num') as HTMLElement;
      const fillEl = el.querySelector('.stat-bar-fill') as HTMLElement;
      if (numEl) {
        const target = parseInt(numEl.dataset.target || '0');
        animateCounter(numEl, target, 1500);
      }
      if (fillEl) {
        setTimeout(() => { fillEl.style.width = '100%'; }, 80);
      }
      el.classList.add('shown');
    }
  }
</script>

<section class="stats-section" use:viewport={{ onEnter, threshold: 0.5, once: true }}>
  <div class="container-wide">
    <div class="stats-grid">
      {#each statsData as stat, i}
        <div class="stat-item" bind:this={items[i]}>
          <span class="stat-num" data-target={stat.target}>0</span>
          <span class="stat-label">{stat.suffix}{stat.suffix ? ' ' : ''}{stat.label}</span>
          <div class="stat-bar-track"><div class="stat-bar-fill"></div></div>
          <span class="stat-note">{stat.note}</span>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .stats-section {
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    background: var(--bg-card);
    padding: 3rem 0;
    min-height: calc(var(--vh, 1vh) * 100);
    display: flex;
    align-items: center;
    scroll-snap-align: start;
  }
  .stats-section .container-wide {
    width: 100%;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0;
  }
  .stat-item {
    text-align: center;
    padding: 1.5rem;
    border-inline-end: 1px solid var(--border);
    transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .stat-item:last-child { border-inline-end: none; }

  @media (max-width: 600px) {
    .stats-grid {
      grid-template-columns: 1fr 1fr;
    }
    .stat-item {
      border-inline-end: none;
      border-bottom: 1px solid var(--border);
      padding: 1.75rem 1rem;
    }
    /* Remove bottom border from last two items (bottom row) */
    .stat-item:nth-last-child(-n+2) {
      border-bottom: none;
    }
    .stat-num {
      font-size: 2rem;
    }
  }
  :global(.stat-item.shown) {
    animation: statPop 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  }
  @keyframes statPop {
    0% { transform: scale(0.95); }
    50% { transform: scale(1.04); }
    100% { transform: scale(1); }
  }
  .stat-num {
    font-family: var(--font-ui);
    font-size: clamp(2.4rem, 4.5vw, 3.6rem);
    font-weight: 800;
    color: var(--accent);
    line-height: 1;
    display: block;
    margin-bottom: 0.3rem;
  }
  .stat-label {
    font-family: var(--font-ui);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--text-muted);
    display: block;
    margin-bottom: 0.25rem;
  }
  .stat-bar-track {
    width: 55%;
    height: 6px;
    background: var(--border-mid);
    margin: 0.5rem auto 0;
    border-radius: 3px;
    overflow: hidden;
  }
  .stat-bar-fill {
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, var(--accent), var(--accent-light));
    border-radius: 3px;
    transition: width 1.5s cubic-bezier(0.22, 1, 0.36, 1);
    box-shadow: 2px 0 8px var(--accent);
  }
  .stat-note {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-style: italic;
    line-height: 1.4;
  }
</style>
