import { writable, derived } from 'svelte/store';

export const scrollY = writable(0);
export const docHeight = writable(1);
export const scrollProgress = derived(
  [scrollY, docHeight],
  ([$y, $h]) => Math.min($y / Math.max($h, 1), 1)
);
