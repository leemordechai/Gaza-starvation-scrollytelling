<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  import { copyToClipboard } from '$lib/utils/clipboard';
  import { showToast } from '$lib/stores/copyToast';

  let { quote, attribution }: { quote: string; attribution: string } = $props();

  async function handleCopy() {
    const ok = await copyToClipboard(quote);
    if (ok) showToast();
  }
</script>

<section class="pullquote-section">
  <div class="pullquote reveal" use:reveal>
    <button class="pq-copy" aria-label="העתק ציטוט" onclick={handleCopy}>&#x2398;</button>
    <blockquote>{quote}</blockquote>
    <cite>{attribution}</cite>
  </div>
</section>

<style>
  .pullquote-section {
    padding: 7rem 0;
    background: var(--bg-card);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    position: relative;
    overflow: hidden;
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
    max-width: 680px;
    margin: 0 auto;
    padding: 0 clamp(1.1rem, 5vw, 2.5rem);
    text-align: center;
    position: relative;
  }

  .pullquote blockquote {
    font-family: var(--font-disp);
    font-size: clamp(1.5rem, 1.2rem + 1.5vw, 2.4rem);
    font-style: italic;
    font-weight: 400;
    line-height: 1.45;
    color: var(--sand);
    margin-bottom: 1.75rem;
    max-width: 26ch;
    margin-inline: auto;
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

  .pq-copy {
    position: absolute;
    top: 0;
    inset-inline-end: 0.5rem;
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
  .pq-copy:hover { color: var(--accent); border-color: var(--accent); }
</style>
