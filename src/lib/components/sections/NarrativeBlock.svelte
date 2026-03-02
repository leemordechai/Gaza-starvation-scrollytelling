<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  let { title, paragraphs, id }: { title: string; paragraphs: string[]; id?: string } = $props();
</script>

<section class="nb-section" {id}>
  <div class="container">
    <h2 class="nb-title reveal" use:reveal>{title}</h2>
    {#each paragraphs as p}
      <p class="nb-p reveal" use:reveal>{p}</p>
    {/each}
  </div>
</section>

<style>
  .nb-section {
    padding: 3rem 0 2rem;
  }

  .nb-title {
    font-family: var(--font-disp);
    font-size: clamp(1.3rem, 2.4vw, 1.9rem);
    font-weight: 800;
    color: var(--text);
    line-height: 1.25;
    margin-bottom: 1.6rem;
    border-right: 3px solid var(--accent);
    padding-right: 1rem;
  }

  .nb-p {
    font-size: 1.02rem;
    line-height: 1.82;
    color: var(--text);
    margin-bottom: 1.4rem;
  }

  .nb-p:last-child {
    margin-bottom: 0;
  }
</style>
