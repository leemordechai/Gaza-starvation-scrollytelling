<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  import SectionHead from '$lib/components/ui/SectionHead.svelte';
  import { measureSection } from '$lib/data/story.js';
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
      {#each measureSection.paragraphs as paragraph}
        <p class="reveal" use:reveal>{@html paragraph}</p>
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
</style>
