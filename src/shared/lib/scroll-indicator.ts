const HIDE_AFTER_MS = 700;

// Marks whatever is scrolling with `data-scrolling` so CSS can show its
// scrollbar only while scrolling (see app/styles/index.css).
export function initScrollIndicator() {
  const timers = new WeakMap<Element, number>();

  document.addEventListener(
    'scroll',
    (event) => {
      const target =
        event.target instanceof Element
          ? event.target
          : document.documentElement;

      // Set once per burst: rewriting it on every scroll event restyles and lags.
      if (!target.hasAttribute('data-scrolling')) {
        target.setAttribute('data-scrolling', '');
      }
      window.clearTimeout(timers.get(target));
      timers.set(
        target,
        window.setTimeout(
          () => target.removeAttribute('data-scrolling'),
          HIDE_AFTER_MS,
        ),
      );
    },
    { capture: true, passive: true },
  );
}
