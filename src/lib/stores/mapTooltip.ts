import { writable } from 'svelte/store';

export const mapTooltip = writable({
  visible: false,
  text: '',
  x: 0,
  y: 0
});
