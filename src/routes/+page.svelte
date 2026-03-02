<script lang="ts">
  import SkipLink from '$lib/components/ui/SkipLink.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import SiteNav from '$lib/components/ui/SiteNav.svelte';
  import MobileMenu from '$lib/components/ui/MobileMenu.svelte';
  import SectionIndicator from '$lib/components/ui/SectionIndicator.svelte';
  import CopyToast from '$lib/components/ui/CopyToast.svelte';
  import Divider from '$lib/components/ui/Divider.svelte';
  import AudioPlayer from '$lib/components/ui/AudioPlayer.svelte';
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
  import NarrativeBlock from '$lib/components/sections/NarrativeBlock.svelte';
  import Analysis from '$lib/components/sections/Analysis.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { pullQuote, pullQuote2, bridgeBeforeTimeline, bridgeTrucksMetric, famineDeaths, ghfNarrative, witnessTestimony } from '$lib/data/story.js';
  import { onMount, onDestroy } from 'svelte';
  const bridge = bridgeBeforeTimeline;

  let activeIdx = $state(-1);
  let observer: IntersectionObserver | null = null;

  onMount(() => {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            activeIdx = Number((entry.target as HTMLElement).dataset.idx);
          }
        });
      },
      { rootMargin: '-35% 0px -35% 0px', threshold: 0 }
    );
    document.querySelectorAll('.bridge-step').forEach(el => observer!.observe(el));
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
<AudioPlayer />
<BackToTop />
<MilestoneBanner />
<PageScroll />

<main>
  <Hero />

  <Intro />
  <Divider variant="gem" />

  <!-- Guterres quote moved here, right after Intro -->
  <PullQuote quote={pullQuote.quote} attribution={pullQuote.attribution} />

  <Divider variant="topo" />

  <!-- Bridging paragraphs: scroll-driven, one at a time -->
  <section class="bridge-section">
    <div class="container">
      <p class="bridge-intro reveal" use:reveal>{bridge.intro}</p>
    </div>
    <div class="bridge-steps">
      {#each bridge.items as item, i}
        <div
          class="bridge-step"
          class:active={activeIdx === i}
          data-idx={i}
        >
          <div class="container">
            <p>{@html item}</p>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <Divider variant="fade" />

  <Timeline />

  <Divider variant="fade" />

  <!-- GHF narrative (both paragraphs) -->
  <NarrativeBlock title={ghfNarrative.title} paragraphs={[ghfNarrative.paragraphBefore, ghfNarrative.paragraphAfter]} />

  <Divider variant="fade" />

  <PullQuote quote={pullQuote2.quote} attribution={pullQuote2.attribution} />

  <Divider variant="fade" />

  <GhfVideos />

  <Divider variant="gem" />

  <StatsBar />

  <Divider variant="topo" />

  <!-- How we measure hunger -->
  <MeasureSection />

  <Divider variant="topo" />

  <AidPhases />

  <Divider variant="topo" />

  <AidTrucks />

  <Divider variant="topo" />

  <TruckRoute />

  <div class="section-wipe" use:reveal aria-hidden="true"></div>

  <FoodPrices />

  <Divider variant="topo" />

  <PriceExplorer />

  <FoodCalculator />

  <Divider variant="topo" />

  <!-- Famine deaths narrative -->
  <div class="famine-block">
    <NarrativeBlock title={famineDeaths.title} paragraphs={famineDeaths.paragraphs} />
  </div>

  <Divider variant="fade" />

  <!-- Witness testimony -->
  <section class="witness-section reveal" use:reveal>
    <div class="container">
      <blockquote class="witness-quote">
        <p>{witnessTestimony.quote}</p>
        <footer class="witness-attribution">{witnessTestimony.attribution}</footer>
      </blockquote>
    </div>
  </section>

  <Divider variant="gem" />

  <div class="section-wipe" use:reveal aria-hidden="true"></div>

  <FoodDiversity />

  <Divider variant="gem" />

  <Analysis />
</main>

<Footer />
<CopyToast />

<style>
  .bridge-section {
    padding: 2.5rem 0;
  }
  .bridge-intro {
    font-size: 1.02rem;
    line-height: 1.82;
    color: var(--text-muted);
    margin-bottom: 0;
  }
  .bridge-steps {
    margin-top: 0;
  }
  .bridge-step {
    padding: 3rem 0;
    height: calc(var(--vh, 1vh) * 100);
    display: flex;
    align-items: center;
    opacity: 0.2;
    transition: opacity 0.5s ease;
  }
  .bridge-step.active {
    opacity: 1;
  }
  .bridge-step p {
    font-size: clamp(1.15rem, 2vw, 1.45rem);
    line-height: 1.72;
    color: var(--sand);
    font-family: var(--font-body);
    font-weight: 400;
  }

  .witness-section {
    padding: 4rem 0;
    background: rgba(155, 42, 33, 0.07);
    border-top: 1px solid rgba(155, 42, 33, 0.18);
    border-bottom: 1px solid rgba(155, 42, 33, 0.18);
  }
  .witness-quote {
    margin: 0 auto;
    padding: 0;
    max-width: 68ch;
  }
  .witness-quote p {
    font-family: var(--font-body);
    font-size: clamp(1rem, 1.6vw, 1.2rem);
    font-style: italic;
    line-height: 1.82;
    color: var(--sand);
    margin: 0 0 1.25rem;
  }
  .witness-attribution {
    font-family: var(--font-ui);
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--accent);
  }

  /* ── Inverted highlight: white text on dull red ─── */
  :global(mark.inv) {
    background: rgba(140, 30, 22, 0.82);
    color: #fff;
    padding: 0.1em 0.3em;
    border-radius: 2px;
    font-style: normal;
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
  }

  /* famineDeaths title gets full inverted treatment */
  .famine-block :global(.nb-title) {
    background: rgba(140, 30, 22, 0.82);
    color: #fff;
    padding: 0.35rem 0.85rem;
    border-right: none;
    display: inline-block;
    border-radius: 2px;
  }
</style>
