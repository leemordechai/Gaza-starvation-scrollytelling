<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  import { copyToClipboard } from '$lib/utils/clipboard';
  import { showToast } from '$lib/stores/copyToast';

  const quoteText = `"We were expelled from this land twenty years ago. What happened on October 7 is the direct result of that expulsion. The only answer is to return — not as conquerors, but as people coming home."`;
  const attribution = '— Yael Adler, former resident of Neve Dekalim, Gush Katif, speaking at a January 2024 conference in Jerusalem';

  async function handleCopy() {
    const ok = await copyToClipboard(quoteText);
    if (ok) showToast();
  }
</script>

<section class="pullquote-section">
  <div class="pullquote reveal" use:reveal>
    <button class="pq-copy" aria-label="Copy quote" onclick={handleCopy}>&#x2398;</button>
    <blockquote>{quoteText}</blockquote>
    <cite>{attribution}</cite>
  </div>
</section>

<style>
  .pullquote-section {
    padding: 5.5rem 0;
    background: var(--bg-card);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    position: relative;
    overflow: hidden;
  }
  .pullquote-section::before {
    content: '\201C';
    position: absolute;
    top: -3.5rem;
    left: -1rem;
    font-family: var(--font-disp);
    font-size: 22rem;
    line-height: 1;
    color: var(--gold);
    opacity: 0.05;
    pointer-events: none;
    user-select: none;
  }

  .pullquote {
    max-width: 780px;
    margin: 0 auto;
    padding: 0 2rem;
    text-align: center;
    position: relative;
  }

  .pullquote blockquote {
    font-family: var(--font-disp);
    font-size: clamp(1.35rem, 2.8vw, 2.1rem);
    font-style: italic;
    font-weight: 400;
    line-height: 1.5;
    color: var(--sand);
    margin-bottom: 1.75rem;
  }

  .pullquote cite {
    font-family: var(--font-ui);
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.17em;
    text-transform: uppercase;
    color: var(--gold);
    font-style: normal;
  }

  .pq-copy {
    position: absolute;
    top: 0;
    right: 0.5rem;
    background: none;
    border: 1px solid var(--border-mid);
    color: var(--text-muted);
    font-size: 1rem;
    width: 2rem;
    height: 2rem;
    border-radius: 2px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s, border-color 0.2s;
    line-height: 1;
  }
  .pq-copy:hover { color: var(--gold); border-color: var(--gold); }
</style>
