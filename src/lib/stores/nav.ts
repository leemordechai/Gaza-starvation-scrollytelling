import { writable } from 'svelte/store';

export const heroHeight = writable(800);
export const navVisible = writable(false);
export const activeSection = writable<string>('background');
export const visitedSections = writable<Set<string>>(new Set());
export const mobileMenuOpen = writable(false);
