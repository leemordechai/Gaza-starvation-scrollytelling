<script lang="ts">
  import { reveal } from '$lib/actions/reveal';
  import SectionHead from '$lib/components/ui/SectionHead.svelte';
</script>

<section class="video-section" id="video">
  <div class="container-wide">
    <div class="video-head">
      <SectionHead label="Video Report" title="Inside the Movement" />
    </div>

    <div class="video-wrapper reveal" use:reveal>
      <div class="video-inner">
        <div class="play-ring">
          <div class="play-tri"></div>
        </div>
        <div class="video-title">The Settlers Who Want to Return to Gaza</div>
        <div class="video-meta">Video Report &middot; 8:42</div>
        <div class="video-teaser">From the ruins of Gaza to the halls of the Knesset</div>
      </div>
    </div>
    <p class="video-caption">Reporter narration and interviews with settler movement leaders, former Gush Katif residents, and Israeli officials. Credit: Visual Desk / Reuters</p>
  </div>
</section>

<style>
  .video-section { padding: 5rem 0; }
  .video-head { margin-bottom: 2.5rem; }

  .video-wrapper {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%;
    background: #000;
    overflow: hidden;
  }

  .video-inner {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1a1612 0%, #0c0b08 100%);
    background-image: url('/images/gallery-5.jpg');
    background-size: cover;
    background-position: center;
    gap: 1.4rem;
    cursor: pointer;
  }
  .video-inner::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(12, 11, 8, 0.7);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }
  .video-inner > :global(*) { position: relative; z-index: 1; }
  .video-inner:hover .play-ring { background: var(--accent); }
  .video-inner:hover .play-tri { border-left-color: #000; }

  .play-ring {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    border: 2px solid var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.25s;
    animation: playPulse 2.5s ease-in-out infinite;
  }
  @keyframes playPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(196, 162, 74, 0.4); }
    50% { box-shadow: 0 0 0 14px rgba(196, 162, 74, 0); }
  }

  .play-tri {
    width: 0;
    height: 0;
    border-top: 11px solid transparent;
    border-bottom: 11px solid transparent;
    border-left: 19px solid var(--accent);
    margin-left: 4px;
    transition: border-left-color 0.25s;
  }

  .video-title {
    font-family: var(--font-disp);
    font-size: clamp(1.1rem, 2.5vw, 1.6rem);
    font-weight: 700;
    color: var(--sand);
    text-align: center;
    max-width: 480px;
    padding: 0 1.5rem;
  }

  .video-meta {
    font-family: var(--font-ui);
    font-size: 0.65rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .video-teaser {
    font-family: var(--font-body);
    font-size: 0.85rem;
    font-style: italic;
    color: var(--sand);
    opacity: 0.7;
    text-align: center;
    max-width: 320px;
  }

  .video-caption {
    font-family: var(--font-ui);
    font-size: 0.62rem;
    color: var(--text-muted);
    margin-top: 0.5rem;
    letter-spacing: 0.03em;
  }
</style>
