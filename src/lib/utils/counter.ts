export function animateCounter(
  el: HTMLElement,
  target: number,
  duration = 1500,
  onComplete?: () => void
) {
  const start = performance.now();
  const run = (now: number) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(eased * target).toLocaleString();
    if (p < 1) {
      requestAnimationFrame(run);
    } else {
      onComplete?.();
    }
  };
  requestAnimationFrame(run);
}
