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
  import { pullQuote, pullQuote2, bridgeBeforeTimeline, bridgeTrucksMetric, famineDeaths, ghfNarrative } from '$lib/data/story.js';
  const bridge = bridgeBeforeTimeline;
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

  <!-- Bridging paragraph: sets up the timeline (structured list) -->
  <section class="bridge-section">
    <div class="container">
      <p class="bridge-intro reveal" use:reveal>{bridge.intro}</p>
      <ol class="bridge-list reveal" use:reveal>
        {#each bridge.items as item}
          <li>{item}</li>
        {/each}
      </ol>
    </div>
  </section>

  <Divider variant="fade" />

  <Timeline />

  <Divider variant="topo" />

  <!-- How we measure hunger — immediately after Timeline -->
  <MeasureSection />

  <Divider variant="topo" />

  <AidPhases />

  <Divider variant="topo" />

  <AidTrucks />

  <Divider variant="topo" />

  <TruckRoute />

  <div class="section-wipe" use:reveal aria-hidden="true"></div>

  <FoodPrices />

  <FoodCalculator />

  <Divider variant="topo" />

  <PriceExplorer />

  <Divider variant="topo" />

  <!-- Famine deaths narrative -->
  <NarrativeBlock title={famineDeaths.title} paragraphs={famineDeaths.paragraphs} />

  <Divider variant="fade" />

  <!-- GHF narrative (both paragraphs) -->
  <NarrativeBlock title={ghfNarrative.title} paragraphs={[ghfNarrative.paragraphBefore, ghfNarrative.paragraphAfter]} />

  <Divider variant="fade" />

  <PullQuote quote={pullQuote2.quote} attribution={pullQuote2.attribution} />

  <Divider variant="fade" />

  <GhfVideos />

  <Divider variant="gem" />

  <StatsBar />

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
    color: var(--text);
    margin-bottom: 1rem;
  }
  .bridge-list {
    font-size: 1.02rem;
    line-height: 1.82;
    color: var(--text);
    padding-inline-start: 1.4rem;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }
  .bridge-list li {
    padding-inline-start: 0.4rem;
  }
</style>
