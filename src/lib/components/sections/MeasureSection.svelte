<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  import SectionHead from '$lib/components/ui/SectionHead.svelte';
  import { measureSection } from '$lib/data/story.js';
  import { sanitizeText } from '$lib/utils/sanitize';
  import { onMount } from 'svelte';

  let markPara: HTMLElement;

  onMount(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        const mark = markPara?.querySelector('mark.inv');
        if (!mark) return;
        if (entry.isIntersecting) {
          mark.classList.add('inv-shown');
        } else {
          mark.classList.remove('inv-shown');
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(markPara);
    return () => obs.disconnect();
  });
</script>

<section class="measure-section" id="measure">
  <div class="container">
    <div class="measure-head" use:reveal>
      <SectionHead
        label={measureSection.label}
        title={measureSection.title}
        sub=""
      />
    </div>
    <div class="measure-body">
      {#each measureSection.paragraphs as paragraph, i}
        {#if i === 0}
          <p class="reveal reveal-no-fade" bind:this={markPara}>{@html sanitizeText(paragraph)}</p>
        {:else}
          <p class="reveal" use:reveal={{ once: true, threshold: 0.3 }}>{@html sanitizeText(paragraph)}</p>
        {/if}
      {/each}
    </div>
  </div>
</section>

<style>
  .measure-section {
    padding: 4rem 0 3rem;
  }

  .measure-head {
    margin-bottom: 2rem;
  }

  .measure-body {
    font-size: 1.02rem;
    line-height: 1.82;
    color: var(--text);
  }

  .measure-body :global(p) {
    margin-bottom: 1.5rem;
  }

  /* mark.inv inside this section: pseudo-element RTL wipe via class toggle */
  .measure-body :global(mark.inv) {
    position: relative;
    display: inline;
    background: transparent;
    color: var(--text);
    padding: 0.1em 0.3em 0.1em 0;
    border-radius: 2px;
    transition: color 0.3s ease 0.6s;
    /* override app.css animation — we use transition instead */
    animation: none;
  }
  .measure-body :global(mark.inv::before) {
    content: '';
    position: absolute;
    inset: -0.1em -0.3em -0.1em 0;
    background: rgba(140, 30, 22, 0.82);
    border-radius: 2px;
    clip-path: inset(0 0 0 100%);
    transition: clip-path 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.15s;
    z-index: -1;
  }
  .measure-body :global(mark.inv.inv-shown::before) {
    clip-path: inset(0 0 0 0%);
  }
  .measure-body :global(mark.inv.inv-shown) {
    color: #fff;
  }
</style>
