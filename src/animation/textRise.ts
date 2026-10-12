import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { SWEEP_EASE } from "./sweep";

gsap.registerPlugin(SplitText);

export type TextRiseOptions = {
  duration?: number;
  ease?: string | gsap.EaseFunction;
  /** Seconds between characters within one text block. */
  charStagger?: number;
  /** Max random tilt in degrees (2D rotation only). */
  maxRotation?: number;
  /** Max random extra drop in px, on top of starting one full line below. */
  maxDrop?: number;
  /** z-index to lift text units to while they animate (above the intro canvas). */
  liftZ?: number;
  /**
   * The element the intro canvas sits in (the page root). Ancestors between a unit and it that set their own
   * z-index (stacking contexts, e.g. a positioned list) are flattened while lifted, so `liftZ` really puts the text
   * above the canvas; restored by `lower()`.
   */
  liftWithin?: Element | null;
  /**
   * Title letters (`[data-anim-item="glyph"]`): tilt range in degrees. Each letter comes in from the bottom-left
   * or bottom-right along its own tilt angle, so its "up" points the way it travels.
   */
  glyphAngle?: [number, number];
  /**
   * Title letters: radiate the stagger out from this character (e.g. "O"): it starts first and every other
   * letter waits in proportion to its distance from it. The total spread stays (letters − 1) × charStagger.
   */
  glyphFrom?: string;
  /** in: characters rise into place. out: characters move up out of their masks (the exit). */
  direction?: "in" | "out";
};

const DEFAULTS: Required<TextRiseOptions> = {
  duration: 1,
  ease: SWEEP_EASE,
  charStagger: 0.04,
  maxRotation: 15,
  maxDrop: 50,
  liftZ: 11,
  liftWithin: null,
  glyphAngle: [30, 45],
  glyphFrom: "",
  direction: "in",
};

/** Per-letter delays radiating out from the first glyph showing `char` (2D distance between letter centres). */
function radialDelays(glyphs: HTMLElement[], char: string, spread: number) {
  const centres = glyphs.map((g) => {
    const r = g.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  const origin = glyphs.findIndex((g) => g.dataset.char === char);
  if (origin < 0) return null;
  const dist = centres.map((c) => Math.hypot(c.x - centres[origin].x, c.y - centres[origin].y));
  const max = Math.max(...dist) || 1;
  return dist.map((d) => (d / max) * spread);
}

/** The outermost elements under (or equal to) `root` with text of their own, in document order. */
function textHolders(root: HTMLElement): HTMLElement[] {
  const ownText = (el: Element) => Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
  if (ownText(root)) return [root];
  return Array.from(root.children).flatMap((c) => (c instanceof HTMLElement ? textHolders(c) : []));
}

/** Offset of a character (in px, plus `yPercent` of its own height) and its tilt; scaled to 0 as it lands. */
type Motion = { x: number; y: number; yPercent: number; rotation: number };

/** Start offset + rotation for a letter arriving along a tilted diagonal, fully outside its own mask. */
function diagonalEntry(box: HTMLElement, [min, max]: [number, number]) {
  const angle = gsap.utils.random(min, max);
  const side = Math.random() < 0.5 ? -1 : 1; // -1 = from bottom-left, 1 = from bottom-right
  const rad = (angle * Math.PI) / 180;
  const distance = Math.hypot(box.offsetWidth, box.offsetHeight) * 1.1;
  return {
    x: side * Math.sin(rad) * distance,
    y: Math.cos(rad) * distance,
    rotation: -side * angle, // from the left it leans right (clockwise), from the right it leans left
  };
}

/**
 * Awwwards-style text entrance: every character sits in its own `overflow: hidden` mask and rises from below
 * with a random 0–`maxRotation`° tilt and a random 0–`maxDrop` px extra offset, both easing to 0.
 * Regular text is split with GSAP SplitText; the SVG title's letters (`[data-anim-item="glyph"]`) use their
 * own box as the mask and arrive along a 30–45° diagonal from the bottom-left / bottom-right (`glyphAngle`).
 *
 * While animating, each unit is lifted above the intro canvas and its decay filters are paused (a moving child
 * under a filtered parent would re-run the filter every frame). Filters and the split are restored when its text
 * lands; the lift stays until `lower()`, which the caller runs in the same frame the intro canvas is removed
 * (lowering earlier would drop the text behind the still-visible canvas).
 */
export function textRise(units: HTMLElement[], startTimes: number[], options: TextRiseOptions = {}) {
  const o = { ...DEFAULTS, ...options };
  const tl = gsap.timeline({ paused: true });
  const restorers: Array<() => void> = [];
  const lowerers: Array<() => void> = [];
  /** Tilted wrappers already lifted (several units can share one). */
  const lifted = new Set<HTMLElement>();

  // Three passes so the browser lays the page out once, not once per unit or letter: (1) every DOM change (lift,
  // pause filters, split), (2) every measurement, (3) the animation, which only ever writes.
  type Prep = { start: number; undo: Array<() => void>; chars: Element[][]; glyphs: HTMLElement[] };
  const preps: Prep[] = units.map((unit, k) => {
    const undo: Array<() => void> = [];
    const z = unit.style.zIndex;
    unit.style.zIndex = String(o.liftZ);
    lowerers.push(() => void (unit.style.zIndex = z));
    if (o.liftWithin?.contains(unit)) {
      for (let a = unit.parentElement; a && a !== o.liftWithin; a = a.parentElement) {
        if (lifted.has(a)) continue;
        const own = a.style.zIndex;
        if (own && own !== "auto") {
          a.style.zIndex = "auto";
          lowerers.push(() => void (a.style.zIndex = own));
        } else if (a.style.rotate || a.style.transform) {
          // a tilted wrapper (e.g. a hand-written quote) is a stacking context of its own, so its text can't rise
          // out of it: lift the wrapper instead (it is a positioned or flex box, where z-index applies)
          a.style.zIndex = String(o.liftZ);
          lifted.add(a);
          lowerers.push(() => void (a.style.zIndex = own));
        }
      }
    }
    for (const el of [unit, ...unit.querySelectorAll<HTMLElement>("*")]) {
      if (!el.style.filter) continue;
      const filter = el.style.filter;
      el.style.filter = "none";
      undo.push(() => void (el.style.filter = filter));
    }
    const glyphs = Array.from(unit.querySelectorAll<HTMLElement>('[data-anim-item="glyph"]'));
    glyphs.forEach((g) => {
      const overflow = g.style.overflow;
      g.style.overflow = "hidden";
      undo.push(() => void (g.style.overflow = overflow));
    });
    return { start: startTimes[k] ?? 0, undo, chars: [], glyphs };
  });
  units.forEach((unit, k) => {
    const p = preps[k];
    if (p.glyphs.length) {
      p.chars = p.glyphs.map((g) => Array.from(g.children));
      return;
    }
    // split (and later revert) only the elements that hold the text, never the unit itself: revert rewrites
    // innerHTML, which would swap out elements React still renders into (links, buttons, their handlers)
    const splits = textHolders(unit).map((el) => SplitText.create(el, { type: "chars", mask: "chars" }));
    p.undo.push(() => splits.forEach((split) => split.revert()));
    p.chars = splits.flatMap((split) => split.chars.map((c) => [c]));
  });
  // (2) measure
  const plans = preps.map((p) => {
    // where each character starts from (in) or goes to (out), and when it moves
    let delay = (j: number) => j * o.charStagger;
    let motion = (): Motion => ({ x: 0, y: gsap.utils.random(0, o.maxDrop), yPercent: 100, rotation: gsap.utils.random(0, o.maxRotation) });
    let origin = "0% 100%";
    if (o.direction === "out") motion = () => ({ x: 0, y: 0, yPercent: -110, rotation: -gsap.utils.random(0, o.maxRotation) });
    else if (p.glyphs.length) {
      const entries = p.glyphs.map((g) => ({ ...diagonalEntry(g, o.glyphAngle), yPercent: 0 }));
      let k = 0;
      motion = () => entries[k++];
      origin = "50% 50%";
      const radial = o.glyphFrom ? radialDelays(p.glyphs, o.glyphFrom, (p.glyphs.length - 1) * o.charStagger) : null;
      if (radial) delay = (j) => radial[j];
    }
    return { ...p, delays: p.chars.map((_, j) => delay(j)), motions: p.chars.map(() => motion()), origin };
  });

  // (3) animate: one driver per unit writes its characters' transforms directly (writes only, nothing read
  // back), instead of a GSAP tween per character: GSAP parses each element's computed transform the first time it
  // tweens it, and with hundreds of staggered letters that forced a full layout per letter (≈1 000 per intro).
  const ease = typeof o.ease === "function" ? o.ease : (gsap.parseEase(o.ease) ?? ((t: number) => t));
  const leaving = o.direction === "out";
  for (const p of plans) {
    const targets = p.chars.map((group) => group.filter((el): el is HTMLElement | SVGElement => "style" in el));
    targets.flat().forEach((el) => {
      el.style.transformOrigin = p.origin;
      p.undo.push(() => {
        el.style.transform = "";
        el.style.transformOrigin = "";
      });
    });
    const last = Math.max(0, ...p.delays);
    const drive = { t: 0 };
    const shown: number[] = p.chars.map(() => -1);
    // f = how far along its offset a character is: 1 = fully displaced (outside its mask), 0 = in place
    const render = () => {
      targets.forEach((group, j) => {
        const progress = Math.min(1, Math.max(0, (drive.t - p.delays[j]) / o.duration));
        if (progress === shown[j]) return;
        shown[j] = progress;
        const f = leaving ? ease(progress) : 1 - ease(progress);
        const m = p.motions[j];
        const transform = f ? `translate(0, ${m.yPercent * f}%) translate(${m.x * f}px, ${m.y * f}px) rotate(${m.rotation * f}deg)` : "";
        for (const el of group) el.style.transform = transform;
      });
    };
    if (!leaving) render(); // entering: start hidden right away (like a from() tween)
    tl.to(drive, { t: last + o.duration, duration: last + o.duration, ease: "none", onUpdate: render }, p.start);

    const restore = () => p.undo.splice(0).reverse().forEach((fn) => fn());
    restorers.push(restore);
    if (leaving) continue; // leaving: stay split and hidden until the page unmounts
    tl.add(restore, p.start + last + o.duration);
  }

  const lower = () => lowerers.splice(0).forEach((fn) => fn());
  return {
    timeline: tl,
    lower,
    dispose: () => {
      restorers.forEach((fn) => fn());
      lower();
    },
  };
}
