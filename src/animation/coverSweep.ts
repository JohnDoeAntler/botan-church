import gsap from "gsap";
import { bandClip, SWEEP_EASE } from "./sweep";

/** When the teal copy reads as covering the whole picture (SWEEP_EASE does nearly all its travel early), s. */
const COVERED_AT = 0.4;
const DURATION = 1;
/** Ink goes first, teal one frame later; on the way out teal leaves first (the intro's offsets). */
const STEP = 1 / 24;

type Band = { el: HTMLElement; hide: number; reveal: number };

/**
 * The print sweep over a picture, as a call to action: an ink layer, then a teal layer on top of it, sweep across
 * `target` (top-left → bottom-right "/" band) until teal covers it all; `onCovered` runs then (e.g. open a link);
 * then teal and ink sweep away again, uncovering the picture. `target` is the picture's box (positioned); the
 * layers are added inside it, so they follow its transforms (e.g. a tilted cover). If the page is hidden after
 * `onCovered` (the user went to the new tab), the rest finishes at once, so the cover is clean when they're back.
 * Returns a function that stops it and removes the layers.
 */
export function coverSweep(target: HTMLElement, { onCovered }: { onCovered: () => void }) {
  const w = target.offsetWidth;
  const h = target.offsetHeight;
  const start = -40;
  const end = w + h + 40;
  const layer = (color: string): Band => {
    const el = document.createElement("div");
    Object.assign(el.style, { position: "absolute", inset: "0", background: color, zIndex: "20", pointerEvents: "none", clipPath: bandClip(start, start) });
    target.appendChild(el);
    return { el, hide: start, reveal: start };
  };
  const under = layer("var(--c-ink)");
  const top = layer("var(--c-teal)");
  const draw = (b: Band) => void (b.el.style.clipPath = bandClip(b.hide, b.reveal));

  const cleanup = () => {
    tl.kill();
    under.el.remove();
    top.el.remove();
    document.removeEventListener("visibilitychange", onHidden);
  };
  const onHidden = () => document.hidden && tl.progress(1);

  const tl = gsap.timeline({ onComplete: cleanup });
  const band = (b: Band, edge: "hide" | "reveal", at: number) => tl.to(b, { [edge]: end, duration: DURATION, ease: SWEEP_EASE, onUpdate: () => draw(b) }, at);
  band(under, "reveal", 0);
  band(top, "reveal", STEP);
  tl.call(
    () => {
      document.addEventListener("visibilitychange", onHidden);
      onCovered();
    },
    undefined,
    COVERED_AT,
  );
  band(top, "hide", COVERED_AT);
  band(under, "hide", COVERED_AT + STEP);
  return cleanup;
}

/**
 * A link's plain click as a call to action: `target` is swept over in teal, then `href` opens in a new tab.
 * Modified clicks (new tab, new window…) are left to the browser; a click while a sweep plays is ignored.
 */
export function sweepToLink(e: Pick<MouseEvent, "button" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey" | "preventDefault">, target: HTMLElement, href: string) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  if (target.dataset.sweeping) return;
  target.dataset.sweeping = "1";
  coverSweep(target, {
    onCovered: () => {
      delete target.dataset.sweeping;
      openInNewTab(href);
    },
  });
}

/**
 * Opens `href` in a new tab and sends the user there (the opener is cut off). Must run soon after a click (browsers
 * allow a popup within a few seconds of one); if it is blocked anyway, the link opens in this tab instead.
 */
export function openInNewTab(href: string) {
  const tab = window.open(href, "_blank");
  if (!tab) {
    window.location.assign(href);
    return;
  }
  tab.opener = null;
  tab.focus();
}
