<script lang="ts">
  import SkipLink from '$lib/components/ui/SkipLink.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import SiteNav from '$lib/components/ui/SiteNav.svelte';
  import MobileMenu from '$lib/components/ui/MobileMenu.svelte';
  import SectionIndicator from '$lib/components/ui/SectionIndicator.svelte';
  import CopyToast from '$lib/components/ui/CopyToast.svelte';
  import Divider from '$lib/components/ui/Divider.svelte';
  import BackToTop from '$lib/components/ui/BackToTop.svelte';
  import MilestoneBanner from '$lib/components/ui/MilestoneBanner.svelte';
  import PageScroll from '$lib/components/ui/PageScroll.svelte';
  import { reveal } from '$lib/actions/reveal';
  import Hero from '$lib/components/sections/Hero.svelte';
  import Intro from '$lib/components/sections/Intro.svelte';
  import BodyText from '$lib/components/sections/BodyText.svelte';
  import StatsBar from '$lib/components/sections/StatsBar.svelte';
  import Timeline from '$lib/components/sections/Timeline.svelte';
  import MeasureSection from '$lib/components/sections/MeasureSection.svelte';
  import Scrollytelling from '$lib/components/sections/Scrollytelling.svelte';
  import PullQuote from '$lib/components/sections/PullQuote.svelte';
  import TruckRoute from '$lib/components/sections/TruckRoute.svelte';
  import AidTrucks from '$lib/components/sections/AidTrucks.svelte';
  import AidPhases from '$lib/components/sections/AidPhases.svelte';
  import FoodPrices from '$lib/components/sections/FoodPrices.svelte';
  import FoodCalculator from '$lib/components/sections/FoodCalculator.svelte';
  import FoodDiversity from '$lib/components/sections/FoodDiversity.svelte';
  import PriceExplorer from '$lib/components/sections/PriceExplorer.svelte';
  import GhfVideos from '$lib/components/sections/GhfVideos.svelte';
  import IntentWall from '$lib/components/sections/IntentWall.svelte';
  import NarrativeBlock from '$lib/components/sections/NarrativeBlock.svelte';
  import Analysis from '$lib/components/sections/Analysis.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { pullQuote, pullQuote2, bridgeBeforeTimeline, bridgeTrucksMetric, famineDeaths, ghfNarrative, witnessTestimony, introBackground } from '$lib/data/story.js';
  import { sanitizeText } from '$lib/utils/sanitize';
  import { onMount, onDestroy } from 'svelte';
  const bridge = bridgeBeforeTimeline;

  let activeIntroIdx = $state(-1);
  let observer: IntersectionObserver | null = null;
  let famineHighlighted = $state(false);
  let famineTitleEl: HTMLElement;

  onMount(() => {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            activeIntroIdx = Number(el.dataset.idx);
          }
        });
      },
      { rootMargin: '-35% 0px -35% 0px', threshold: 0 }
    );
    document.querySelectorAll('.intro-bg-step').forEach(el => observer!.observe(el));

    const famineObs = new IntersectionObserver(
      ([entry]) => { famineHighlighted = entry.isIntersecting; },
      { threshold: 0.3 }
    );
    famineObs.observe(famineTitleEl);
  });

  onDestroy(() => {
    observer?.disconnect();
  });
</script>

<SkipLink />
<ProgressBar />
<SiteNav />
<MobileMenu />
<SectionIndicator />
<BackToTop />
<MilestoneBanner />
<PageScroll />

<main>
  <Hero />

  <div class="snap-point" aria-hidden="true"></div>

  <Intro />

  <!-- Background context paragraphs — scroll-driven, one at a time -->
  <div class="intro-bg-steps">
    {#each introBackground as item, i}
      <div
        class="intro-bg-step"
        class:active={activeIntroIdx === i}
        data-idx={i}
      >
        <div class="container">
          <p>{@html sanitizeText(item)}</p>
        </div>
      </div>
    {/each}
  </div>

  <Divider variant="gem" />

  <div class="snap-point" aria-hidden="true"></div>

  <!-- Guterres quote -->
  <PullQuote quote={pullQuote.quote} attribution={pullQuote.attribution} />

  <Divider variant="topo" />

  <!-- Bridging paragraphs: intro + first three items, centered -->
  <section id="food-characteristics" class="bridge-block bridge-block--centered container">
    {#each [bridge.intro, ...bridge.items.slice(0, 3)] as item}
      <p>{@html sanitizeText(item)}</p>
    {/each}
  </section>

  <!-- Fourth bridge item on its own page-down snap point -->
  <section class="bridge-block bridge-block--snap container">
    <p>{@html sanitizeText(bridge.items[3])}</p>
  </section>

  <Divider variant="fade" />

  <div class="snap-point" aria-hidden="true"></div>

  <Timeline />

  <Divider variant="gem" />

  <div class="snap-point" aria-hidden="true"></div>

  <!-- Intent preface paragraph -->
  <section class="intent-preface container" dir="rtl">
    <p class="reveal" use:reveal>לאורך המלחמה, גורמים בכירים בישראל התבטאו בעד עצירת הסיוע ההומניטרי. התבטאויות אלו פורסמו פעמים רבות בכלי התקשורת הישראליים וברשתות החברתיות, כמעט ללא ביקורת ציבורית. הצהרות אלו והיעדר ההתנגדות להן על ידי מוסדות מדינה בתוך ישראל מעידות על כוונותיהם של גורמים רבים בתוך שירות המדינה, ועל קיומו של שיח שבו הרעבת עזה הייתה לגיטימית ואף רצויה.</p>
  </section>

  <IntentWall />

  <Divider variant="fade" />

  <div class="snap-point" aria-hidden="true"></div>

  <!-- GHF narrative (both paragraphs) -->
  <NarrativeBlock id="ghf-narrative" title={ghfNarrative.title} paragraphs={[ghfNarrative.paragraphBefore, ghfNarrative.paragraphAfter]} />

  <Divider variant="fade" />

  <div class="snap-point" aria-hidden="true"></div>

  <PullQuote quote={pullQuote2.quote} attribution={pullQuote2.attribution} />

  <Divider variant="fade" />

  <div class="snap-point" aria-hidden="true"></div>

  <GhfVideos />

  <Divider variant="gem" />

  <div class="snap-point" aria-hidden="true"></div>

  <StatsBar />

  <Divider variant="topo" />

  <div class="snap-point" aria-hidden="true"></div>

  <!-- How we measure hunger -->
  <MeasureSection />

  <Divider variant="topo" />

  <div class="snap-point" aria-hidden="true"></div>

  <AidPhases />

  <Divider variant="topo" />

  <div class="snap-point" aria-hidden="true"></div>

  <AidTrucks />

  <Divider variant="topo" />

  <div class="snap-point" aria-hidden="true"></div>

  <TruckRoute />

  <div class="section-wipe" use:reveal aria-hidden="true"></div>

  <div class="snap-point" aria-hidden="true"></div>

  <FoodPrices />

  <Divider variant="topo" />

  <div class="snap-point" aria-hidden="true"></div>

  <PriceExplorer />

  <div class="snap-point" aria-hidden="true"></div>

  <FoodCalculator />

  <Divider variant="topo" />

  <!-- Famine deaths narrative -->
  <section class="famine-block nb-section snap-target">
    <div class="container">
      <h2 class="famine-title">
        <span class="famine-inner" class:famineHighlighted bind:this={famineTitleEl}>{famineDeaths.title}</span>
      </h2>
      {#each famineDeaths.paragraphs as p}
        <p class="nb-p reveal" use:reveal>{p}</p>
      {/each}
    </div>
  </section>

  <Divider variant="fade" />

  <div class="snap-point" aria-hidden="true"></div>

  <!-- Witness testimony -->
  <PullQuote quote={witnessTestimony.quote} attribution={witnessTestimony.attribution} small />

  <Divider variant="gem" />

  <div class="section-wipe" use:reveal aria-hidden="true"></div>

  <div class="snap-point" aria-hidden="true"></div>

  <FoodDiversity />

  <Divider variant="gem" />

  <div class="snap-point" aria-hidden="true"></div>

  <Analysis />
</main>

<Footer />
<CopyToast />

<style>
  /* Scroll snap sentinels */
  .snap-point {
    height: 0;
    scroll-snap-align: start;
  }
  .snap-target {
    scroll-snap-align: start;
  }

  /* ── Background context scroll steps (before PullQuote) ─── */
  .intro-bg-steps {
    margin-top: 0;
    scroll-snap-align: start;
  }
  .intro-bg-step {
    padding: 3rem 0;
    height: calc(var(--vh, 1vh) * 100);
    display: flex;
    align-items: center;
    opacity: 0.2;
    transition: opacity 0.5s ease;
    scroll-snap-align: start;
  }

  @media (max-width: 600px) {
    .intro-bg-step {
      height: auto;
      min-height: 60vh;
      padding: 4rem 0;
    }
  }
  .intro-bg-step.active {
    opacity: 1;
  }
  .intro-bg-step p {
    font-size: clamp(1.15rem, 2vw, 1.45rem);
    line-height: 1.72;
    color: var(--sand);
    font-family: var(--font-body);
    font-weight: 400;
  }

  /* mark.inv inside intro steps: RTL clip-path wipe driven by .active on parent */
  .intro-bg-step :global(mark.inv) {
    position: relative;
    display: inline;
    background: transparent;
    color: var(--sand);
    padding: 0.1em 0 0.1em 0.3em;
    border-radius: 2px;
    transition: color 0.3s ease 0.6s;
    animation: none;
  }
  .intro-bg-step :global(mark.inv::before) {
    content: '';
    position: absolute;
    inset: -0.1em 0 -0.1em -0.3em;
    background: rgba(140, 30, 22, 0.82);
    border-radius: 2px;
    clip-path: inset(0 100% 0 0);
    transition: clip-path 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.15s;
    z-index: -1;
  }
  .intro-bg-step.active :global(mark.inv::before) {
    clip-path: inset(0 0% 0 0);
  }
  .intro-bg-step.active :global(mark.inv) {
    color: #fff;
  }

  .bridge-block {
    padding: 3rem 0;
  }
  .bridge-block--centered {
    text-align: center;
    padding: 4rem 0;
    scroll-snap-align: start;
  }
  .bridge-block--centered p {
    max-width: 36ch;
    margin-inline: auto;
    margin-bottom: 1.4rem;
  }
  .bridge-block--snap {
    scroll-snap-align: start;
    min-height: calc(var(--vh, 1vh) * 60);
    display: flex;
    align-items: center;
  }
  .bridge-block p {
    font-size: clamp(1.15rem, 2vw, 1.45rem);
    line-height: 1.72;
    color: var(--sand);
    font-family: var(--font-body);
    font-weight: 400;
  }

  /* Intent preface */
  .intent-preface {
    padding: 3rem 0 1.5rem;
  }
  .intent-preface p {
    font-size: clamp(0.97rem, 1.6vw, 1.08rem);
    line-height: 1.82;
    color: var(--text);
    font-family: var(--font-body);
  }

  /* mark.inv styles and animation live in app.css (global) */

  /* Famine block layout */
  .famine-block.nb-section { padding: 3rem 0 2rem; }
  .famine-block .nb-p {
    font-size: 1.02rem;
    line-height: 1.82;
    color: var(--text);
    margin-bottom: 1.4rem;
  }

  .famine-title {
    font-family: var(--font-disp);
    font-size: clamp(1.3rem, 2.4vw, 1.9rem);
    font-weight: 800;
    line-height: 1.25;
    margin-bottom: 1.6rem;
  }

  .famine-inner {
    position: relative;
    display: inline-block;
    padding: 0.35rem 0.85rem;
    border-radius: 2px;
    color: var(--text);
    transition: color 0.3s ease 0.6s;
    z-index: 0;
  }
  .famine-inner::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(140, 30, 22, 0.82);
    border-radius: 2px;
    clip-path: inset(0 100% 0 0);
    transition: clip-path 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.15s;
    z-index: -1;
  }
  .famine-inner.famineHighlighted::before {
    clip-path: inset(0 0% 0 0);
  }
  .famine-inner.famineHighlighted {
    color: #fff;
  }
</style>
