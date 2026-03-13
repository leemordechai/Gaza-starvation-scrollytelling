<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { initGsap, killScrollTriggers } from '$lib/utils/gsap';
  import { hero as meta } from '$lib/data/story.js';

  let triggers: any[] = [];

  onMount(async () => {
    if (!browser) return;
    const result = await initGsap();
    if (!result) return;
    const { gsap, ScrollTrigger } = result;

    const heroBg = document.getElementById('hero-bg');
    const spotlight = document.getElementById('hero-spotlight');
    const heroContent = document.getElementById('hero-content');
    const scrollCue = document.getElementById('scroll-cue');

    // Start zoomed in tight on the girl's face (center of image)
    // then slowly zoom out to reveal the full scene as user scrolls
    const heroDim = document.getElementById('hero-dim');

    if (heroBg) {
      gsap.set(heroBg, { scale: 3.2, xPercent: 0, yPercent: 0 });
    }
    if (spotlight) {
      gsap.set(spotlight, { opacity: 1 });
    }
    if (heroDim) {
      gsap.set(heroDim, { opacity: 1 });
    }

    // Phase 1: zoom-out + spotlight fade, completes at exactly one Page Down (100vh)
    // On mobile use scrub:true (no lag) so the animation tracks finger position
    // directly — avoids the follow-through that causes perceived jumping.
    const isMobile = window.innerWidth <= 768;
    const tlZoom = gsap.timeline({
      scrollTrigger: {
        trigger: '.hero-scroll-container',
        start: 'top top',
        end: '+=100vh',
        scrub: isMobile ? true : 1.2,
      }
    });

    if (scrollCue) {
      tlZoom.to(scrollCue, { opacity: 0, duration: 0.05, ease: 'none' }, 0);
    }
    if (spotlight) {
      tlZoom.to(spotlight, { opacity: 0, duration: 0.8, ease: 'power1.in' }, 0.1);
    }
    if (heroDim) {
      tlZoom.to(heroDim, { opacity: 0, duration: 1, ease: 'power1.inOut' }, 0);
    }
    if (heroBg) {
      tlZoom.to(heroBg, {
        scale: 1,
        xPercent: 0,
        yPercent: 0,
        duration: 1,
        ease: 'power2.inOut'
      }, 0);
    }

    triggers.push(tlZoom.scrollTrigger);
  });

  onDestroy(() => {
    killScrollTriggers(triggers);
  });
</script>

<div class="hero-scroll-container">
  <section class="hero">
    <div class="hero-bg" id="hero-bg" aria-hidden="true"></div>
    <div class="hero-dim" id="hero-dim" aria-hidden="true"></div>
    <div class="hero-spotlight" id="hero-spotlight" aria-hidden="true"></div>
    <div class="hero-topo" aria-hidden="true"></div>
    <div class="hero-grain" aria-hidden="true"></div>
    <div class="hero-vignette" aria-hidden="true"></div>
    <div class="hero-fade" aria-hidden="true"></div>

    <div class="hero-content" id="hero-content">
      <div class="section-label-wrap">
        <span class="section-label">{meta.sectionLabel}</span>
      </div>
      <div class="hero-title-wrap">
        <h1 class="hero-title">{meta.titleLine1} {meta.titleLine2}</h1>
      </div>
      <p class="hero-dek">{meta.dek}</p>
      <div class="hero-meta">
        <span class="byline">{meta.byline}</span>
        <span class="sep">&middot;</span>
        <span>{meta.date}</span>
        <span class="sep">&middot;</span>
        <span>{meta.readTime}</span>
      </div>
    </div>

    <div class="scroll-cue" id="scroll-cue">
      <span class="cue-label">לחוויה מיטבית, גלול למטה</span>
      <div class="cue-arrow"></div>
    </div>
  </section>

  <!-- Zoom phase: 100vh of scroll space — animation runs during this scroll. -->
  <div class="hero-phase-zoom" aria-hidden="true"></div>
  <!-- Dwell phase: another 100vh so the hero stays sticky + fully revealed
       after zoom completes, before scrolling away into the intro steps. -->
  <div class="hero-phase-dwell" aria-hidden="true"></div>
</div>

<style>
  .hero-scroll-container {
    position: relative;
    scroll-snap-align: start;
  }
  .hero-scroll-container .hero { position: sticky; top: 0; }

  /* Zoom phase: 100vh — GSAP animation runs during this scroll (3.2×→1×). */
  .hero-phase-zoom {
    height: calc(var(--vh, 1vh) * 100);
    pointer-events: none;
  }

  /* Dwell phase: another 100vh so the hero stays sticky and fully revealed
     before it scrolls away into the intro steps.
     On mobile (≤768px) reduce to 30vh — the zoom completes in the first 100vh,
     and a full extra viewport of frozen image feels like a "duplicate frame". */
  .hero-phase-dwell {
    height: calc(var(--vh, 1vh) * 100);
    pointer-events: none;
  }
  @media (max-width: 768px) {
    .hero-phase-dwell {
      height: calc(var(--vh, 1vh) * 30);
    }
  }

  .hero {
    position: relative;
    height: calc(var(--vh, 1vh) * 100);
    min-height: 640px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .hero-bg {
    position: absolute; inset: 0;
    background-image: url('/images/hero.jpeg');
    background-size: 120% auto;
    background-position: center 45%;
    transform-origin: 50% 45%;
  }
  @media (min-width: 769px) {
    /* will-change is costly on low-memory mobile devices — only enable on desktop */
    .hero-bg { will-change: transform; }
  }
  .hero-bg::after {
    content: ''; position: absolute; inset: 0;
    background: rgba(6, 5, 3, 0.12);
  }

  /* Dark overlay that lifts as the hero zooms out, brightening the image */
  .hero-dim {
    position: absolute; inset: 0; z-index: 1;
    background: rgba(4, 3, 2, 0.5);
    pointer-events: none;
  }

  /* Tight spotlight on face when zoomed in — fades as we zoom out */
  .hero-spotlight {
    position: absolute; inset: 0; z-index: 2;
    background: radial-gradient(
      ellipse 18% 24% at 50% 38%,
      transparent 0%,
      rgba(3, 2, 1, 0.55) 55%,
      rgba(3, 2, 1, 0.92) 100%
    );
    pointer-events: none;
  }

  @media (min-width: 769px) {
    .hero-dim     { will-change: opacity; }
    .hero-spotlight { will-change: opacity; }
  }

  .hero-topo {
    position: absolute; inset: 0; opacity: 0.12;
    background-image: repeating-linear-gradient(125deg, var(--accent) 0px, transparent 1px, transparent 55px, var(--accent) 56px, transparent 57px, transparent 110px);
  }
  .hero-grain {
    position: absolute; inset: 0; opacity: 0.38;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 300px; mix-blend-mode: overlay; pointer-events: none;
  }
  .hero-vignette {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.45) 100%);
    pointer-events: none;
  }
  .hero-fade {
    position: absolute; bottom: 0; left: 0; right: 0; height: 52%;
    background: linear-gradient(to bottom, transparent, var(--bg) 95%);
    pointer-events: none;
  }

  .hero-content {
    position: relative; z-index: 2;
    text-align: center; padding: 0 clamp(1rem, 4vw, 3rem);
    max-width: 1100px;
    /* Shift slightly upward from center to account for the fade gradient at bottom */
    margin-bottom: 8vh;
  }
  .section-label-wrap {
    margin-bottom: 1.5rem;
  }
  .section-label {
    font-family: var(--font-ui); font-size: 0.65rem; font-weight: 700;
    letter-spacing: 0.3em; text-transform: uppercase;
    color: rgba(196, 162, 74, 0.95);
    text-shadow: 0 1px 8px rgba(0, 0, 0, 0.8);
    display: inline-block;
    background: rgba(0, 0, 0, 0.28);
    padding: 0.25rem 0.75rem;
    border-radius: 2px;
    border: 1px solid rgba(196, 162, 74, 0.35);
  }
  .hero-title-wrap { display: flex; flex-direction: column; align-items: center; }
  .hero-title {
    font-family: var(--font-disp); font-size: clamp(3.5rem, 10vw, 7.5rem);
    font-weight: 900; line-height: 1; color: #fff;
    margin-bottom: 1.4rem; text-shadow: 0 4px 60px rgba(0,0,0,0.5);
    letter-spacing: -0.02em;
    white-space: nowrap;
  }
  .hero-title :global(em) { font-style: italic; color: var(--accent-light); }

  .hero-dek {
    font-family: var(--font-body); font-size: clamp(0.95rem, 1.6vw, 1.3rem);
    font-weight: 400; line-height: 1.65; color: #f0e8d8;
    max-width: 680px; margin: 0 auto 2.5rem;
    text-align: center;
    text-wrap: balance;
    hyphens: auto;
    text-shadow: 0 1px 12px rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.6);
  }
  .hero-meta {
    display: flex; align-items: center; justify-content: center;
    flex-wrap: wrap; gap: 0.6rem 1.4rem;
  }
  .hero-meta span {
    font-family: var(--font-ui); font-size: 0.68rem; font-weight: 500;
    letter-spacing: 0.09em; text-transform: uppercase; color: var(--text-muted);
  }
  .hero-meta :global(.byline) { color: var(--accent); font-weight: 700; }
  .hero-meta :global(.sep) { color: var(--border-mid); }

  @media (max-width: 900px) {
    .hero-title { white-space: normal; }
  }

  @media (max-width: 600px) {
    .section-label { font-size: 0.72rem; }
    .hero-meta span { font-size: 0.78rem; }
    .scroll-cue span { font-size: 0.68rem; }
    .hero-dek { max-width: 100%; }
  }

  @media (max-width: 380px) {
    .hero-content { padding: 0 0.85rem; }
    .hero-meta { gap: 0.4rem 0.8rem; }
  }

  .scroll-cue {
    position: absolute; bottom: 2.5rem; left: 50%;
    transform: translateX(-50%); display: flex;
    flex-direction: column; align-items: center; gap: 10px;
    animation: cuebounce 2.8s ease-in-out infinite;
  }
  @keyframes cuebounce {
    0%, 100% { transform: translateX(-50%) translateY(0); }
    55% { transform: translateX(-50%) translateY(8px); }
  }
  .cue-label {
    font-family: var(--font-ui); font-size: 0.72rem;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: rgba(240, 230, 200, 0.82);
    text-shadow: 0 1px 8px rgba(0, 0, 0, 0.9);
    white-space: nowrap;
  }
  .cue-arrow {
    width: 20px; height: 20px;
    border-right: 1.5px solid var(--accent); border-bottom: 1.5px solid var(--accent);
    transform: rotate(45deg); opacity: 0.75;
  }
  @media (max-width: 600px) {
    .cue-label { font-size: 0.65rem; letter-spacing: 0.12em; }
  }
</style>
