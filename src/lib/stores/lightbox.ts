import { writable } from 'svelte/store';

export const lightboxOpen = writable(false);
export const lightboxContent = writable<{ html: string; caption: string }>({ html: '', caption: '' });

export function openLightbox(svgEl: SVGElement | null, caption: string, html?: string) {
  const content = html || (svgEl ? svgEl.outerHTML : '');
  lightboxContent.set({ html: content, caption });
  lightboxOpen.set(true);
  if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
}

export function closeLightbox() {
  lightboxOpen.set(false);
  lightboxContent.set({ html: '', caption: '' });
  if (typeof document !== 'undefined') document.body.style.overflow = '';
}
