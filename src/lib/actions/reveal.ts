/**
 * Svelte action: scroll-reveal via IntersectionObserver.
 * Adds `.shown` class when element enters viewport (one-shot).
 *
 * Usage: <div use:reveal> or <div use:reveal={{ threshold: 0.2 }}>
 */

interface RevealOptions {
  threshold?: number;
  once?: boolean;
}

const defaultOptions: RevealOptions = {
  threshold: 0.12,
  once: true,
};

export function reveal(node: HTMLElement, opts?: RevealOptions) {
  const { threshold, once } = { ...defaultOptions, ...opts };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('shown');
          if (once) observer.unobserve(entry.target);
        }
      }
    },
    { threshold }
  );

  observer.observe(node);

  return {
    update(newOpts?: RevealOptions) {
      // If options change, reconnect
      observer.unobserve(node);
      node.classList.remove('shown');
      const merged = { ...defaultOptions, ...newOpts };
      observer.disconnect();
      const newObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('shown');
              if (merged.once) newObserver.unobserve(entry.target);
            }
          }
        },
        { threshold: merged.threshold }
      );
      newObserver.observe(node);
    },
    destroy() {
      observer.disconnect();
    },
  };
}
