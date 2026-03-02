<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  // Height of the fixed nav bar — must match SiteNav.svelte
  const NAV_H = 56;

  // Selectors that define meaningful scroll anchors in reading order.
  // Sections with IDs = major section tops.
  // Scrollytelling steps = the individual narrative cards within sticky sections.
  const STEP_SELECTORS = [
    'section[id]',       // all named sections
    '.fd-step',          // FoodDiversity narrative steps
    '.fp-step',          // FoodPrices narrative steps
    '.s-step',           // Scrollytelling narrative steps
  ].join(', ');

  /**
   * Collect all anchor top positions (document-relative) from the DOM,
   * sorted ascending. Called on each keydown so it stays fresh even after
   * layout shifts (e.g. fonts load, images expand).
   */
  function getAnchors(): number[] {
    const els = document.querySelectorAll<HTMLElement>(STEP_SELECTORS);
    const tops: number[] = [];
    els.forEach(el => {
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY - NAV_H;
      // Only include elements that are meaningfully tall (skip tiny dividers
      // that might accidentally match the selector).
      if (el.offsetHeight > 60) {
        tops.push(Math.max(0, top));
      }
    });
    // Deduplicate positions that are within 10px of each other
    return [...new Set(tops.map(t => Math.round(t)))]
      .sort((a, b) => a - b)
      .filter((t, i, arr) => i === 0 || t - arr[i - 1] > 10);
  }

  /**
   * Find the best scroll target for PageDown.
   *
   * Strategy:
   *   1. If there is an anchor within (currentY + 40px) to
   *      (currentY + vh * 1.4), jump to it — lands at the top of the
   *      next visible section/step.
   *   2. Otherwise, scroll by (vh - NAV_H) so the user advances by
   *      a full readable viewport without the nav obscuring the first line.
   */
  function targetDown(anchors: number[], currentY: number, vh: number): number {
    const lo = currentY + 40;       // ignore anchors we're already past
    const hi = currentY + vh * 1.4; // don't skip too far ahead
    const next = anchors.find(a => a >= lo && a <= hi);
    if (next !== undefined) return next;
    // No anchor in range — advance by one viewport minus nav
    return currentY + (vh - NAV_H);
  }

  /**
   * Find the best scroll target for PageUp.
   *
   * Strategy:
   *   1. If there is an anchor above currentY by more than 40px,
   *      jump to the nearest one above us.
   *   2. Otherwise, scroll back by (vh - NAV_H).
   */
  function targetUp(anchors: number[], currentY: number, vh: number): number {
    const prev = [...anchors].reverse().find(a => a < currentY - 40);
    if (prev !== undefined) return prev;
    return Math.max(0, currentY - (vh - NAV_H));
  }

  function handleKeyDown(e: KeyboardEvent) {
    // Only intercept unmodified PageDown/PageUp (allow ctrl/alt combos through)
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key !== 'PageDown' && e.key !== 'PageUp') return;

    // Don't intercept if focus is inside a scrollable sub-element
    // (e.g. a modal, a dropdown, a code block with its own scrollbar)
    const active = document.activeElement as HTMLElement | null;
    if (active && active !== document.body && active !== document.documentElement) {
      const style = window.getComputedStyle(active);
      const overflowY = style.overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') return;
    }

    e.preventDefault();

    const currentY = window.scrollY;
    const vh = window.innerHeight;
    const anchors = getAnchors();
    const maxY = document.documentElement.scrollHeight - vh;

    let target: number;
    if (e.key === 'PageDown') {
      target = Math.min(maxY, targetDown(anchors, currentY, vh));
    } else {
      target = Math.max(0, targetUp(anchors, currentY, vh));
    }

    window.scrollTo({ top: target, behavior: 'smooth' });
  }

  onMount(() => {
    if (!browser) return;
    window.addEventListener('keydown', handleKeyDown);
  });

  onDestroy(() => {
    if (!browser) return;
    window.removeEventListener('keydown', handleKeyDown);
  });
</script>
