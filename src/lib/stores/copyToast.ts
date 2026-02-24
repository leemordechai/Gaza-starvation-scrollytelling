import { writable } from 'svelte/store';

export const toastVisible = writable(false);

export function showToast(durationMs = 2200) {
  toastVisible.set(true);
  setTimeout(() => toastVisible.set(false), durationMs);
}
