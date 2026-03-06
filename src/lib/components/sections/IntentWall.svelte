<script lang="ts">
  import { onMount } from 'svelte';
  import data from '$lib/data/intentQuotes.json';

  const quotes = data.quotes;

  let wallEl: HTMLElement;
  let visible = $state<Set<number>>(new Set());

  // Tooltip state — pinned=true when user clicked to lock it open
  let tooltip = $state<{ q: typeof quotes[0]; x: number; y: number; pinned: boolean } | null>(null);
  let tooltipEl: HTMLElement;

  onMount(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = Number((entry.target as HTMLElement).dataset.id);
            visible = new Set([...visible, id]);
          }
        });
      },
      { threshold: 0.08 }
    );

    wallEl.querySelectorAll('.quote-card').forEach(card => obs.observe(card));
    return () => obs.disconnect();
  });

  function showTooltip(e: MouseEvent, q: typeof quotes[0]) {
    if (tooltip?.pinned) return; // don't replace a pinned tooltip on hover
    const wall = wallEl.getBoundingClientRect();
    tooltip = { q, x: e.clientX - wall.left, y: e.clientY - wall.top, pinned: false };
  }

  function moveTooltip(e: MouseEvent) {
    if (!tooltip || tooltip.pinned) return;
    const wall = wallEl.getBoundingClientRect();
    tooltip = { ...tooltip, x: e.clientX - wall.left, y: e.clientY - wall.top };
  }

  function hideTooltip() {
    if (tooltip?.pinned) return;
    tooltip = null;
  }

  function pinTooltip(e: MouseEvent, q: typeof quotes[0]) {
    e.stopPropagation();
    const wall = wallEl.getBoundingClientRect();
    tooltip = { q, x: e.clientX - wall.left, y: e.clientY - wall.top, pinned: true };
  }

  function dismissPinned() {
    if (tooltip?.pinned) tooltip = null;
  }

  function highlightQuote(quote: string, keyPhrase: string): string {
    if (!keyPhrase) return quote;
    const escaped = keyPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return quote.replace(new RegExp(`(${escaped})`, 'g'), '<mark>$1</mark>');
  }
</script>

<section class="intent-section section-topo" id="stated-intent">
  <div class="container-wide">
    <div class="section-header">
      <span class="sh-label">{data.sectionLabel}</span>
      <h2 class="sh-title">{data.sectionTitle}</h2>
      <p class="sh-sub">{data.sectionSubtitle}</p>
    </div>
  </div>

  <p class="wall-footer">העבירו את הסמן מעל כל כרטיס לציטוט המלא · לחצו לנעילת הציטוט</p>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="wall"
    bind:this={wallEl}
    onmousemove={moveTooltip}
    onmouseleave={hideTooltip}
    onclick={dismissPinned}
  >
    {#each quotes as q}
      {@const isVisible = visible.has(Number(q.id))}
      <div
        class="quote-card size-{q.size}"
        class:visible={isVisible}
        class:active={tooltip?.q === q}
        data-id={q.id}
        role="article"
        onmouseenter={(e) => showTooltip(e, q)}
        onclick={(e) => pinTooltip(e, q)}
      >
        <div class="card-inner">
          <div class="key-phrase" dir="rtl">״{q.key_phrase_he}״</div>
          <div class="speaker-block">
            <span class="speaker-name">{q.speaker}</span>
            <span class="speaker-title">{q.title}</span>
          </div>
        </div>
      </div>
    {/each}

    <!-- Floating tooltip -->
    {#if tooltip}
      {@const q = tooltip.q}
      {@const flipX = tooltip.x > 600}
      {@const flipY = tooltip.y > 400}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="tooltip"
        class:flip-x={flipX}
        class:flip-y={flipY}
        class:pinned={tooltip.pinned}
        bind:this={tooltipEl}
        style="--tx: {tooltip.x}px; --ty: {tooltip.y}px"
        dir="rtl"
        onclick={(e) => e.stopPropagation()}
      >
        {#if tooltip.pinned}
          <button class="tt-close" onclick={dismissPinned} aria-label="סגור">✕</button>
        {/if}
        <div class="tt-meta">
          <span class="tt-speaker">{q.speaker}</span>
          <span class="tt-role">{q.title}</span>
        </div>
        <div class="tt-quote">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html highlightQuote(q.quote_he, q.key_phrase_he)}
        </div>
        {#if q.originally_english === 'True'}
          <div class="tt-en" dir="ltr">"{q.quote_en}"</div>
        {/if}
        <div class="tt-footer">
          <a
            class="tt-context"
            href={q.source_url}
            target="_blank"
            rel="noopener noreferrer"
          ><span class="tt-arrow">↗</span><span class="tt-context-text" dir="rtl">{q.context}</span></a><span class="tt-date">, {q.date}</span>
        </div>
      </div>
    {/if}
  </div>
</section>

<style>
  /* ── Section shell ─────────────────────────────────────────── */
  .intent-section {
    background: var(--bg-section);
    padding: clamp(3rem, 8vw, 6rem) 0 clamp(3rem, 8vw, 5rem);
    direction: rtl;
    font-family: var(--font-body);
  }

  /* ── Header ────────────────────────────────────────────────── */
  .section-header {
    margin-bottom: clamp(2rem, 5vw, 3.5rem);
  }

  /* ── Masonry wall ──────────────────────────────────────────── */
  .wall {
    columns: 4 260px;
    column-gap: 10px;
    padding: 0 clamp(0.75rem, 3vw, 2rem);
    position: relative; /* tooltip positioned inside */
  }

  @media (max-width: 900px) {
    .wall { columns: 2 220px; }
  }
  @media (max-width: 540px) {
    .wall { columns: 1; }
  }

  /* ── Quote card ────────────────────────────────────────────── */
  .quote-card {
    display: block;
    width: 100%;
    break-inside: avoid;
    margin-bottom: 10px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-top: 3px solid var(--border-mid);
    text-align: right;
    position: relative;
    overflow: hidden;

    /* Reveal animation */
    opacity: 0;
    transform: translateY(18px);
    transition:
      opacity 0.55s ease,
      transform 0.55s ease,
      border-top-color 0.2s ease,
      box-shadow 0.2s ease,
      background 0.2s ease;
  }

  .quote-card.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Stagger */
  .quote-card:nth-child(4n+1) { transition-delay: 0.05s; }
  .quote-card:nth-child(4n+2) { transition-delay: 0.12s; }
  .quote-card:nth-child(4n+3) { transition-delay: 0.19s; }
  .quote-card:nth-child(4n+4) { transition-delay: 0.26s; }

  .quote-card:hover,
  .quote-card.active {
    border-top-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent-dim), 0 4px 16px rgba(0,0,0,0.08);
    background: var(--bg);
    cursor: pointer;
  }

  .card-inner {
    padding: clamp(0.85rem, 2vw, 1.1rem);
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  /* ── Key phrase ────────────────────────────────────────────── */
  .key-phrase {
    font-family: var(--font-disp);
    font-size: clamp(0.92rem, 1.6vw, 1.05rem);
    font-weight: 700;
    color: var(--text);
    line-height: 1.45;
    border-bottom: 1px solid var(--border);
    padding-bottom: 0.45rem;
  }

  /* uniform font size across all card sizes */

  /* ── Speaker block ─────────────────────────────────────────── */
  .speaker-block {
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
  }

  .speaker-name {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--accent);
  }

  .speaker-title {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    color: var(--text-muted);
    font-style: italic;
    line-height: 1.35;
  }

  .speaker-date {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--border-mid);
  }

  /* ── Floating tooltip ──────────────────────────────────────── */
  .tooltip {
    position: absolute;
    top: var(--ty);
    left: var(--tx);
    transform: translate(16px, -50%);
    width: clamp(260px, 28vw, 400px);
    background: var(--bg);
    border: 1px solid var(--border-mid);
    border-top: 3px solid var(--accent);
    box-shadow: 0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08);
    padding: 1rem 1.1rem;
    pointer-events: none;
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    animation: ttFade 0.15s ease;
  }

  .tooltip.pinned {
    pointer-events: all;
    box-shadow: 0 12px 48px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.1);
    border-top-color: var(--accent-light);
  }

  /* Flip horizontally when near right edge */
  .tooltip.flip-x {
    transform: translate(calc(-100% - 16px), -50%);
  }

  /* Flip vertically when near bottom */
  .tooltip.flip-y {
    transform: translate(16px, calc(-100% + 2rem));
  }
  .tooltip.flip-x.flip-y {
    transform: translate(calc(-100% - 16px), calc(-100% + 2rem));
  }

  @keyframes ttFade {
    from { opacity: 0; transform: translate(16px, calc(-50% + 6px)); }
    to   { opacity: 1; transform: translate(16px, -50%); }
  }
  /* Note: flip variants won't re-animate perfectly, acceptable tradeoff */

  .tt-quote {
    font-family: var(--font-disp);
    font-size: var(--text-sm);
    line-height: 1.72;
    color: var(--text);
    border-right: 2px solid var(--accent);
    padding-right: 0.7rem;
  }

  .tt-quote :global(mark) {
    background: var(--accent-dim);
    color: var(--accent-light);
    border-radius: 2px;
    padding: 0 2px;
    font-weight: 700;
  }

  .tt-en {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    line-height: 1.6;
    color: var(--text-muted);
    font-style: italic;
    direction: ltr;
    border-left: 2px solid var(--border);
    padding-left: 0.65rem;
  }

  .tt-close {
    position: absolute;
    top: 0.4rem;
    left: 0.5rem;
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 0.7rem;
    cursor: pointer;
    line-height: 1;
    padding: 0.2rem 0.3rem;
    opacity: 0.6;
    transition: opacity 0.15s;
  }
  .tt-close:hover { opacity: 1; }

  .tt-meta {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    border-top: 1px solid var(--border);
    padding-top: 0.4rem;
  }

  .tt-speaker {
    font-weight: 700;
    color: var(--accent);
  }

  .tt-role {
    color: var(--text-muted);
    font-style: italic;
  }

  .tt-footer {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0.5rem;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    direction: ltr;
  }

  .tt-date {
    color: var(--text-muted);
  }

  .tt-context {
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-muted);
    text-decoration: none;
    border-bottom: 1px solid var(--border);
    transition: color 0.15s, border-color 0.15s;
  }
  .tt-context:hover {
    color: var(--accent);
    border-color: var(--accent);
  }
  .tt-arrow {
    flex-shrink: 0;
    direction: ltr;
  }
  .tt-context-text {
    unicode-bidi: isolate;
  }

  /* ── Footer caption ────────────────────────────────────────── */
  .wall-footer {
    text-align: center;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--text-muted);
    margin-top: 1.5rem;
    padding: 0 1rem;
  }
</style>
