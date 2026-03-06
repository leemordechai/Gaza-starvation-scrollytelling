<script lang="ts">
  import { onMount } from 'svelte';

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

<svelte:head>
  <title>Video Embed Test</title>
</svelte:head>

<main>
  <a href="/" class="back-link">← Back to article</a>
  <h1>Twitter Video Embeds</h1>

  <div class="grid">
    {#each tweets as tweet}
      <div class="embed-wrap">
        <blockquote
          class="twitter-tweet"
          data-conversation="none"
          data-theme="dark"
          data-dnt="true"
          data-width="260"
        >
          <a href="https://twitter.com/i/status/{tweet.id}"></a>
        </blockquote>
        <p class="caption">{tweet.caption}</p>
      </div>
    {/each}
  </div>
</main>

<style>
  main {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 1.5rem 4rem;
    font-family: system-ui, sans-serif;
    color: #eee;
    background: #0d0d0d;
    min-height: 100vh;
  }

  .back-link {
    display: inline-block;
    margin-bottom: 1.5rem;
    color: #888;
    text-decoration: none;
    font-size: 0.85rem;
  }
  .back-link:hover { color: #ccc; }

  h1 {
    font-size: 1.4rem;
    font-weight: 700;
    margin: 0 0 1.5rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    align-items: start;
  }
  @media (max-width: 900px) {
    .grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 500px) {
    .grid { grid-template-columns: 1fr; }
  }

  .embed-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0; /* prevent grid blowout */
  }

  /* Force the injected iframe to fill its column */
  .embed-wrap :global(.twitter-tweet),
  .embed-wrap :global(iframe.twitter-tweet-rendered) {
    margin: 0 !important;
    max-width: 100% !important;
    width: 100% !important;
  }

  .caption {
    font-size: 0.72rem;
    color: #777;
    margin: 0;
    text-align: right;
    direction: rtl;
    line-height: 1.4;
  }
</style>
