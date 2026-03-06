<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  import SectionHead from '$lib/components/ui/SectionHead.svelte';
  import analysisData from '$lib/data/analysis.json';
  import { onMount } from 'svelte';

  const bodyParagraphs = analysisData.paragraphs.slice(0, -1);
  const closingText = analysisData.paragraphs[analysisData.paragraphs.length - 1];

  let closingEl: HTMLElement;
  let highlighted = $state(false);

  onMount(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { highlighted = entry.isIntersecting; },
      { threshold: 0.3 }
    );
    obs.observe(closingEl);
    return () => obs.disconnect();
  });
</script>

<section class="analysis-section section-topo" id="analysis">
  <div class="container-wide">
    <SectionHead label={analysisData.sectionLabel} title={analysisData.sectionTitle} />

    <div class="analysis-body body-text">
      {#each bodyParagraphs as p}
        <p class="reveal" use:reveal>{p}</p>
      {/each}

      <!-- Outer p is always visible; inner span carries the red highlight pseudo-element -->
      <p class="closing-statement" bind:this={closingEl}>
        <span class="closing-inner" class:highlighted>{closingText}</span>
      </p>
    </div>
  </div>
</section>

<style>
  .analysis-section { padding: clamp(2.5rem, 7vw, 5rem) 0; background: var(--bg-section); }

  .analysis-body { font-size: 1.02rem; line-height: 1.82; color: var(--text); max-width: 720px; }
  .analysis-body :global(p) { margin-bottom: 1.6rem; }

  .closing-statement {
    margin-bottom: 0;
  }

  .closing-inner {
    position: relative;
    display: inline-block;
    padding: 0.35rem 0.85rem;
    border-radius: 2px;
    color: var(--text);
    transition: color 0.3s ease 0.6s;
    z-index: 0;
  }
  .closing-inner::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(140, 30, 22, 0.82);
    border-radius: 2px;
    /* RTL wipe: start fully to the right (hidden), sweep left */
    clip-path: inset(0 0 0 100%);
    transition: clip-path 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.15s;
    z-index: -1;
  }
  .closing-inner.highlighted::before {
    clip-path: inset(0 0 0 0%);
  }
  .closing-inner.highlighted {
    color: #fff;
  }
</style>
