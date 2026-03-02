/**
 * Svelte action: scroll-reveal via IntersectionObserver.
 * - once: true  (default) — adds `.shown` on enter, one-shot
 * - once: false — adds `.shown` on enter, removes it on exit (re-triggers each pass)
 *
 * Usage: <div use:reveal> or <div use:reveal={{ threshold: 0.2, once: false }}>
 */

interface RevealOptions {
  threshold?: number;
  once?: boolean;
}

const defaultOptions: RevealOptions = {
  threshold: 0.12,
  once: true,
};

function makeObserver(node: HTMLElement, opts: Required<RevealOptions>): IntersectionObserver {
  return new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('shown');
          if (opts.once) observer.unobserve(entry.target);
        } else if (!opts.once) {
          // Remove so the animation can re-trigger next time
          entry.target.classList.remove('shown');
        }
      }
    },
    { threshold: opts.threshold }
  );
  // Note: `observer` is hoisted by the closure below
}

export function reveal(node: HTMLElement, opts?: RevealOptions) {
  const merged = { ...defaultOptions, ...opts } as Required<RevealOptions>;

  let observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('shown');
          if (merged.once) observer.unobserve(entry.target);
        } else if (!merged.once) {
          entry.target.classList.remove('shown');
        }
      }
    },
    { threshold: merged.threshold }
  );

  observer.observe(node);

  return {
    update(newOpts?: RevealOptions) {
      observer.disconnect();
      node.classList.remove('shown');
      const next = { ...defaultOptions, ...newOpts } as Required<RevealOptions>;
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('shown');
              if (next.once) observer.unobserve(entry.target);
            } else if (!next.once) {
              entry.target.classList.remove('shown');
            }
          }
        },
        { threshold: next.threshold }
      );
      observer.observe(node);
    },
    destroy() {
      observer.disconnect();
    },
  };
}
