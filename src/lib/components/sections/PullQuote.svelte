<script lang="ts">
  import { reveal } from '$lib/actions/reveal';

  let { quote, attribution, small = false }: { quote: string; attribution: string; small?: boolean } = $props();
</script>

<section class="pullquote-section">
  <div class="pullquote reveal" class:pullquote--small={small} use:reveal>
    <blockquote>{quote}</blockquote>
    <cite>{attribution}</cite>
  </div>
</section>

<style>
  .pullquote-section {
    padding: clamp(3.5rem, 8vw, 7rem) 0;
    background: var(--bg-card);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    position: relative;
    overflow: hidden;
    min-height: calc(var(--vh, 1vh) * 100);
    display: flex;
    align-items: center;
    justify-content: center;
    scroll-snap-align: start;
  }
  .pullquote-section::before {
    content: '\201D';
    position: absolute;
    top: -3.5rem;
    left: auto;
    inset-inline-end: -1rem;
    font-family: var(--font-disp);
    font-size: 22rem;
    line-height: 1;
    color: var(--accent);
    opacity: 0.08;
    pointer-events: none;
    user-select: none;
  }

  .pullquote {
    max-width: clamp(600px, 58vw, 800px);
    margin: 0 auto;
    padding: 0 clamp(1.1rem, 5vw, 2.5rem);
    text-align: center;
    position: relative;
  }

  .pullquote blockquote {
    font-family: var(--font-disp);
    font-size: clamp(1.5rem, 1.2rem + 2.2vw, 3.2rem);
    font-style: italic;
    font-weight: 400;
    line-height: 1.4;
    color: var(--sand);
    margin-bottom: 1.75rem;
    max-width: 24ch;
    margin-inline: auto;
  }

  .pullquote--small blockquote {
    font-size: clamp(1rem, 0.9rem + 0.75vw, 1.2rem);
    max-width: 41ch;
    line-height: 1.75;
    text-align: justify;
    text-align-last: center;
    hyphens: auto;
  }

  .pullquote cite {
    font-family: var(--font-ui);
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.17em;
    text-transform: uppercase;
    color: var(--accent);
    font-style: normal;
  }

  @media (max-width: 768px) {
    .pullquote-section {
      min-height: 0;
      padding-block: clamp(2rem, 6vh, 3.5rem);
    }
  }
</style>
