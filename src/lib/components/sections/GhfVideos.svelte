<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  import SectionHead from '$lib/components/ui/SectionHead.svelte';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  const videos = [
    { url: 'https://x.com/i/status/1966609171929022780', id: '1966609171929022780' },
    { url: 'https://x.com/i/status/1962604678652547400', id: '1962604678652547400' },
    { url: 'https://x.com/i/status/1952128592894480814', id: '1952128592894480814' },
    { url: 'https://x.com/i/status/1946564469305249850', id: '1946564469305249850' },
  ];

  // Track which iframes Twitter has finished rendering
  let rendered = $state<Record<string, boolean>>({});

  onMount(() => {
    if (!browser) return;

    function runWidgets() {
      (window as any).twttr.widgets.load(document.getElementById('ghf-grid'));
      // Listen for each tweet to finish rendering
      (window as any).twttr.events.bind('rendered', (e: any) => {
        const iframe = e.target as HTMLIFrameElement;
        // Find which video this belongs to by closest wrapper
        const wrapper = iframe.closest('[data-vid-id]');
        if (wrapper) rendered[wrapper.getAttribute('data-vid-id')!] = true;
      });
    }

    if ((window as any).twttr?.widgets) {
      runWidgets();
    } else {
      const s = document.createElement('script');
      s.src = 'https://platform.twitter.com/widgets.js';
      s.async = true;
      s.charset = 'utf-8';
      s.onload = runWidgets;
      document.head.appendChild(s);
    }
  });
</script>

<section class="ghf-section section-topo" id="video">
  <div class="container-wide">
    <div class="ghf-head" use:reveal>
      <SectionHead
        label="וידאו"
        title="GHF בשטח"
        sub="תיעוד ממצלמות הארגון ההומניטרי העולמי לאוכל — חלוקת סיוע, עדויות, ותמונות מהשטח"
      />
    </div>

    <div class="ghf-grid" id="ghf-grid">
      {#each videos as video}
        <div class="ghf-item" data-vid-id={video.id} use:reveal>
          <!-- Skeleton shown until Twitter renders the iframe -->
          {#if !rendered[video.id]}
            <div class="ghf-skeleton" aria-hidden="true">
              <div class="ghf-skeleton-play">
                <svg viewBox="0 0 48 48" width="40" height="40">
                  <circle cx="24" cy="24" r="22" fill="rgba(220,48,48,0.55)"/>
                  <polygon points="20,15 37,24 20,33" fill="white"/>
                </svg>
              </div>
            </div>
          {/if}
          <div class="ghf-embed-wrap" class:ghf-embed-wrap--visible={rendered[video.id]}>
            <blockquote
              class="twitter-tweet"
              data-conversation="none"
              data-theme="dark"
              data-align="center"
              data-dnt="true"
            >
              <a href={video.url}>טוען וידאו...</a>
            </blockquote>
          </div>
        </div>
      {/each}
    </div>

    <p class="ghf-source">מקור: GHF (Global Humanitarian Forum) · X/Twitter</p>
  </div>
</section>

<style>
  .ghf-section { padding: 4rem 0; }
  .ghf-head { margin-bottom: 2.5rem; }

  .ghf-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  @media (max-width: 500px) { .ghf-grid { grid-template-columns: 1fr; } }

  .ghf-item {
    position: relative;
    min-height: 320px;
    background: var(--bg-card);
    border: 1px solid var(--border-mid);
    border-top: 2px solid var(--accent);
    overflow: hidden;
  }

  /* Skeleton while Twitter renders */
  .ghf-skeleton {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #1a1210 0%, #221618 50%, #1a1210 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: ghf-pulse 1.8s ease-in-out infinite;
  }

  @keyframes ghf-pulse {
    0%, 100% { opacity: 0.7; }
    50%       { opacity: 1.0; }
  }

  .ghf-skeleton-play {
    filter: drop-shadow(0 2px 12px rgba(0,0,0,0.5));
  }

  /* Embed container — hidden until rendered, then revealed */
  .ghf-embed-wrap {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .ghf-embed-wrap--visible {
    opacity: 1;
    position: static;
  }

  .ghf-embed-wrap :global(.twitter-tweet) {
    margin: 0 !important;
    max-width: 100% !important;
    width: 100% !important;
  }

  .ghf-source {
    font-family: var(--font-ui);
    font-size: 0.55rem;
    color: var(--text-muted);
    opacity: 0.6;
    margin-top: 1.5rem;
    text-align: center;
  }
</style>
