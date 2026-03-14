<script lang="ts">
  import SkipLink from '$lib/components/ui/SkipLink.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import SiteNav from '$lib/components/ui/SiteNav.svelte';
  import MobileMenu from '$lib/components/ui/MobileMenu.svelte';
  import SectionIndicator from '$lib/components/ui/SectionIndicator.svelte';
  import Divider from '$lib/components/ui/Divider.svelte';
  import BackToTop from '$lib/components/ui/BackToTop.svelte';
  import MilestoneBanner from '$lib/components/ui/MilestoneBanner.svelte';
  import PageScroll from '$lib/components/ui/PageScroll.svelte';
  import { reveal } from '$lib/actions/reveal';
  import Hero from '$lib/components/sections/Hero.svelte';
  import Intro from '$lib/components/sections/Intro.svelte';
  import BodyText from '$lib/components/sections/BodyText.svelte';
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
  import IntentWall from '$lib/components/sections/IntentWall.svelte';
  import Analysis from '$lib/components/sections/Analysis.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { intro, pullQuote, bridgeBeforeTimeline, famineDeaths, witnessTestimony, introBackground, aidBlockade } from '$lib/data/story.js';
  import { sanitizeText } from '$lib/utils/sanitize';
  import { onMount } from 'svelte';
  const bridge = bridgeBeforeTimeline;

  let famineHighlighted = $state(false);
  let famineTitleEl: HTMLElement;

  onMount(() => {
    const famineObs = new IntersectionObserver(
      ([entry]) => { famineHighlighted = entry.isIntersecting; },
      { threshold: 0.3 }
    );
    famineObs.observe(famineTitleEl);

    // When PageDown/Space is pressed while the bridge block is visible,
    // snap to the FoodPrices header instead of jumping past it.
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'PageDown' && !(e.key === ' ' && !e.shiftKey)) return;
      const bridge = document.getElementById('food-characteristics');
      const target = document.getElementById('food-prices');
      if (!bridge || !target) return;
      const br = bridge.getBoundingClientRect();
      // Only intercept when bridge block is in view (bottom is below viewport top)
      if (br.bottom > 0 && br.top < window.innerHeight) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
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

  <div class="intro-step" id="background" dir="rtl">
    <div class="container-prose">
      <p>{intro.lede}</p>
    </div>
  </div>

  <div class="intro-step" dir="rtl">
    <div class="container-prose">
      <p>{@html sanitizeText(introBackground[0])}</p>
    </div>
  </div>

  <div class="intro-step" dir="rtl">
    <div class="container-prose reveal reveal-no-fade" use:reveal={{ once: false, threshold: 0.05 }}>
      <p>{@html sanitizeText(introBackground[1])}</p>
    </div>
  </div>

  <!-- Guterres quote -->
  <PullQuote quote={pullQuote.quote} attribution={pullQuote.attribution} />

  <Divider variant="topo" />

  <Timeline />

  <div class="snap-point" aria-hidden="true"></div>

  <!-- Intent section header -->
  <header id="intent-header" class="chapter-head snap-target" dir="rtl">
    <div class="chapter-head-inner">
      <span class="chapter-label">הצהרת כוונות</span>
      <div class="chapter-rule" aria-hidden="true"></div>
      <h2 class="chapter-title">בפיהם שלהם: התבטאויות בכירים ישראלים</h2>
    </div>
  </header>

  <!-- Intent preface — sticky paragraph centered vertically -->
  <div class="intent-preface-scroll" aria-label="רקע">
    <div class="intent-preface-sticky">
      <div class="intent-preface-inner container" dir="rtl">
        <p>ב-9 באוקטובר 2023 הכריז שר הבטחון דאז יואב גלנט על סגירת הרצועה לכניסת מזון, חשמל ומים. מאז - בין אם כאמצעי ובין אם כמטרה בפני עצמה - המשיכו שרים וחברי כנסת ישראלים להצהיר כי השלכות המצור - רעב כבד, ותמותה מרעב ומחלות - הן לגיטימיות ואף רצויות. התבטאויות אלו פורסמו פעמים רבות בכלי התקשורת הישראליים וברשתות החברתיות, כמעט ללא ביקורת ציבורית. הצהרות אלו והיעדר ההתנגדות להן על ידי מוסדות מדינה בתוך ישראל מעידות על כוונותיהם של גורמים רבים בתוך שירות המדינה.</p>
      </div>
    </div>
  </div>

  <IntentWall />

  <Divider variant="fade" />

  <div class="snap-point" aria-hidden="true"></div>

  <!-- Reality section header -->
  <header id="reality-header" class="chapter-head snap-target">
    <div class="chapter-head-inner">
      <span class="chapter-label">חיים ומוות בזמן מלחמה</span>
      <div class="chapter-rule" aria-hidden="true"></div>
      <h2 class="chapter-title">הסיוע ההומניטרי לעזה</h2>
    </div>
  </header>

  <!-- How we measure hunger -->
  <div class="measure-pull">
    <MeasureSection />
  </div>

  <div class="snap-point" aria-hidden="true"></div>

  <!-- ── חלק א' ─────────────────────────────────────────────────── -->
  <header id="chapter-1" class="chapter-head snap-target">
    <div class="chapter-head-inner">
      <span class="chapter-label">חלק א׳</span>
      <div class="chapter-rule" aria-hidden="true"></div>
      <h2 class="chapter-title">עורק החיים: כניסת משאיות</h2>
    </div>
  </header>

  <!-- Band with section background: grids only -->
  <div class="ch1-band section-topo">
    <AidPhases />
  </div>

  <!-- Three-part bridge before the full time-series chart — outside band, RTL -->
  <div class="ch1-mid-head snap-target" dir="rtl">
    <div class="ch1-mid-inner container-wide">
      <span class="ch1-mid-label">{aidBlockade.sectionLabel}</span>
      <div class="ch1-mid-rule" aria-hidden="true"></div>
      <h3 class="ch1-mid-title">{aidBlockade.sectionTitle}</h3>
      <p class="ch1-mid-sub">{aidBlockade.sectionSub}</p>
    </div>
  </div>

  <AidTrucks />

  <Divider variant="topo" />

  <!-- ── חלק ב' – הדרך לצלחת ──────────────────────────────────── -->
  <header id="chapter-2" class="chapter-head snap-target">
    <div class="chapter-head-inner">
      <span class="chapter-label">חלק ב׳</span>
      <div class="chapter-rule" aria-hidden="true"></div>
      <h2 class="chapter-title">הדרך אל הצלחת</h2>
    </div>
  </header>

  <TruckRoute />

  <div class="section-wipe" use:reveal aria-hidden="true"></div>

  <!-- ── חלק ג' – תנודתיות המחירים ───────────────────────────── -->
  <header id="chapter-3" class="chapter-head snap-target">
    <div class="chapter-head-inner">
      <span class="chapter-label">חלק ג׳</span>
      <div class="chapter-rule" aria-hidden="true"></div>
      <h2 class="chapter-title">כמה עולה לשרוד?</h2>
    </div>
  </header>

  <!-- Bridging paragraphs: food availability characteristics -->
  <section id="food-characteristics" class="bridge-block bridge-block--centered container" dir="rtl">
    <h3 class="bridge-title">{@html sanitizeText(bridge.intro)}</h3>
    <ul class="bridge-list">
      {#each bridge.items.slice(0, 3) as item}
        <li>{@html sanitizeText(item)}</li>
      {/each}
    </ul>
  </section>

  <FoodPrices />

  <Divider variant="topo" />

  <div class="snap-point" aria-hidden="true"></div>

  <PriceExplorer />

  <FoodCalculator />

  <div class="snap-point" aria-hidden="true"></div>

  <!-- ── חלק ד' – הרכב המזון ──────────────────────────────────── -->
  <header id="chapter-4" class="chapter-head snap-target">
    <div class="chapter-head-inner">
      <span class="chapter-label">חלק ד׳</span>
      <div class="chapter-rule" aria-hidden="true"></div>
      <h2 class="chapter-title">תזונה ורעב בעזה</h2>
    </div>
  </header>

  <FoodDiversity />

  <div class="snap-point" aria-hidden="true"></div>

  <!-- ── חלק ה' – תוצאות והשלכות ──────────────────────────────── -->
  <header id="chapter-5" class="chapter-head snap-target">
    <div class="chapter-head-inner">
      <span class="chapter-label">חלק ה׳</span>
      <div class="chapter-rule" aria-hidden="true"></div>
      <h2 class="chapter-title">השלכות</h2>
    </div>
  </header>

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

  <div class="section-wipe" use:reveal aria-hidden="true"></div>

  <div class="snap-point" aria-hidden="true"></div>

  <Analysis />
</main>

<Footer />

<style>
  /* Scroll snap sentinels */
  .snap-point {
    height: 0;
    scroll-snap-align: start;
  }
  .snap-target {
    scroll-snap-align: start;
  }

  /* ── Each intro step: exact viewport height, centered accounting for nav ─── */
  .intro-step {
    min-height: calc(var(--vh, 1vh) * 100);
    display: flex;
    align-items: center;
    justify-content: center;
    /* Offset nav bar (56px) so text appears truly centered in visible area */
    padding: 56px clamp(1.25rem, 5vw, 3rem) clamp(2rem, 4vh, 3rem);
    scroll-snap-align: start;
    /* Allow the reveal translateY(28px) animation to show outside bounds */
    overflow: visible;
  }
  .intro-step p {
    font-size: clamp(1.1rem, 1.65vw, 1.45rem);
    line-height: 1.75;
    color: var(--sand);
    font-family: var(--font-disp);
    font-weight: 400;
    text-align: right;
  }

  .bridge-block {
    padding: 3rem 0;
  }
  .bridge-block--centered {
    text-align: center;
    padding-block: 4rem;
    scroll-snap-align: start;
    height: calc(var(--vh, 1vh) * 100);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  @media (max-width: 700px) {
    .bridge-block--centered {
      width: 80%;
      margin-inline: auto;
    }
  }

  .bridge-block--centered[dir='rtl'] {
    text-align: right;
    align-items: flex-end;
  }
  .bridge-block--centered p {
    max-width: 36ch;
    margin-inline: auto;
    margin-bottom: 1.4rem;
  }
  .bridge-block--snap {
    scroll-snap-align: start;
    min-height: calc(var(--vh, 1vh) * 100);
    display: flex;
    align-items: center;
  }
  @media (max-width: 768px) {
    .bridge-block--snap { min-height: 0; padding-block: clamp(2rem, 6vh, 3.5rem); }
  }
  .bridge-title {
    font-family: var(--font-disp);
    font-size: clamp(1.3rem, 2.5vw, 2.2rem);
    font-weight: 700;
    color: var(--accent-light);
    margin-bottom: 1.8rem;
    line-height: 1.3;
    max-width: 40ch;
    margin-inline: auto;
  }
  [dir='rtl'] .bridge-title {
    margin-inline: 0;
    text-align: right;
    max-width: 100%;
  }
  .bridge-block p {
    font-size: clamp(1.05rem, 1.8vw, 1.35rem);
    line-height: 1.72;
    color: var(--sand);
    font-family: var(--font-body);
    font-weight: 400;
  }

  .bridge-list {
    list-style: disc inside;
    padding: 0;
    margin: 0;
    width: 100%;
    text-align: right;
    direction: rtl;
  }
  .bridge-list li {
    font-size: clamp(1.05rem, 1.8vw, 1.35rem);
    line-height: 1.72;
    color: var(--sand);
    font-family: var(--font-body);
    font-weight: 400;
    margin-bottom: 0.4rem;
  }

  /* Statement of intent — second snap point, exact viewport height, nothing bleeds */
  .intent-statement {
    height: calc(var(--vh, 1vh) * 100);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 clamp(1.25rem, 5vw, 3rem);
    scroll-snap-align: start;
  }
  .intent-statement-inner p {
    font-size: clamp(1.05rem, 1.8vw, 1.35rem);
    line-height: 1.9;
    color: var(--text);
    font-family: var(--font-body);
    font-weight: 300;
    text-align: right;
  }

  /* Intent preface — sits directly below the chapter header, no bleed-up */
  .intent-preface-scroll {
    margin-top: 0;
    padding: clamp(1rem, 2vh, 2rem) 0 clamp(2rem, 4vh, 3rem);
    position: relative;
    z-index: 1;
  }
  .intent-preface-inner p {
    font-size: clamp(1.05rem, 1.8vw, 1.35rem);
    line-height: 1.9;
    color: var(--text);
    font-family: var(--font-body);
    max-width: 70ch;
  }

  /* Pull MeasureSection up to bleed below reality header */
  .measure-pull {
    margin-top: 0;
    position: relative;
    z-index: 1;
  }

  /* ── Chapter 1 band ── */
  .ch1-band {
    background: var(--bg-section);
    position: relative;
  }
  /* Strip inherited dark bg from ap-section inside band */
  .ch1-band :global(.ap-section) {
    background: transparent;
  }
  /* Dim empty grid cells to suit warm bg */
  .ch1-band :global(.td-cell) {
    background: rgba(80, 40, 10, 0.1);
  }
  /* Muted text on warm bg */
  .ch1-band :global(.td-step-body),
  .ch1-band :global(.td-step-period),
  .ch1-band :global(.td-step-detail),
  .ch1-band :global(.td-counter-unit),
  .ch1-band :global(.td-scale-note) {
    color: #4a3018;
  }
  /* Three-part mid-head */
  .ch1-mid-head {
    min-height: calc(var(--vh, 1vh) * 5);
    display: flex;
    align-items: flex-start;
    padding: 1rem 0 0;
    scroll-snap-align: start;
  }
  .ch1-mid-inner {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0 clamp(1.25rem, 5vw, 4rem) 0 clamp(3rem, 10vw, 8rem);
    text-align: right;
    width: 100%;
  }
  .ch1-mid-label {
    font-family: var(--font-ui);
    font-size: clamp(0.52rem, 0.75vw, 0.68rem);
    font-weight: 700;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .ch1-mid-rule {
    width: 2rem;
    height: 1px;
    background: var(--accent);
    opacity: 0.5;
  }
  .ch1-mid-title {
    font-family: var(--font-disp);
    font-size: clamp(1.4rem, 2.6vw, 2.2rem);
    font-weight: 700;
    line-height: 1.2;
    color: var(--text);
    letter-spacing: -0.01em;
    margin: 0;
  }
  .ch1-mid-sub {
    font-family: var(--font-body);
    font-size: clamp(0.85rem, 1.2vw, 0.95rem);
    color: var(--text-muted);
    margin: 0.25rem 0 0;
    line-height: 1.55;
    text-align: right;
  }

  /* ── Chapter headers (חלק א׳–ה׳) ── */
  .chapter-head {
    height: calc(var(--vh, 1vh) * 100);
    min-height: 480px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 56px clamp(1.25rem, 5vw, 4rem) 0;
    text-align: center;
    position: relative;
    scroll-snap-align: start;
  }
  /* Horizontal rule through the center */
  .chapter-head::before {
    content: '';
    position: absolute;
    top: 50%;
    left: clamp(1.25rem, 8vw, 8rem);
    right: clamp(1.25rem, 8vw, 8rem);
    height: 1px;
    background: var(--border-mid);
    transform: translateY(-50%);
  }
  /* Content block floats above the rule */
  .chapter-head-inner {
    position: relative;
    background: var(--bg);
    padding: clamp(1.5rem, 3vw, 2.5rem) clamp(2rem, 5vw, 5rem);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
  .chapter-label {
    font-family: var(--font-ui);
    font-size: clamp(0.55rem, 0.8vw, 0.72rem);
    font-weight: 700;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .chapter-rule {
    width: 2rem;
    height: 1px;
    background: var(--accent);
    opacity: 0.5;
  }
  .chapter-title {
    font-family: var(--font-disp);
    font-size: clamp(1.6rem, 3.5vw, 3.2rem);
    font-weight: 700;
    line-height: 1.2;
    color: var(--text);
    letter-spacing: -0.01em;
    margin: 0;
  }

  @media (max-width: 480px) {
    .chapter-head-inner { padding: 1.25rem 1.5rem; }
    .chapter-head::before { left: 1.25rem; right: 1.25rem; }
  }

  /* ── Tablet + mobile: compact chapter headers and intro steps ── */
  @media (max-width: 1024px) {
    .chapter-head {
      height: auto;
      min-height: 0;
      padding-block: clamp(3rem, 10vh, 5rem);
    }
    .intro-step {
      min-height: 0;
      padding-block: clamp(2.5rem, 8vh, 4rem);
    }
    .bridge-block--centered {
      height: auto;
      min-height: 0;
      padding-block: clamp(3rem, 8vh, 5rem);
    }
    .famine-block.nb-section {
      min-height: 0;
      padding-block: clamp(2.5rem, 8vh, 4rem);
    }
  }
  /* Narrow mobile: top-align intro text + nav clearance (after 1024px rule so padding-top wins) */
  @media (max-width: 600px) {
    .intro-step {
      align-items: flex-start;
      padding-top: max(4.5rem, calc(56px + 4vh));
    }
  }

  /* ── Reduce top padding on first section after a chapter header ── */
  /* Targets the known first-child elements that immediately follow .chapter-head */
  .chapter-head + :global(.ap-section .ap-intro),
  .chapter-head + :global(.tr-section .tr-header),
  .chapter-head + .snap-point + :global(.tr-section .tr-header) {
    padding-top: 1.5rem;
  }
  .chapter-head + .bridge-block,
  .chapter-head + .bridge-block--centered {
    padding-top: 1.5rem;
  }
  .chapter-head + .famine-block {
    padding-top: 1.5rem;
  }
  :global(.chapter-head + .fd-section .fd-intro) {
    padding-top: 1.5rem;
  }

  /* mark.inv styles and animation live in app.css (global) */

  /* Famine block layout */
  .famine-block.nb-section { padding: 3rem 0 2rem; min-height: calc(var(--vh, 1vh) * 100); display: flex; align-items: center; }
  .famine-block .nb-p {
    font-size: 1.02rem;
    line-height: 1.82;
    color: var(--text);
    margin-bottom: 1.4rem;
  }

  .famine-title {
    font-family: var(--font-disp);
    font-size: clamp(1.3rem, 2.4vw, 2.4rem);
    font-weight: 800;
    line-height: 1.25;
    margin-bottom: 1.6rem;
  }

  @media (min-width: 1400px) {
    .famine-block .nb-p { font-size: 1.12rem; }
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
