/**
 * Svelte action: fires callbacks when element enters/leaves viewport.
 * Useful for counters, section tracking, and lazy initialization.
 *
 * Usage:
 *   <div use:viewport={{ onEnter: () => {}, onLeave: () => {}, threshold: 0.5 }}>
 *   <div use:viewport={{ onEnter: () => {}, once: true }}>
 */

interface ViewportOptions {
  onEnter?: (node: HTMLElement) => void;
  onLeave?: (node: HTMLElement) => void;
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export function viewport(node: HTMLElement, opts: ViewportOptions) {
  let observer: IntersectionObserver;

  function createObserver(options: ViewportOptions) {
    const { onEnter, onLeave, threshold = 0.35, rootMargin = '0px', once = false } = options;

    return new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onEnter?.(entry.target as HTMLElement);
            if (once) observer.unobserve(entry.target);
          } else {
            onLeave?.(entry.target as HTMLElement);
          }
        }
      },
      { threshold, rootMargin }
    );
  }

  observer = createObserver(opts);
  observer.observe(node);

  return {
    update(newOpts: ViewportOptions) {
      observer.disconnect();
      observer = createObserver(newOpts);
      observer.observe(node);
    },
    destroy() {
      observer.disconnect();
    },
  };
}
