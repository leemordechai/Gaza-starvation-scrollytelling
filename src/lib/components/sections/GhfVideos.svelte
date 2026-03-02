<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  import SectionHead from '$lib/components/ui/SectionHead.svelte';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  const videos = [
    {
      url: 'https://x.com/i/status/1966609171929022780',
      id: '1966609171929022780',
      caption: 'GHF — חלוקת מזון בצפון עזה',
      date: '9 ביוני 2025',
    },
    {
      url: 'https://x.com/i/status/1962604678652547400',
      id: '1962604678652547400',
      caption: 'GHF — משפחות בתור לסיוע',
      date: '28 במאי 2025',
    },
    {
      url: 'https://x.com/i/status/1952128592894480814',
      id: '1952128592894480814',
      caption: 'GHF — ילדים בנקודת חלוקה',
      date: '1 במאי 2025',
    },
    {
      url: 'https://x.com/i/status/1946564469305249850',
      id: '1946564469305249850',
      caption: 'GHF — עדויות מהשטח',
      date: '19 באפריל 2025',
    },
  ];

  // Thumbnail URLs fetched from fxtwitter API (open, no auth needed)
  let thumbs = $state<Record<string, string>>({});

  // Track which videos have been clicked to load the embed
  let loaded = $state<Record<string, boolean>>({});

  function loadVideo(id: string) {
    loaded[id] = true;
    if (browser) {
      setTimeout(() => {
        (window as any).twttr?.widgets?.load();
      }, 100);
    }
  }

  onMount(async () => {
    if (!browser) return;

    // Load Twitter widgets script
    if (!(window as any).twttr) {
      const s = document.createElement('script');
      s.src = 'https://platform.twitter.com/widgets.js';
      s.async = true;
      s.charset = 'utf-8';
      document.head.appendChild(s);
    }

    // Fetch thumbnails via fxtwitter API (CORS-open, no auth)
    for (const video of videos) {
      try {
        const res = await fetch(`https://api.fxtwitter.com/status/${video.id}`);
        if (!res.ok) continue;
        const data = await res.json();
        const media = data?.tweet?.media?.all?.[0];
        if (media?.thumbnail_url) {
          thumbs[video.id] = media.thumbnail_url;
        } else if (media?.url) {
          thumbs[video.id] = media.url;
        }
      } catch {
        // No thumbnail available — fallback card will show
      }
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

    <div class="ghf-grid">
      {#each videos as video}
        <div class="ghf-item" use:reveal>
          {#if loaded[video.id]}
            <div class="ghf-embed-wrap">
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
          {:else}
            <button
              class="ghf-placeholder"
              onclick={() => loadVideo(video.id)}
              aria-label="לחץ לטעינת הסרטון: {video.caption}"
            >
              <div class="ghf-thumb-wrap">
                {#if thumbs[video.id]}
                  <img
                    class="ghf-thumb"
                    src={thumbs[video.id]}
                    alt={video.caption}
                  />
                {:else}
                  <!-- Styled gradient card when no thumbnail available -->
                  <div class="ghf-thumb-bg">
                    <svg class="ghf-x-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
                    </svg>
                  </div>
                {/if}
                <!-- Play button overlay -->
                <div class="ghf-play-overlay" aria-hidden="true">
                  <svg viewBox="0 0 48 48" width="44" height="44">
                    <circle cx="24" cy="24" r="22" fill="rgba(220,48,48,0.88)"/>
                    <polygon points="20,15 37,24 20,33" fill="white"/>
                  </svg>
                </div>
              </div>
              <div class="ghf-placeholder-meta">
                <span class="ghf-placeholder-caption">{video.caption}</span>
                <span class="ghf-placeholder-date">{video.date}</span>
                <span class="ghf-placeholder-cta">לחץ לצפייה ב-X ↗</span>
              </div>
            </button>
          {/if}
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
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }
  @media (max-width: 900px) { .ghf-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 500px) { .ghf-grid { grid-template-columns: 1fr; } }

  .ghf-item { display: flex; flex-direction: column; }

  /* Loaded embed */
  .ghf-embed-wrap {
    background: var(--bg-card);
    border: 1px solid var(--border-mid);
    border-top: 2px solid var(--accent);
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .ghf-embed-wrap :global(.twitter-tweet) {
    margin: 0 auto !important;
    max-width: 100% !important;
  }

  /* Placeholder button */
  .ghf-placeholder {
    width: 100%;
    border: 1px solid var(--border-mid);
    border-top: 2px solid var(--accent);
    background: var(--bg-card);
    cursor: pointer;
    padding: 0;
    transition: border-color 0.2s;
    display: flex;
    flex-direction: column;
  }
  .ghf-placeholder:hover { border-color: var(--accent); }

  /* Thumbnail area */
  .ghf-thumb-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 16/9;
    overflow: hidden;
    background: #111;
  }

  .ghf-thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.3s ease;
  }
  .ghf-placeholder:hover .ghf-thumb { transform: scale(1.04); }

  /* Gradient fallback when no thumbnail */
  .ghf-thumb-bg {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #1a1210 0%, #2a1820 50%, #1a1210 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ghf-x-icon {
    width: 36px;
    height: 36px;
    color: rgba(255,255,255,0.2);
  }

  /* Play button overlay */
  .ghf-play-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ghf-play-overlay svg {
    filter: drop-shadow(0 2px 10px rgba(0,0,0,0.6));
    transition: transform 0.2s;
  }
  .ghf-placeholder:hover .ghf-play-overlay svg { transform: scale(1.1); }

  /* Meta bar */
  .ghf-placeholder-meta {
    padding: 0.6rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    text-align: right;
  }

  .ghf-placeholder-caption {
    font-family: var(--font-ui);
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--text);
    line-height: 1.35;
  }

  .ghf-placeholder-date {
    font-family: var(--font-ui);
    font-size: 0.55rem;
    color: var(--text-muted);
    opacity: 0.7;
  }

  .ghf-placeholder-cta {
    font-family: var(--font-ui);
    font-size: 0.55rem;
    letter-spacing: 0.06em;
    color: var(--accent);
    margin-top: 0.1rem;
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
