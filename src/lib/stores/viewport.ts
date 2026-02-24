import { writable, derived } from 'svelte/store';

export const windowHeight = writable(800);
export const windowWidth = writable(1024);
export const vh = derived(windowHeight, ($h) => $h * 0.01);
export const isMobile = derived(windowWidth, ($w) => $w < 768);
