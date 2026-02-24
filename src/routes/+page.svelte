<script lang="ts">
  import SkipLink from '$lib/components/ui/SkipLink.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import SiteNav from '$lib/components/ui/SiteNav.svelte';
  import MobileMenu from '$lib/components/ui/MobileMenu.svelte';
  import SectionIndicator from '$lib/components/ui/SectionIndicator.svelte';
  import Lightbox from '$lib/components/ui/Lightbox.svelte';
  import CopyToast from '$lib/components/ui/CopyToast.svelte';
  import Divider from '$lib/components/ui/Divider.svelte';
  import Hero from '$lib/components/sections/Hero.svelte';
  import Intro from '$lib/components/sections/Intro.svelte';
  import BeforeAfter from '$lib/components/sections/BeforeAfter.svelte';
  import StatsBar from '$lib/components/sections/StatsBar.svelte';
  import Timeline from '$lib/components/sections/Timeline.svelte';
  import Scrollytelling from '$lib/components/sections/Scrollytelling.svelte';
  import PullQuote from '$lib/components/sections/PullQuote.svelte';
  import Charts from '$lib/components/sections/Charts.svelte';
  import Gallery from '$lib/components/sections/Gallery.svelte';
  import MapSection from '$lib/components/sections/MapSection.svelte';
  import Video from '$lib/components/sections/Video.svelte';
  import Analysis from '$lib/components/sections/Analysis.svelte';
  import Footer from '$lib/components/Footer.svelte';
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

  <BeforeAfter />

  <StatsBar />

  <Divider variant="fade" />

  <Timeline />

  <Divider variant="topo" />

  <Scrollytelling />

  <PullQuote />

  <Divider variant="gem" />

  <Charts />

  <Divider variant="fade" />

  <Gallery />

  <Divider variant="gem" />

  <MapSection />

  <Video />

  <Divider variant="fade" />

  <Analysis />
</main>

<Footer />
<Lightbox />
<CopyToast />
