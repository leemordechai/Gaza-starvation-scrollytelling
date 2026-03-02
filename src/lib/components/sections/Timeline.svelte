<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  import SectionHead from '$lib/components/ui/SectionHead.svelte';
  import timelineData from '$lib/data/timeline.json';

  let openSet = $state(new Set<number>());
  let everOpenedFirst = $state(false);

  function toggle(i: number) {
    const next = new Set(openSet);
    if (next.has(i)) {
      next.delete(i);
    } else {
      next.add(i);
      if (i === 0) {
        everOpenedFirst = true;
      } else if (i === 1 && everOpenedFirst) {
        // User opened card 0 at some point, now opens card 1 — expand all
        for (let j = 0; j < timelineData.length; j++) next.add(j);
      }
    }
    openSet = next;
  }
</script>

<section class="timeline-section section-topo" id="timeline">
  <div class="container">
    <div class="timeline-head">
      <SectionHead label="ציר זמן" title="כרוניקה של רעב" sub="אירועים מרכזיים: מפרוץ המלחמה ועד אביב 2026" />
    </div>

    <div class="timeline-track">
      <div class="timeline-spine" aria-hidden="true"></div>
      {#each timelineData as event, i}
        <div class="t-event reveal" class:t-active={openSet.has(i)} use:reveal>
          <div class="t-dot" class:red={event.dotColor === 'red'}></div>
          <div class="t-card" role="button" tabindex="0" aria-expanded={openSet.has(i)} onclick={() => toggle(i)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i); } }}>
            <div class="t-date">{event.date}</div>
            <div class="t-title">{event.title}</div>
            <div class="t-detail" class:open={openSet.has(i)}>
              <div class="t-detail-inner">
                <strong>{event.detailTitle}</strong>
                <p>{event.detail}</p>
              </div>
            </div>
            <span class="t-expand-hint">{openSet.has(i) ? 'סגור' : 'לקריאה נוספת'}</span>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .timeline-section { padding: 5rem 0; }
  .timeline-head { margin-bottom: 1.25rem; }

  .timeline-track {
    position: relative;
    max-width: 700px;
    margin: 0 auto;
    padding: 2rem 0;
    /* Extra padding-right ensures dots/spine are never clipped */
    padding-right: 2px;
  }

  /* RTL: spine on the right side, at 30px from track right edge */
  .timeline-spine {
    position: absolute;
    top: 0; bottom: 0;
    right: 30px;
    width: 2px;
    background: linear-gradient(180deg, transparent 0%, var(--border-mid) 4%, var(--border-mid) 96%, transparent 100%);
    z-index: 0;
  }

  /* Events: leave 64px on the right for dot + connector */
  .t-event {
    position: relative;
    width: calc(100% - 64px);
    margin-right: 64px;
    margin-bottom: 2rem;
  }

  /* Dot: sits centered on the spine (right: 30px from track = right: 30 - 64 = -34px from event right edge)
     Center: dot is 14px wide, so shift by -7px → right: -34 - 7 = -41px, or simpler: use right: -41px with no transform */
  .t-dot {
    position: absolute;
    top: 1rem;
    right: -41px;
    width: 14px; height: 14px;
    border-radius: 50%;
    background: var(--accent);
    border: 2.5px solid var(--bg-section);
    z-index: 2;
  }
  .t-dot.red { background: var(--accent-light); }

  /* Horizontal connector line from card right edge to dot */
  .t-event::after {
    content: '';
    position: absolute;
    top: calc(1rem + 6px);
    right: -26px;
    width: 26px;
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
  .t-card:hover { border-color: rgba(155, 42, 33, 0.45); }

  .t-date {
    font-family: var(--font-ui);
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--accent);
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
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent), 0 0 14px rgba(155, 42, 33, 0.15);
  }
  .t-event.t-active .t-dot {
    box-shadow: 0 0 0 4px rgba(155, 42, 33, 0.25);
  }

  .t-expand-hint {
    display: block;
    margin-top: 0.4rem;
    font-size: 0.56rem;
    font-family: var(--font-ui);
    color: var(--accent);
    letter-spacing: 0.08em;
    opacity: 0.65;
    transition: opacity 0.15s;
  }
  .t-card:hover .t-expand-hint,
  .t-event.t-active .t-expand-hint { opacity: 1; }
  .t-event.t-active .t-expand-hint::before { content: '\25BE '; }
  .t-expand-hint::before { content: '\25B8 '; }

  .t-detail {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s;
    opacity: 0;
  }
  .t-detail.open {
    grid-template-rows: 1fr;
    opacity: 1;
  }
  .t-detail-inner {
    overflow: hidden;
    padding: 0.75rem 0 0.1rem;
    border-top: 1px solid var(--border-mid);
    margin-top: 0.75rem;
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
    .timeline-spine { right: 20px; }
    .t-event { width: calc(100% - 48px); margin-right: 48px; }
    /* Spine at 20px from right, event margin 48px → dot offset: 48 - 20 - 7 = 21px → right: -21px... recalc:
       spine at 20px from track, event right edge at 48px → dot needs right edge at 20+7=27px from track
       → dot on event: right = 48-27 = 21 → negate = -21px. Width 14px centered → right: -28px */
    .t-dot { right: -28px; }
    .t-event::after { right: -18px; width: 18px; }
  }
</style>
