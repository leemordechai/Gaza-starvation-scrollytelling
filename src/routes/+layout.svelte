<script lang="ts">
  import '@fontsource/playfair-display/700.css';
  import '@fontsource/playfair-display/900.css';
  import '@fontsource/playfair-display/400-italic.css';
  import '@fontsource/playfair-display/700-italic.css';
  import '@fontsource/source-serif-4/300.css';
  import '@fontsource/source-serif-4/300-italic.css';
  import '@fontsource/source-serif-4/400.css';
  import '@fontsource/barlow-condensed/400.css';
  import '@fontsource/barlow-condensed/500.css';
  import '@fontsource/barlow-condensed/600.css';
  import '@fontsource/barlow-condensed/700.css';
  import '@fontsource/barlow-condensed/800.css';
  import '@fontsource/ibm-plex-mono/400.css';
  import '@fontsource/ibm-plex-mono/700.css';
  import '../app.css';

  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { scrollY, docHeight } from '$lib/stores/scroll';
  import { windowHeight, windowWidth } from '$lib/stores/viewport';
  import { heroHeight, navVisible } from '$lib/stores/nav';

  onMount(() => {
    if (!browser) return;

    // --vh fix for mobile: only update on width change (orientation) not on
    // height-only changes (mobile browser chrome show/hide), which would
    // trigger layout recalc on every scroll and cause visible jumping.
    let lastVhWidth = -1;
    let vhDebounce: ReturnType<typeof setTimeout>;
    function setVhUnit(force = false) {
      const w = window.innerWidth;
      if (!force && w === lastVhWidth) return; // height-only change — skip
      lastVhWidth = w;
      // Use visualViewport height when available: it reflects the true
      // content area excluding browser chrome, without flickering on scroll.
      const h = (window.visualViewport?.height ?? window.innerHeight);
      document.documentElement.style.setProperty('--vh', (h * 0.01) + 'px');
    }
    setVhUnit(true);

    // Cache hero element once — avoids a DOM query on every scroll event
    let heroEl: Element | null = document.querySelector('.hero-scroll-container') || document.querySelector('.hero');
    let rafPending = false;

    function onScroll() {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        scrollY.set(window.scrollY);
        docHeight.set(document.documentElement.scrollHeight - window.innerHeight);

        // Nav visibility:
        // Desktop: hidden at scrollY=0 (page load), appears as soon as the user
        //   starts scrolling (threshold: 40px — "has the user moved?").
        //   Hides again if user scrolls back to the very top.
        // Mobile: show after 65% of visible hero height (existing behaviour).
        const heroContainer = heroEl as HTMLElement | null;
        const hh = heroContainer ? heroContainer.clientHeight : 600;
        heroHeight.set(hh);
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
          navVisible.set(window.scrollY > hh * 0.65);
        } else {
          navVisible.set(window.scrollY > 40);
        }
      });
    }

    function onResize() {
      // Debounce resize updates — fires rapidly during mobile chrome show/hide.
      // Width-change check inside setVhUnit skips height-only reflows.
      clearTimeout(vhDebounce);
      vhDebounce = setTimeout(() => {
        setVhUnit();
        windowHeight.set(window.innerHeight);
        windowWidth.set(window.innerWidth);
        heroEl = document.querySelector('.hero-scroll-container') || document.querySelector('.hero');
      }, 150);
    }

    // Initialize
    setVhUnit(true);
    windowHeight.set(window.innerHeight);
    windowWidth.set(window.innerWidth);
    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      clearTimeout(vhDebounce);
    };
  });

  let { children } = $props();
</script>

{@render children()}
