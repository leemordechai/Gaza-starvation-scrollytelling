<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  import { intro } from '$lib/data/story.js';
</script>

<section class="intro-section" id="background">
  <div class="container">
    <p class="lede reveal" use:reveal>{intro.lede}</p>

    <div class="body-text">
      {#each intro.paragraphs as paragraph}
        <p class="reveal" use:reveal>{paragraph}</p>
      {/each}
    </div>
  </div>
</section>

<style>
  .intro-section {
    padding: clamp(2.5rem, 7vw, 5rem) 0;
    scroll-snap-align: start;
  }

  .lede {
    font-family: var(--font-body);
    font-size: clamp(1.15rem, 2.2vw, 1.45rem);
    font-weight: 400;
    line-height: 1.62;
    color: var(--sand);
    margin-bottom: 0;
    border-inline-start: 2px solid var(--accent);
    padding-inline-start: 1.4rem;
  }

  .body-text { font-size: 1.02rem; line-height: 1.82; color: var(--text); }
  .body-text :global(p) { margin-bottom: 1.6rem; }
  .body-text > :global(p:first-of-type::first-letter) {
    font-family: var(--font-disp);
    font-size: clamp(3rem, 8vw, 4.8rem);
    font-weight: 900;
    float: inline-start;
    line-height: 0.78;
    margin-block-start: 0.12em;
    margin-inline-end: 0.1em;
    color: var(--accent);
  }

  .inline-image { margin: 2.5rem -1.5rem; }
  @media (max-width: 400px) { .inline-image { margin: 2rem 0; } }
  @media (min-width: 860px) { .inline-image { margin: 3rem -5rem; } }

  .img-placeholder {
    width: 100%;
    aspect-ratio: 16/7;
    background: #1a1612;
    position: relative;
    overflow: hidden;
  }
  .img-placeholder img {
    width: 100%; height: 100%;
    object-fit: cover; display: block;
  }

  .img-caption {
    font-family: var(--font-ui);
    font-size: 0.63rem;
    letter-spacing: 0.03em;
    color: var(--text-muted);
    padding: 0.5rem 0 0;
    border-top: 1px solid var(--border);
    line-height: 1.5;
  }
  .img-caption :global(strong) { color: var(--text-muted); font-weight: 600; }
</style>
