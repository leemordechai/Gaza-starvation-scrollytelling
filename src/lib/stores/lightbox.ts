import { writable } from 'svelte/store';
import { sanitizeSVG } from '$lib/utils/sanitize';

export const lightboxOpen = writable(false);
export const lightboxContent = writable<{ html: string; caption: string }>({ html: '', caption: '' });

export function openLightbox(svgEl: SVGElement | null, caption: string, html?: string) {
  const raw = html || (svgEl ? svgEl.outerHTML : '');
  const content = sanitizeSVG(raw);
  lightboxContent.set({ html: content, caption });
  lightboxOpen.set(true);
  if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
}

export function closeLightbox() {
  lightboxOpen.set(false);
  lightboxContent.set({ html: '', caption: '' });
  if (typeof document !== 'undefined') document.body.style.overflow = '';
}
