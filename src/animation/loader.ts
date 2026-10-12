import gsap from "gsap";
import { flyStar as flyStarTo, type StarFlightOptions } from "./starFlight";

/**
 * Drives a <LoadingScreen>: a smoothed 000–100 counter (never ahead of real progress, rate-limited by
 * `minDuration` so it reads well even from cache), progress bar and step label, the star's flight to the page,
 * and a short fade out.
 */
export function createLoaderControl(el: HTMLElement, { minDuration = 1.4 } = {}) {
  const q = <T extends Element>(sel: string) => el.querySelector<T>(sel);
  const count = q<HTMLElement>("[data-loader-count]");
  const bar = q<HTMLElement>("[data-loader-bar]");
  const step = q<HTMLElement>("[data-loader-step]");

  const shown = { value: 0 };
  let target = 0;
  const paint = () => {
    if (count) count.textContent = String(Math.round(shown.value * 100)).padStart(3, "0");
    if (bar) bar.style.transform = `scaleX(${shown.value})`;
  };

  // the display chases the real value every frame (frequent updates never restart an animation)
  let onFull: (() => void) | null = null;
  const tick = (_time: number, deltaMs: number) => {
    // ease toward the real value, but never faster than 100 % per `minDuration` so the count stays readable
    const k = 1 - Math.exp(-deltaMs / 180);
    shown.value += Math.min((target - shown.value) * k, deltaMs / 1000 / minDuration);
    if (target - shown.value < 0.002) shown.value = target;
    paint();
    if (shown.value >= 1 && onFull) {
      gsap.ticker.remove(tick);
      onFull();
      onFull = null;
    }
  };
  gsap.ticker.add(tick);

  /** Report real progress (0..1, never goes backwards). */
  const setProgress = (fraction: number, label?: string) => {
    target = Math.max(target, Math.min(1, fraction));
    if (label && step) step.textContent = label;
  };

  /** Resolves once the counter visibly reaches 100, plus a short hold. */
  const finished = (hold = 0.35) =>
    new Promise<void>((resolve) => {
      if (step) step.textContent = "ready";
      target = 1;
      onFull = () => void gsap.delayedCall(hold, resolve);
    });

  /** Fades the loader's content (background, counter); the star stays until `hide()`. */
  const exit = (duration = 0.35) => {
    const content = q<HTMLElement>("[data-loader-content]");
    return gsap.to(content ?? el, { autoAlpha: 0, duration, ease: "power1.out" });
  };

  /** Flies the loader star onto the page's `anchor` (see starFlight.flyStar for the options). */
  const flyStar = (anchor: Element, options?: StarFlightOptions) => {
    const star = q<HTMLElement>("[data-loader-star]");
    return star ? flyStarTo(star, anchor, star.firstElementChild, options) : gsap.timeline();
  };

  /** Removes the loader entirely (call when the page's own star is showing). */
  const hide = () => {
    gsap.ticker.remove(tick);
    el.style.display = "none";
  };

  return { setProgress, finished, exit, flyStar, hide };
}

export type LoaderControl = ReturnType<typeof createLoaderControl>;
