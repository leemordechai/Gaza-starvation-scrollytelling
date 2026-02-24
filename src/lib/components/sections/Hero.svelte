<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { initGsap, killScrollTriggers } from '$lib/utils/gsap';
  import meta from '$lib/data/meta.json';

  let triggers: any[] = [];

  onMount(async () => {
    if (!browser) return;
    const result = await initGsap();
    if (!result) return;
    const { gsap, ScrollTrigger } = result;

    const heroBg = document.getElementById('hero-bg');
    const spotlight = document.getElementById('hero-spotlight');
    const media = document.getElementById('settlement-media');
    const caption = document.getElementById('settlement-caption');
    const heroContent = document.getElementById('hero-content');
    const scrollCue = document.getElementById('scroll-cue');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.hero-scroll-container',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.8,
        onUpdate: (self: any) => {
          if (caption) {
            caption.classList.toggle('visible', self.progress > 0.78);
          }
        }
      }
    });

    // ── Phase 1a (0→0.4): Start on destroyed highrise, pan right to central figure ──
    if (heroBg) {
      // Set initial position immediately (avoids flash before scroll)
      gsap.set(heroBg, { scale: 2.2, xPercent: 45, yPercent: 5 });

      tl.fromTo(heroBg, {
        scale: 2.2,
        xPercent: 45,
        yPercent: 5,
      }, {
        scale: 2.0,
        xPercent: 0,
        yPercent: 0,
        duration: 0.65,
        ease: 'power1.inOut'
      }, 0);

      // ── Phase 1b (0.65→1.0): Zoom out to reveal full ruined cityscape ──
      tl.to(heroBg, {
        scale: 1.0,
        xPercent: 0,
        yPercent: 0,
        duration: 0.35,
        ease: 'power2.out'
      }, 0.65);
    }

    if (spotlight) {
      // Spotlight stays strong through slow pan, fades during zoom-out
      tl.fromTo(spotlight, {
        opacity: 1,
      }, {
        opacity: 0.85,
        duration: 0.65,
        ease: 'none'
      }, 0);
      tl.to(spotlight, {
        opacity: 0,
        duration: 0.3,
        ease: 'power1.in'
      }, 0.65);
    }

    // Scroll cue fades quickly
    if (scrollCue) {
      tl.to(scrollCue, {
        opacity: 0,
        duration: 0.12,
        ease: 'none'
      }, 0);
    }

    // ── Phase 2 (1→2): Settlement expand, text fades ──
    if (media) {
      tl.to(media, {
        width: '100vw',
        height: 'calc(var(--vh, 1vh) * 100)',
        borderRadius: 0,
        duration: 1,
        ease: 'none'
      }, 1);
    }

    if (heroContent) {
      tl.to(heroContent, {
        opacity: 0,
        y: -60,
        duration: 0.4,
        ease: 'none'
      }, 1);
    }

    triggers.push(tl.scrollTrigger);
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

    <div class="settlement-media" id="settlement-media">
      <img src="/images/settlement.jpg" alt="Israeli settlement compound surrounded by destruction in Gaza" />
      <div class="settlement-overlay"></div>
      <div class="settlement-caption" id="settlement-caption">
        <p>{meta.settlementCaption}</p>
      </div>
    </div>

    <div class="hero-content" id="hero-content">
      <span class="section-label">{meta.sectionLabel}</span>
      <div class="hero-title-wrap">
        <h1 class="hero-title hero-title-line1">The <em>Return</em></h1>
        <h1 class="hero-title hero-title-line2">to Gaza</h1>
      </div>
      <p class="hero-dek">{meta.dek}</p>
      <div class="hero-meta">
        <span>By <span class="byline">{meta.byline.replace('By ', '')}</span></span>
        <span class="sep">&middot;</span>
        <span>{meta.date}</span>
        <span class="sep">&middot;</span>
        <span>{meta.readTime}</span>
      </div>
    </div>

    <div class="scroll-cue" id="scroll-cue">
      <span>Scroll</span>
      <div class="cue-arrow"></div>
    </div>
  </section>
</div>

<style>
  .hero-scroll-container {
    position: relative;
    height: calc(var(--vh, 1vh) * 500);
  }
  .hero-scroll-container .hero { position: sticky; top: 0; }

  .hero {
    position: relative;
    height: calc(var(--vh, 1vh) * 100);
    min-height: 640px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    overflow: hidden;
  }

  .hero-bg {
    position: absolute; inset: -30%;
    background-image: url('/images/hero.jpg');
    background-size: cover;
    background-position: center 40%;
    transform: scale(2.2);
    transform-origin: 50% 50%;
    will-change: transform;
  }
  .hero-bg::after {
    content: ''; position: absolute; inset: 0;
    background: rgba(6, 5, 3, 0.45);
  }

  /* Spotlight: tall vertical ellipse, slightly left to frame the far-left building */
  .hero-spotlight {
    position: absolute; inset: 0; z-index: 1;
    background: radial-gradient(
      ellipse 24% 65% at 46% 46%,
      transparent 0%,
      rgba(3, 2, 1, 0.5) 50%,
      rgba(3, 2, 1, 0.9) 100%
    );
    pointer-events: none;
    will-change: opacity;
  }

  .hero-topo {
    position: absolute; inset: 0; opacity: 0.14;
    background-image: repeating-linear-gradient(125deg, var(--gold) 0px, transparent 1px, transparent 55px, var(--gold) 56px, transparent 57px, transparent 110px);
  }
  .hero-grain {
    position: absolute; inset: 0; opacity: 0.4;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 300px; mix-blend-mode: overlay; pointer-events: none;
  }
  .hero-vignette {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.75) 100%);
    pointer-events: none;
  }
  .hero-fade {
    position: absolute; bottom: 0; left: 0; right: 0; height: 55%;
    background: linear-gradient(to bottom, transparent, var(--bg) 95%);
    pointer-events: none;
  }

  .hero-content {
    position: relative; z-index: 2;
    text-align: center; padding: 0 2rem 5.5rem;
    max-width: 920px; will-change: opacity, transform;
  }
  .section-label {
    font-family: var(--font-ui); font-size: 0.65rem; font-weight: 700;
    letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold);
    display: block; margin-bottom: 1.5rem;
  }
  .hero-title-wrap { display: flex; flex-direction: column; align-items: center; }
  .hero-title {
    font-family: var(--font-disp); font-size: clamp(3rem, 8vw, 6.5rem);
    font-weight: 900; line-height: 0.98; color: #fff;
    margin-bottom: 1.4rem; text-shadow: 0 4px 60px rgba(0,0,0,0.5);
    letter-spacing: -0.01em;
  }
  .hero-title :global(em) { font-style: italic; color: var(--gold-light); }
  .hero-title-line1 { margin-bottom: 0; will-change: transform; }
  .hero-title-line2 { will-change: transform; }

  .hero-dek {
    font-family: var(--font-body); font-size: clamp(0.95rem, 1.8vw, 1.2rem);
    font-weight: 300; line-height: 1.65; color: var(--sand);
    max-width: 620px; margin: 0 auto 2.5rem;
  }
  .hero-meta {
    display: flex; align-items: center; justify-content: center;
    flex-wrap: wrap; gap: 0.6rem 1.4rem;
  }
  .hero-meta span {
    font-family: var(--font-ui); font-size: 0.68rem; font-weight: 500;
    letter-spacing: 0.09em; text-transform: uppercase; color: var(--text-muted);
  }
  .hero-meta :global(.byline) { color: var(--gold); font-weight: 700; }
  .hero-meta :global(.sep) { color: var(--border-mid); }

  .settlement-media {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%); z-index: 1;
    width: 30px; height: 20px;
    max-width: 95vw; max-height: calc(var(--vh, 1vh) * 85);
    overflow: hidden; border-radius: 16px;
    box-shadow: 0 0 50px rgba(0,0,0,0.4);
    will-change: width, height, border-radius;
  }
  .settlement-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .settlement-overlay {
    position: absolute; inset: 0; background: rgba(0,0,0,0.5);
    border-radius: inherit; pointer-events: none;
  }
  .settlement-caption {
    position: absolute; bottom: 8%; left: 50%;
    transform: translateX(-50%); text-align: center;
    opacity: 0; transition: opacity 0.8s ease;
    pointer-events: none; z-index: 2;
  }
  .settlement-caption.visible { opacity: 1; }
  .settlement-caption p {
    font-family: var(--font-body); font-size: clamp(0.95rem, 1.8vw, 1.25rem);
    font-style: italic; font-weight: 300; color: #fff;
    text-shadow: 0 2px 20px rgba(0,0,0,0.7); max-width: 540px;
    line-height: 1.6; padding: 1rem 2rem;
    background: rgba(0,0,0,0.35); border-radius: 4px;
    backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  }

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
    border-right: 1px solid var(--gold); border-bottom: 1px solid var(--gold);
    transform: rotate(45deg); opacity: 0.55;
  }

  @media (max-width: 768px) {
    .settlement-media { width: 25px; height: 16px; }
  }
</style>
