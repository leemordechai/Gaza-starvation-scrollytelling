import DOMPurify from 'dompurify';

/**
 * Sanitize narrative HTML — allows only safe inline tags used in story.js
 * (mark, strong, em, br, a, span) and strips everything else.
 */
export function sanitizeText(html: string): string {
  if (typeof window === 'undefined') return html; // SSR: content is trusted static data
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['mark', 'strong', 'em', 'br', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}

/**
 * Sanitize SVG/HTML for the lightbox — allows SVG elements but strips
 * all event handlers (onload, onclick, etc.) and javascript: URLs.
 */
export function sanitizeSVG(html: string): string {
  if (typeof window === 'undefined') return html; // SSR: content is trusted static data
  return DOMPurify.sanitize(html, { USE_PROFILES: { svg: true } });
}
