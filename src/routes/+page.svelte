<script lang="ts">
  import SkipLink from '$lib/components/ui/SkipLink.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import SiteNav from '$lib/components/ui/SiteNav.svelte';
  import MobileMenu from '$lib/components/ui/MobileMenu.svelte';
  import SectionIndicator from '$lib/components/ui/SectionIndicator.svelte';
  import CopyToast from '$lib/components/ui/CopyToast.svelte';
  import Divider from '$lib/components/ui/Divider.svelte';
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
  import FoodDiversity from '$lib/components/sections/FoodDiversity.svelte';
  import PriceExplorer from '$lib/components/sections/PriceExplorer.svelte';
  import GhfVideos from '$lib/components/sections/GhfVideos.svelte';
  import Analysis from '$lib/components/sections/Analysis.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { pullQuote, pullQuote2, bridgeBeforeTimeline, bridgeTrucksMetric } from '$lib/data/story.js';
</script>

<SkipLink />
<ProgressBar />
<SiteNav />
<MobileMenu />
<SectionIndicator />

<main>
  <Hero />

  <Intro />
  <Divider variant="gem" />

  <!-- Guterres quote moved here, right after Intro -->
  <PullQuote quote={pullQuote.quote} attribution={pullQuote.attribution} />

  <Divider variant="topo" />

  <!-- Bridging paragraph: sets up the timeline -->
  <BodyText text={bridgeBeforeTimeline} />

  <Divider variant="fade" />

  <Timeline />

  <Divider variant="topo" />

  <!-- How we measure hunger — immediately after Timeline -->
  <MeasureSection />

  <!-- Bridging paragraph: trucks metric context, leads into AidTrucks -->
  <BodyText text={bridgeTrucksMetric} />

  <Divider variant="topo" />

  <AidPhases />

  <Divider variant="topo" />

  <AidTrucks />

  <Divider variant="topo" />

  <TruckRoute />

  <Divider variant="topo" />

  <FoodPrices />

  <Divider variant="topo" />

  <PriceExplorer />

  <Divider variant="gem" />

  <FoodDiversity />

  <Divider variant="fade" />

  <PullQuote quote={pullQuote2.quote} attribution={pullQuote2.attribution} />

  <Divider variant="gem" />

  <!-- Stats bar moved here, just before GHF videos -->
  <StatsBar />

  <Divider variant="fade" />

  <GhfVideos />

  <Divider variant="fade" />

  <Analysis />
</main>

<Footer />
<CopyToast />
