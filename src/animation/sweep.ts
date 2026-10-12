import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { tintFilterId } from "../components/effects/tints";

gsap.registerPlugin(CustomEase);

/** cubic-bezier(0, 1, 0, 1): drastically fast start, slowing through the middle, dead slow finish. */
export const SWEEP_EASE = CustomEase.create("sweep", "M0,0 C0,1 0,1 1,1");


/**
 * Seconds between consecutive elements (number), or the whole spread eased like GSAP's
 * `stagger: { amount, ease }`: element i of n starts at amount × ease(i / (n − 1)).
 */
export type SweepStagger = number | { amount: number; ease?: string | gsap.EaseFunction };

/** Start time of the element at `rank` (0-based, along the "/" diagonal) out of `count`. */
export function staggerTime(rank: number, count: number, stagger: SweepStagger) {
  if (typeof stagger === "number") return rank * stagger;
  const ease = gsap.parseEase(stagger.ease ?? "none") ?? ((p: number) => p);
  return stagger.amount * ease(count > 1 ? rank / (count - 1) : 0);
}

export type SweepOptions = {
  /** Seconds each wipe takes. */
  duration?: number;
  /** How element start times are spread along the "/" diagonal; see SweepStagger. */
  stagger?: SweepStagger;
  ease?: string | gsap.EaseFunction;
  /** Start offsets in seconds, relative to each element's turn. */
  offsets?: { underIn: number; topIn: number; originalIn: number; topOut: number; underOut: number };
  /** Tint filter names for the two copies: `top` paints most of the band, `under` its leading/trailing edges. */
  colors?: { top: string; under: string };
  /** Colours used instead for elements marked `data-sweep-base="teal"`, so the band contrasts with them. */
  tealBaseColors?: { top: string; under: string };
  /**
   * Put each element's children (and its copies') on their own GPU layers while it sweeps, so only the clip mask
   * redraws per frame. Off for large elements on screen for good (the shared frame and nav): at 4K, tripling a
   * full-page frame's layers and merging them back as it lands made Chromium drop tiles for a frame (a blink).
   */
  promote?: boolean;
};

const DEFAULTS: Required<SweepOptions> = {
  duration: 2,
  stagger: { amount: 1, ease: "none" },
  ease: SWEEP_EASE,
  offsets: { underIn: 0, topIn: 1 / 24, originalIn: 3 / 24, topOut: 12 / 24, underOut: 13 / 24 },
  colors: { top: "teal", under: "ink" },
  tealBaseColors: { top: "ink", under: "teal" },
  promote: true,
};

/** Far enough outside any element that the band's corners never show. */
const FAR = 10000;

/**
 * Visible band between two "/" lines x + y = hide and x + y = reveal (px, element box space).
 * hide ≤ reveal; empty when equal. Always 4 points so it interpolates cleanly.
 */
export const bandClip = (hide: number, reveal: number) =>
  `polygon(${hide + FAR}px ${-FAR}px, ${reveal + FAR}px ${-FAR}px, ${-FAR}px ${reveal + FAR}px, ${-FAR}px ${hide + FAR}px)`;

type Clipped = { el: HTMLElement | SVGElement; hide: number; reveal: number };

/** Not started yet: hidden outright, so the GPU skips it (an empty clip would still cost an offscreen pass). */
const park = (c: Clipped) => {
  c.el.style.clipPath = "";
  c.el.style.visibility = "hidden";
};

const wake = (c: Clipped) => {
  c.el.style.visibility = "";
  apply(c);
};

const apply = (c: Clipped) => {
  c.el.style.clipPath = bandClip(c.hide, c.reveal);
};

function sizeOf(el: HTMLElement | SVGElement) {
  if (el instanceof HTMLElement) return { w: el.offsetWidth, h: el.offsetHeight };
  const r = el.getBoundingClientRect();
  return { w: r.width, h: r.height };
}

const childrenOf = (el: Element) => Array.from(el.children) as Array<HTMLElement | SVGElement>;

/**
 * Clone `el` as a flat silhouette in `tint`, to be placed right after it (so it stacks on top).
 * The tint filter goes on the clone's children, not the clone itself, so the clone's clip-path can change
 * every frame without re-running the filter.
 */
function tintedClone(el: HTMLElement | SVGElement, tint: string) {
  const copy = el.cloneNode(true) as HTMLElement | SVGElement;
  for (const node of [copy, ...copy.querySelectorAll("*")]) {
    node.removeAttribute("id");
    node.removeAttribute("data-anim");
    node.removeAttribute("data-anim-item");
    node.removeAttribute("role");
    node.removeAttribute("aria-label");
  }
  copy.setAttribute("aria-hidden", "true");
  copy.style.pointerEvents = "none";
  const tintFilter = `url(#${tintFilterId(tint)})`;
  const targets = copy.children.length ? childrenOf(copy) : [copy];
  for (const t of targets) {
    const own = t.style.filter && t.style.filter !== "none" ? `${t.style.filter} ` : "";
    t.style.filter = `${own}${tintFilter}`;
  }
  return copy;
}

/**
 * Give each child its own GPU layer. The clip-path sits on the parent, so animating it only redraws a mask;
 * the children (and every filter inside them) are rasterized once and reused.
 */
function promoteChildren(el: HTMLElement | SVGElement) {
  const kids = childrenOf(el);
  kids.forEach((k) => (k.style.willChange = "transform"));
  return () => kids.forEach((k) => (k.style.willChange = ""));
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * "Print sweep" entrance: each element gets two flat colour copies stacked on top of it
 * (top, under, original). Every layer is clipped to a diagonal band whose edges travel top-left → bottom-right:
 * the under copy reveals first, the top copy right after, then the original; the top and under copies then
 * wipe away again, leaving a "/ /" stripe that sweeps across the element.
 *
 * Two phases, so the expensive work happens behind a loading screen:
 *   1. `sweepIn()` builds the copies and leaves everything fully visible on its own GPU layers (see `promote`).
 *   2. `await ready()` lets the browser rasterize all of it once, then applies the hidden start state.
 *   Then play `timeline` (it is created paused). Only clip masks change per frame.
 *
 * Elements are staggered along the same diagonal. Each element's copies are removed and its clip cleared as
 * soon as its own sweep ends. `dispose()` does the same immediately (call it if the intro is aborted).
 */
export function sweepIn(elements: Array<HTMLElement | SVGElement>, options: SweepOptions = {}) {
  const o = { ...DEFAULTS, ...options };
  const tl = gsap.timeline({ paused: true });
  const cleanup: Array<() => void> = [];
  const layers: Clipped[] = [];

  const ordered = elements
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .sort((a, b) => a.r.left + a.r.top - (b.r.left + b.r.top));

  ordered.forEach(({ el }, i) => {
    const { w, h } = sizeOf(el);
    const pad = 40;
    const start = -pad;
    const end = w + h + pad;
    const colors = el.getAttribute("data-sweep-base") === "teal" ? o.tealBaseColors : o.colors;

    const under = tintedClone(el, colors.under);
    const top = tintedClone(el, colors.top);
    el.after(under, top);
    const demote = o.promote ? [promoteChildren(el), promoteChildren(under), promoteChildren(top)] : [];

    const original = { el, hide: start, reveal: start };
    const underLayer = { el: under, hide: start, reveal: start };
    const topLayer = { el: top, hide: start, reveal: start };
    layers.push(original, underLayer, topLayer);

    const t = staggerTime(i, ordered.length, o.stagger);
    const tween = (layer: Clipped, edge: "hide" | "reveal", at: number) =>
      tl.to(
        layer,
        {
          [edge]: end,
          duration: o.duration,
          ease: o.ease,
          onStart: edge === "reveal" ? () => wake(layer) : undefined,
          onUpdate: () => apply(layer),
        },
        t + at,
      );

    tween(underLayer, "reveal", o.offsets.underIn);
    tween(topLayer, "reveal", o.offsets.topIn);
    tween(original, "reveal", o.offsets.originalIn);
    tween(topLayer, "hide", o.offsets.topOut);
    tween(underLayer, "hide", o.offsets.underOut);

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      under.remove();
      top.remove();
      el.style.clipPath = "";
      el.style.visibility = "";
      demote.forEach((fn) => fn());
    };
    cleanup.push(finish);
    tl.add(finish, t + o.offsets.underOut + o.duration);
  });

  /** Waits until the unclipped layers have been rasterized, then hides everything for the start of the sweep. */
  const ready = async (settleMs = 80) => {
    for (let i = 0; i < 3; i++) await nextFrame();
    await new Promise((r) => setTimeout(r, settleMs));
    layers.forEach(park);
    await nextFrame();
  };

  /** Hides everything for the start of the sweep right away (no rasterize wait), e.g. for an element just mounted. */
  const park_ = () => layers.forEach(park);

  return { timeline: tl, ready, park: park_, dispose: () => cleanup.forEach((fn) => fn()) };
}
