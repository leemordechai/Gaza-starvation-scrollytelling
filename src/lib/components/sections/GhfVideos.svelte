<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  import SectionHead from '$lib/components/ui/SectionHead.svelte';

  const videos = [
    {
      url: 'https://x.com/i/status/1966609171929022780',
      caption: 'ירי על אזרחים ממתינים לסיוע הומניטרי',
      thumbnail: 'https://pbs.twimg.com/amplify_video_thumb/1966609012100620288/img/WAu2AAwNUNyY4SEN.jpg',
    },
    {
      url: 'https://x.com/i/status/1962604678652547400',
      caption: 'עדות על אלימות בנקודות חלוקת מזון של ה-GHF',
      thumbnail: 'https://pbs.twimg.com/amplify_video_thumb/1962604492299608064/img/lN4nA2c-YTA9cVcx.jpg',
    },
    {
      url: 'https://x.com/i/status/1952128592894480814',
      caption: 'תיעוד מרכז סיוע תחת אש',
      thumbnail: 'https://pbs.twimg.com/amplify_video_thumb/1952128373381062656/img/OrTASBAidXnkkHcw.jpg',
    },
    {
      url: 'https://x.com/i/status/1946564469305249850',
      caption: 'פצועים בעקבות ירי ליד נקודת חלוקה',
      thumbnail: 'https://pbs.twimg.com/amplify_video_thumb/1946564375310999555/img/RegjQYoAHgtYOZCj.jpg',
    },
  ];
</script>

<section class="ghf-section section-topo" id="video">
  <div class="container-wide">
    <div class="ghf-head" use:reveal>
      <SectionHead
        label="וידאו"
        title="ירי על מבקשי סיוע"
        sub="תיעוד מהרצועה ממחיש את האופן שבו התנהלו מרכזי סיוע שהפעילה ה-GHF. חלק מהסרטונים למטה קשים לצפיה."
      />
    </div>

    <div class="ghf-grid">
      {#each videos as video}
        <a
          class="ghf-card"
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={video.caption}
          use:reveal
        >
          <div class="ghf-thumb">
            <img src={video.thumbnail} alt={video.caption} loading="lazy" width="640" height="360" />
            <div class="ghf-overlay" aria-hidden="true">
              <div class="ghf-play">
                <svg viewBox="0 0 48 48" width="48" height="48">
                  <circle cx="24" cy="24" r="23" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
                  <polygon points="19,14 38,24 19,34" fill="white"/>
                </svg>
              </div>
              <div class="ghf-x-badge" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
            </div>
          </div>
        </a>
      {/each}
    </div>

    <p class="ghf-source">מקור: GHF (Global Humanitarian Foundation) · X/Twitter</p>
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

  .ghf-card {
    display: block;
    text-decoration: none;
    background: var(--bg-card);
    border: 1px solid var(--border-mid);
    border-top: 2px solid var(--accent);
    overflow: hidden;
    transition: border-color 0.2s;
  }
  .ghf-card:hover { border-color: var(--accent); }

  .ghf-thumb {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: #111;
  }
  .ghf-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }
  .ghf-card:hover .ghf-thumb img { transform: scale(1.03); }

  .ghf-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #1a1210 0%, #2a1a18 50%, #1a1210 100%);
  }

  .ghf-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.25);
    transition: background 0.2s;
  }
  .ghf-card:hover .ghf-overlay { background: rgba(0,0,0,0.15); }

  .ghf-play {
    filter: drop-shadow(0 2px 10px rgba(0,0,0,0.6));
    transition: transform 0.2s;
  }
  .ghf-card:hover .ghf-play { transform: scale(1.1); }

  .ghf-x-badge {
    position: absolute;
    bottom: 0.5rem;
    inset-inline-start: 0.6rem;
    background: rgba(0,0,0,0.65);
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ghf-source {
    font-family: var(--font-ui);
    font-size: 0.55rem;
    color: var(--text-muted);
    opacity: 0.6;
    margin-top: 1.5rem;
    text-align: end;
    direction: rtl;
  }
</style>
