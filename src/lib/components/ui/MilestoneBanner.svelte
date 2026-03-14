<script lang="ts">
  import { scrollProgress } from '$lib/stores/scroll';

  const MILESTONES = [
    { at: 0.25, label: 'חלק א׳ · עורק החיים: כניסת משאיות' },
    { at: 0.50, label: 'חלק ב׳ · הדרך אל הצלחת' },
    { at: 0.75, label: 'חלק ג׳ · כמה עולה לשרוד?' },
  ];

  let shownMilestones = $state(new Set<number>());
  let activeMilestone = $state<string | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    const p = $scrollProgress;
    for (const m of MILESTONES) {
      if (p >= m.at && !shownMilestones.has(m.at)) {
        shownMilestones = new Set([...shownMilestones, m.at]);
        activeMilestone = m.label;
        clearTimeout(timer);
        timer = setTimeout(() => { activeMilestone = null; }, 3200);
        break;
      }
    }
  });
</script>

<div class="mb-banner" class:mb-banner--visible={activeMilestone !== null} dir="rtl" aria-live="polite" aria-atomic="true">
  {#if activeMilestone}
    <span class="mb-dot"></span>
    <span class="mb-label">{activeMilestone}</span>
  {/if}
</div>

<style>
  .mb-banner {
    position: fixed;
    top: 3.8rem;
    inset-inline-start: 50%;
    transform: translateX(-50%) translateY(-12px);
    z-index: 800;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.35rem 1rem;
    background: rgba(12, 11, 8, 0.92);
    border: 1px solid rgba(196, 162, 74, 0.4);
    border-radius: 2px;
    backdrop-filter: blur(8px);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.35s ease, transform 0.35s ease;
    white-space: nowrap;
    max-width: calc(100vw - 2rem);
  }

  .mb-banner--visible {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  .mb-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(196, 162, 74, 0.85);
    flex-shrink: 0;
  }

  .mb-label {
    font-family: var(--font-ui);
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: rgba(196, 162, 74, 0.9);
  }
</style>
