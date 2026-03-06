<script lang="ts">
  import { onMount } from 'svelte';
  import { reveal } from '$lib/actions/reveal';
  import SectionHead from '$lib/components/ui/SectionHead.svelte';

  const tweets = [
    { id: '1966609171929022780', caption: 'ירי על אזרחים ממתינים לסיוע הומניטרי' },
    { id: '1962604678652547400', caption: 'עדות על אלימות בנקודות חלוקת מזון של ה-GHF' },
    { id: '1952128592894480814', caption: 'תיעוד מרכז סיוע תחת אש' },
    { id: '1946564469305249850', caption: 'פצועים בעקבות ירי ליד נקודת חלוקה' },
  ];

  onMount(() => {
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.charset = 'utf-8';
    document.body.appendChild(script);
  });
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
      {#each tweets as tweet}
        <div class="ghf-embed" use:reveal>
          <blockquote
            class="twitter-tweet"
            data-conversation="none"
            data-theme="dark"
            data-dnt="true"
            data-width="400"
          >
            <a href="https://twitter.com/i/status/{tweet.id}"></a>
          </blockquote>
          <p class="ghf-caption">{tweet.caption}</p>
        </div>
      {/each}
    </div>

    <p class="ghf-source">מקור: GHF (Global Humanitarian Foundation) · X/Twitter</p>
  </div>
</section>

<style>
  .ghf-section { padding: clamp(2rem, 6vw, 4rem) 0; }
  .ghf-head { margin-bottom: 2.5rem; }

  .ghf-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    align-items: start;
  }
  @media (max-width: 900px) { .ghf-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 500px) { .ghf-grid { grid-template-columns: 1fr; } }

  .ghf-embed {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
  }

  /* Force injected iframe to fill its column */
  .ghf-embed :global(.twitter-tweet),
  .ghf-embed :global(iframe.twitter-tweet-rendered) {
    margin: 0 !important;
    max-width: 100% !important;
    width: 100% !important;
  }

  .ghf-caption {
    font-family: var(--font-ui);
    font-size: 0.72rem;
    color: var(--text-muted);
    margin: 0;
    text-align: end;
    direction: rtl;
    line-height: 1.4;
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
