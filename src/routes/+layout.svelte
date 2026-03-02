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
  import '../app.css';

  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { scrollY, docHeight } from '$lib/stores/scroll';
  import { windowHeight, windowWidth } from '$lib/stores/viewport';
  import { heroHeight, navVisible } from '$lib/stores/nav';

  onMount(() => {
    if (!browser) return;

    // VH fix for mobile
    function setVhUnit() {
      document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01) + 'px');
    }
    setVhUnit();

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

        // Nav visibility: show after 65% of hero
        const hh = heroEl ? (heroEl as HTMLElement).clientHeight : 600;
        heroHeight.set(hh);
        navVisible.set(window.scrollY > hh * 0.65);
      });
    }

    function onResize() {
      setVhUnit();
      windowHeight.set(window.innerHeight);
      windowWidth.set(window.innerWidth);
      // Re-cache hero ref on resize in case it mounted late
      heroEl = document.querySelector('.hero-scroll-container') || document.querySelector('.hero');
    }

    // Initialize
    onResize();
    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  });

  let { children } = $props();
</script>

{@render children()}
