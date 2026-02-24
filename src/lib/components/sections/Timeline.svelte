<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  import SectionHead from '$lib/components/ui/SectionHead.svelte';
  import timelineData from '$lib/data/timeline.json';

  let activeIndex = $state(-1);

  function toggle(i: number) {
    activeIndex = activeIndex === i ? -1 : i;
  }
</script>

<section class="timeline-section section-topo" id="timeline">
  <div class="container">
    <div class="timeline-head">
      <SectionHead label="Timeline" title="A Movement Emerges from the Rubble" sub="Key events in the settler resettlement campaign, October 2023 to present" />
    </div>

    <div class="timeline-track">
      <div class="timeline-spine" aria-hidden="true"></div>
      {#each timelineData as event, i}
        <div class="t-event reveal" class:t-active={activeIndex === i} use:reveal>
          <div class="t-dot" class:red={event.dotColor === 'red'}></div>
          <div class="t-card" role="button" tabindex="0" aria-expanded={activeIndex === i} onclick={() => toggle(i)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i); } }}>
            <div class="t-date">{event.date}</div>
            <div class="t-title">{event.title}</div>
            <span class="t-expand-hint">{activeIndex === i ? 'Close' : 'Read more'}</span>
          </div>
          <div class="t-detail" class:open={activeIndex === i}>
            <div class="t-detail-inner">
              <strong>{event.detailTitle}</strong>
              <p>{event.detail}</p>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .timeline-section { padding: 5rem 0; overflow: hidden; }
  .timeline-head { margin-bottom: 3rem; }

  .timeline-track {
    position: relative;
    max-width: 700px;
    margin: 0 auto;
    padding: 2rem 0;
  }

  .timeline-spine {
    position: absolute;
    top: 0; bottom: 0;
    left: 24px;
    width: 1px;
    background: linear-gradient(180deg, transparent 0%, var(--border-mid) 4%, var(--border-mid) 96%, transparent 100%);
    z-index: 0;
  }

  .t-event {
    position: relative;
    width: calc(100% - 60px);
    margin-left: 60px;
    margin-bottom: 2rem;
  }

  .t-dot {
    position: absolute;
    top: 1rem;
    left: -36px;
    width: 13px; height: 13px;
    border-radius: 50%;
    background: var(--gold);
    border: 2px solid var(--bg);
    z-index: 2;
    transform: translateX(-50%);
  }
  .t-dot.red { background: var(--red-light); }

  .t-event::after {
    content: '';
    position: absolute;
    top: calc(1rem + 5px);
    left: -22px;
    width: 22px;
    height: 1px;
    background: var(--border-mid);
    z-index: 1;
  }

  .t-card {
    background: var(--bg-card);
    border: 1px solid var(--border-mid);
    border-radius: 2px;
    padding: 0.85rem 1rem;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .t-card:hover { border-color: rgba(196, 162, 74, 0.55); }

  .t-date {
    font-family: var(--font-ui);
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 0.3rem;
  }
  .t-title {
    font-family: var(--font-ui);
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--text);
    line-height: 1.4;
  }

  .t-event.t-active .t-card {
    border-color: var(--gold);
    box-shadow: 0 0 0 1px var(--gold), 0 0 14px rgba(196, 162, 74, 0.18);
  }
  .t-event.t-active .t-dot {
    box-shadow: 0 0 0 4px rgba(196, 162, 74, 0.3);
  }

  .t-expand-hint {
    display: block;
    margin-top: 0.4rem;
    font-size: 0.56rem;
    font-family: var(--font-ui);
    color: var(--gold);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    opacity: 0.65;
    transition: opacity 0.15s;
  }
  .t-card:hover .t-expand-hint,
  .t-event.t-active .t-expand-hint { opacity: 1; }
  .t-event.t-active .t-expand-hint::before { content: '\25BE '; }
  .t-expand-hint::before { content: '\25B8 '; }

  .t-detail {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s;
    opacity: 0;
  }
  .t-detail.open {
    max-height: 300px;
    opacity: 1;
  }

  .t-detail-inner {
    margin-top: 0.75rem;
    padding: 0.85rem 1rem;
    background: var(--bg-section);
    border-left: 3px solid var(--gold);
    border-radius: 2px;
  }
  .t-detail-inner strong {
    display: block;
    font-family: var(--font-ui);
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--sand);
    margin-bottom: 0.35rem;
  }
  .t-detail-inner p {
    font-size: 0.8rem;
    line-height: 1.65;
    color: var(--text-muted);
  }

  @media (max-width: 700px) {
    .timeline-spine { left: 16px; }
    .t-event { width: calc(100% - 44px); margin-left: 44px; }
    .t-dot { left: -28px; }
    .t-event::after { left: -16px; width: 16px; }
  }
</style>
