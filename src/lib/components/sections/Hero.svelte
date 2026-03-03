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
    if (heroBg) {
      gsap.set(heroBg, { scale: 3.2, xPercent: 0, yPercent: -8 });
    }
    if (spotlight) {
      gsap.set(spotlight, { opacity: 1 });
    }

    // Phase 1: zoom-out + spotlight fade, completes at exactly one Page Down (100vh)
    const tlZoom = gsap.timeline({
      scrollTrigger: {
        trigger: '.hero-scroll-container',
        start: 'top top',
        end: '+=100vh',
        scrub: 1.2,
      }
    });

    if (scrollCue) {
      tlZoom.to(scrollCue, { opacity: 0, duration: 0.05, ease: 'none' }, 0);
    }
    if (spotlight) {
      tlZoom.to(spotlight, { opacity: 0, duration: 0.8, ease: 'power1.in' }, 0.1);
    }
    if (heroBg) {
      tlZoom.to(heroBg, {
        scale: 0.63,
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
      <span>גלול</span>
      <div class="cue-arrow"></div>
    </div>
  </section>

  <!-- Zoom phase: 100vh of scroll space. Page-down #1 snaps to start of this block. -->
  <div class="hero-phase-zoom" aria-hidden="true"></div>
</div>

<style>
  .hero-scroll-container {
    position: relative;
    scroll-snap-align: start;
  }
  .hero-scroll-container .hero { position: sticky; top: 0; }

  /* Zoom phase: 100vh of normal-flow scroll space after the sticky hero.
     scroll-snap-align: start means page-down #1 snaps to the top of this block
     (i.e. scroll position = 100vh, exactly when zoom-out completes). */
  .hero-phase-zoom {
    height: calc(var(--vh, 1vh) * 100);
    scroll-snap-align: start;
    pointer-events: none;
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
    position: absolute; inset: -30%;
    background-image: url('/images/hero.jpeg');
    background-size: cover;
    background-position: center 35%;
    transform-origin: 50% 38%;
    will-change: transform;
  }
  .hero-bg::after {
    content: ''; position: absolute; inset: 0;
    background: rgba(6, 5, 3, 0.38);
  }

  /* Tight spotlight on face when zoomed in — fades as we zoom out */
  .hero-spotlight {
    position: absolute; inset: 0; z-index: 1;
    background: radial-gradient(
      ellipse 18% 24% at 50% 38%,
      transparent 0%,
      rgba(3, 2, 1, 0.55) 55%,
      rgba(3, 2, 1, 0.92) 100%
    );
    pointer-events: none;
    will-change: opacity;
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
    background: radial-gradient(ellipse at center, transparent 28%, rgba(0,0,0,0.72) 100%);
    pointer-events: none;
  }
  .hero-fade {
    position: absolute; bottom: 0; left: 0; right: 0; height: 52%;
    background: linear-gradient(to bottom, transparent, var(--bg) 95%);
    pointer-events: none;
  }

  .hero-content {
    position: relative; z-index: 2;
    text-align: center; padding: 0 2rem;
    max-width: 920px;
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
    font-family: var(--font-body); font-size: clamp(0.95rem, 1.8vw, 1.2rem);
    font-weight: 300; line-height: 1.65; color: var(--sand);
    max-width: 620px; margin: 0 auto 2.5rem;
    text-align: center;
    text-wrap: balance;
    hyphens: auto;
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

  .scroll-cue {
    position: absolute; bottom: 2rem; left: 50%;
    transform: translateX(-50%); display: flex;
    flex-direction: column; align-items: center; gap: 6px;
    animation: cuebounce 2.8s ease-in-out infinite;
  }
  @keyframes cuebounce {
    0%, 100% { transform: translateX(-50%) translateY(0); }
    55% { transform: translateX(-50%) translateY(7px); }
  }
  .scroll-cue span {
    font-family: var(--font-ui); font-size: 0.55rem;
    letter-spacing: 0.25em; text-transform: uppercase; color: var(--text-muted);
  }
  .cue-arrow {
    width: 16px; height: 16px;
    border-right: 1px solid var(--accent); border-bottom: 1px solid var(--accent);
    transform: rotate(45deg); opacity: 0.55;
  }
</style>
