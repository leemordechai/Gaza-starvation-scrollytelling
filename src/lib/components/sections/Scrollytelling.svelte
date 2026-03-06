<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { initGsap, killScrollTriggers } from '$lib/utils/gsap';
  import stepsData from '$lib/data/scrollySteps.json';

  let activeStep = $state(0);
  let triggers: any[] = [];

  const captions = stepsData.map(s => s.caption);
  const panelImages = [
    '/images/scrolly-1.webp',
    '/images/scrolly-2.webp',
    '/images/scrolly-3.webp',
    '/images/scrolly-4.webp'
  ];

  onMount(async () => {
    if (!browser) return;
    const result = await initGsap();
    if (!result) return;
    const { ScrollTrigger } = result;

    const steps = document.querySelectorAll('.s-step');
    steps.forEach((step, i) => {
      const st = ScrollTrigger.create({
        trigger: step,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => { activeStep = i; },
        onEnterBack: () => { activeStep = i; },
      });
      triggers.push(st);
    });
  });

  onDestroy(() => {
    killScrollTriggers(triggers);
  });
</script>

<section class="scrolly-section">
  <div class="container-wide">
    <div class="scrolly-grid">

      <!-- Sticky visual -->
      <div class="scrolly-sticky">
        <div class="scrolly-visual">
          {#each panelImages as src, i}
            <div class="vis-panel" class:active={activeStep === i} data-panel={i + 1}>
              <img {src} alt={captions[i]} loading={i === 0 ? 'eager' : 'lazy'} />
            </div>
          {/each}
        </div>
        <p class="vis-caption">{captions[activeStep]}</p>
      </div>

      <!-- Scroll steps -->
      <div class="scrolly-steps">
        {#each stepsData as step, i}
          <div class="s-step" class:active={activeStep === i} data-step={i + 1}>
            <div class="s-num">{step.number}</div>
            <span class="s-tag">{step.tag}</span>
            <h3>{step.heading}</h3>
            <p>{step.body}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

<style>
  .scrolly-section { padding: clamp(2.5rem, 7vw, 5rem) 0; }
  .scrolly-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: clamp(2rem, 5vw, 5rem); align-items: start;
  }
  @media (max-width: 768px) { .scrolly-grid { grid-template-columns: 1fr; gap: 3rem; } }

  .scrolly-sticky { position: sticky; top: 90px; }
  .scrolly-visual {
    aspect-ratio: 4/3; background: var(--bg-card);
    border: 1px solid var(--border-mid); position: relative;
    overflow: hidden; border-radius: 2px;
  }

  .vis-panel {
    position: absolute; inset: 0;
    opacity: 0;
    transition: opacity 0.5s ease;
    pointer-events: none;
  }
  .vis-panel.active { opacity: 1; }
  .vis-panel img {
    width: 100%; height: 100%;
    object-fit: cover; display: block;
  }

  .vis-caption {
    font-family: var(--font-ui); font-size: 0.6rem;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--text-muted); text-align: center; margin-top: 0.75rem;
  }

  .scrolly-steps { padding: 3rem 0 10rem; }
  .s-step {
    padding: 3.5rem 0;
    min-height: calc(var(--vh, 1vh) * 70);
    display: flex; flex-direction: column; justify-content: center;
    opacity: 0.3; transition: opacity 0.5s ease;
  }
  .s-step.active { opacity: 1; }
  .s-num {
    font-family: var(--font-ui); font-size: 4.5rem; font-weight: 800;
    line-height: 1; color: var(--border-mid); margin-bottom: -0.5rem;
  }
  .s-tag {
    font-family: var(--font-ui); font-size: 0.62rem; font-weight: 700;
    letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--accent); margin-bottom: 0.6rem;
  }
  .s-step h3 {
    font-family: var(--font-disp); font-size: 1.45rem; font-weight: 700;
    color: #fff; margin-bottom: 0.8rem; line-height: 1.25;
  }
  .s-step p { font-size: 0.97rem; line-height: 1.78; color: var(--text); }
</style>
