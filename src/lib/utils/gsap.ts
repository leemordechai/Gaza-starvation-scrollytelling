import { browser } from '$app/environment';

let gsapReady = false;
let cachedGsap: any = null;
let cachedScrollTrigger: any = null;

export async function initGsap() {
  if (!browser) return null;
  if (gsapReady) return { gsap: cachedGsap, ScrollTrigger: cachedScrollTrigger };

  const { gsap } = await import('gsap');
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');
  gsap.registerPlugin(ScrollTrigger);

  cachedGsap = gsap;
  cachedScrollTrigger = ScrollTrigger;
  gsapReady = true;

  return { gsap, ScrollTrigger };
}

export function killScrollTriggers(triggers: any[]) {
  triggers.forEach(t => t?.kill());
  triggers.length = 0;
}
