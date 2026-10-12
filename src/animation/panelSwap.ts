import gsap from "gsap";
import { bandClip, SWEEP_EASE } from "./sweep";

/**
 * A picture leaving / arriving inside its frame, live in the DOM, with the same presets the intro canvas uses for
 * images (bakedIntro): leaving = hard flicker cuts while it shrinks, then the print sweep wipes it out (ink copy,
 * teal copy, the picture hides under them, then they go); arriving = hard flicker cuts while it zooms from
 * `zoom` down to 1. `area` is the picture's frame (overflow hidden), `img` the picture in it.
 */
const DURATION = 1;
const SHRINK = 0.82;
const ZOOM = 1.5;
const SWEEP_AT = 12 / 24;
const FLICKER_OUT = [0, 1 / 24, 2 / 24, 3 / 24];
const FLICKER_IN = [0, 1 / 24, 2 / 24, 3 / 24, 4 / 24];
const OFFSETS = { underIn: 0, topIn: 1 / 24, originalIn: 3 / 24, topOut: 6 / 24, underOut: 7 / 24 };

type Band = { el: HTMLElement; hide: number; reveal: number };

/**
 * `onCleared` fires once the picture is gone under the ink + teal copies, just as they start to wipe away: swap the
 * next picture in then (under them), and their leaving uncovers it, with no empty frame in between. The copies
 * keep going until the timeline ends; don't kill it on the swap.
 */
export function panelOut(area: HTMLElement, img: HTMLElement, { delay = 0, onCleared }: { delay?: number; onCleared?: () => void } = {}) {
  const { width: w, height: h } = area.getBoundingClientRect();
  const start = -40;
  const end = w + h + 40;
  const copy = (color: string) => {
    const el = document.createElement("div");
    Object.assign(el.style, { position: "absolute", inset: "0", background: color, visibility: "hidden", pointerEvents: "none", zIndex: "1" });
    area.appendChild(el);
    return el;
  };
  const under: Band = { el: copy("var(--c-ink)"), hide: start, reveal: start };
  const top: Band = { el: copy("var(--c-teal)"), hide: start, reveal: start };
  const original: Band = { el: img, hide: start, reveal: end };
  let handedOver = false; // after onCleared the <img> holds the next picture: stop touching it
  const draw = (b: Band) => {
    if (b === original && handedOver) return;
    b.el.style.clipPath = bandClip(b.hide, b.reveal);
  };
  const band = (b: Band, edge: "hide" | "reveal", at: number) =>
    tl.to(b, { [edge]: end, duration: DURATION, ease: SWEEP_EASE, onStart: () => void (b.el.style.visibility = ""), onUpdate: () => draw(b) }, delay + SWEEP_AT + at);

  const tl = gsap.timeline({
    onComplete: () => {
      under.el.remove();
      top.el.remove();
    },
  });
  FLICKER_OUT.forEach((at, k) => tl.set(img, { visibility: k % 2 === 1 ? "visible" : "hidden" }, delay + at));
  tl.to(img, { scale: SHRINK, duration: DURATION, ease: SWEEP_EASE }, delay);
  band(under, "reveal", OFFSETS.underIn);
  band(top, "reveal", OFFSETS.topIn);
  band(original, "hide", OFFSETS.originalIn);
  band(top, "hide", OFFSETS.topOut);
  band(under, "hide", OFFSETS.underOut);
  if (onCleared)
    tl.call(
      () => {
        handedOver = true;
        gsap.killTweensOf(img); // the leaving shrink / flicker belong to the old picture
        onCleared();
      },
      undefined,
      delay + SWEEP_AT + OFFSETS.topOut,
    );
  const cleanup = () => {
    tl.kill();
    under.el.remove();
    top.el.remove();
  };
  return { timeline: tl, cleanup };
}

/**
 * The picture arriving: zooming from `zoom` down to 1 inside its frame. `flicker` adds the intro's hard on / off
 * cuts first; a swap under the sweep's copies leaves it out (the copies are the cut, and an off frame would read
 * as an empty panel).
 */
export function panelIn(img: HTMLElement, { flicker = false } = {}) {
  gsap.set(img, { clipPath: "", visibility: flicker ? "hidden" : "visible", scale: ZOOM });
  const tl = gsap.timeline({ onComplete: () => void gsap.set(img, { clearProps: "transform,visibility,clipPath" }) });
  if (flicker) FLICKER_IN.forEach((at, k) => tl.set(img, { visibility: k % 2 === 0 ? "visible" : "hidden" }, at));
  tl.to(img, { scale: 1, duration: DURATION, ease: SWEEP_EASE }, 0);
  return tl;
}
