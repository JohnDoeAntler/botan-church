import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { BRAND_STAR } from "../components/shapes/brandStarSpec";
import { sparklePath } from "../components/shapes/sparklePath";
import { SWEEP_EASE } from "./sweep";

gsap.registerPlugin(CustomEase, MotionPathPlugin);

/** cubic-bezier(0.05, 0.95, 0.95, 0.05): dead fast out of the start, near standstill mid-way, dead fast into the end. */
export const STAR_EASE = CustomEase.create("starFlight", "M0,0 C0.05,0.95 0.95,0.05 1,1");

export type Point = { x: number; y: number };

/** A smooth curve passing *through* every point (GSAP MotionPath "thru"), `curviness` 0 = straight lines. */
export type ThroughPath = { thru: Point[]; curviness?: number };

/**
 * Builds the flight path in viewport px. Either cubic Bézier points ([from, c1, c2, to], or 3n + 1 points to
 * chain n segments) or a ThroughPath of waypoints the star passes through.
 */
export type StarPath = (from: Point, to: Point) => Point[] | ThroughPath;

/**
 * S-curve: control points at ¼ and ¾ of the way, pushed to opposite sides of the straight line by
 * `bend` × distance. Positive bend swings right of the travel direction first, negative swings left first.
 */
export const sPath =
  (bend = 0.5): StarPath =>
  (a, b) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * bend * len; // perpendicular, scaled
    const ny = (dx / len) * bend * len;
    return [a, { x: a.x + dx * 0.25 + nx, y: a.y + dy * 0.25 + ny }, { x: a.x + dx * 0.75 - nx, y: a.y + dy * 0.75 - ny }, b];
  };

export type SwingOptions = {
  /** Turning point as viewport fractions (0..1). Default: the left section, a little below centre. */
  at?: Point;
  /** How hard the curve pulls, as a fraction of the viewport size; bigger = rounder, more violent arcs. */
  pull?: number;
};

/**
 * Big swing: out from the start in a downward arc to a turning point (default: left section of the page),
 * curling upward through it, then across and into the target from the upper-left (the page's sweep
 * direction). Two cubic segments joined with a continuous tangent, so there is no corner at the turn.
 */
export const swingPath =
  ({ at = { x: 0.14, y: 0.58 }, pull = 0.3 }: SwingOptions = {}): StarPath =>
  (a, b) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const p = { x: vw * at.x, y: vh * at.y }; // turning point
    const lift = vh * pull; // vertical tangent length at the turn
    return [
      a,
      { x: a.x - vw * pull * 0.3, y: a.y + vh * pull }, // leave heading down-left
      { x: p.x, y: p.y + lift }, // arrive at the turn moving straight up…
      p,
      { x: p.x, y: p.y - lift }, // …and keep going up (same tangent)
      { x: b.x - vw * pull, y: b.y - vh * pull * 0.6 }, // come in from the upper-left
      b,
    ];
  };

export type LoopOptions = {
  /** Centre of the loop-the-loop, as viewport fractions. Default: left section of the page. */
  loop?: Point;
  /** Loop radius as a fraction of the viewport height. */
  loopRadius?: number;
  /** Radius of the spiral into the target (fraction of viewport height) and how many turns it makes. */
  spiralRadius?: number;
  spiralTurns?: number;
  /** Size of the little pull-back before launch (fraction of viewport size). 0 = none. */
  windup?: number;
};

/**
 * Choreographed flight: a small wind-up opposite the travel, a dive into a loop-the-loop on the left of the
 * page, an arc over the top, then a tightening clockwise spiral into the target.
 */
export const loopPath =
  ({ loop = { x: 0.16, y: 0.46 }, loopRadius = 0.14, spiralRadius = 0.17, spiralTurns = 1, windup = 0.05 }: LoopOptions = {}): StarPath =>
  (a, b) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const c = { x: vw * loop.x, y: vh * loop.y };
    const R = vh * loopRadius;
    const at = (o: Point, r: number, deg: number) => ({ x: o.x + r * Math.cos((deg * Math.PI) / 180), y: o.y + r * Math.sin((deg * Math.PI) / 180) });

    const thru: Point[] = [
      a,
      { x: a.x + vw * windup * 0.6, y: a.y + vh * windup }, // wind-up: pull back down-right
      { x: vw * 0.4, y: vh * 0.8 }, // dive down-left
      at(c, R, 80), // enter the loop at the bottom…
      at(c, R, 180), // …round the left…
      at(c, R, 270), // …over the top…
      at(c, R, 0), // …down the right…
      at(c, R * 0.9, 60), // …and cross under
      { x: c.x + R * 1.6, y: c.y - R * 1.5 }, // exit up-right
      { x: (c.x + b.x) / 2, y: Math.min(c.y, b.y) - vh * 0.22 }, // arc over the top
    ];
    // tightening clockwise spiral into the target, entering from its left
    const steps = Math.max(2, Math.round(spiralTurns * 4));
    const r0 = vh * spiralRadius;
    for (let k = 0; k <= steps; k++) thru.push(at(b, r0 * (1 - k / (steps + 1)) ** 1.4, 180 + (k * 360 * spiralTurns) / steps));
    thru.push(b);
    return { thru, curviness: 1.25 };
  };

/** Straight line (handy for pages that want a plain snap). */
export const straightPath: StarPath = (a, b) => [a, a, b, b];

/** Hard on/off cuts at these times (s), alternating show / hide and ending shown. */
export type Flash = number[];

/** The usual flicker: show 0/24, hide 1/24, show 2/24, hide 3/24, show 4/24. */
export const FLASH: Flash = [0, 1 / 24, 2 / 24, 3 / 24, 4 / 24];

/** Adds hard visibility cuts for `el` to `tl`, starting at `at`. */
export function flash(tl: gsap.core.Timeline, el: Element, cuts: Flash, at = 0) {
  cuts.forEach((t, k) => tl.set(el, { autoAlpha: k % 2 === 0 ? 1 : 0 }, at + t));
  return tl;
}

export type ShockwaveOptions = {
  /** Ring radius at impact and at the end, in design px (scaled like the page). */
  radius?: number;
  endRadius?: number;
  /** Stroke width at impact, design px; it thins to 0. */
  stroke?: number;
  color?: string;
  duration?: number;
  ease?: string | gsap.EaseFunction;
  flash?: Flash | false;
  zIndex?: number;
};

const SHOCKWAVE: Required<ShockwaveOptions> = {
  radius: 300,
  endRadius: 600,
  stroke: 25,
  color: "var(--c-teal)",
  duration: 1,
  ease: SWEEP_EASE,
  flash: FLASH,
  zIndex: 101,
};

/**
 * Impact ring at `centre` (viewport px): a stroked circle that grows from `radius` to `endRadius` while its
 * stroke thins from `stroke` to 0, with a hard flicker. `unit` converts design px to CSS px. Removes itself.
 */
export function shockwave(centre: Point, unit = 1, options: ShockwaveOptions = {}) {
  const o = { ...SHOCKWAVE, ...options };
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("aria-hidden", "true");
  Object.assign(svg.style, { position: "fixed", inset: "0", width: "100vw", height: "100vh", pointerEvents: "none", zIndex: String(o.zIndex), overflow: "visible" });
  const ring = document.createElementNS(ns, "circle");
  ring.setAttribute("cx", String(centre.x));
  ring.setAttribute("cy", String(centre.y));
  ring.setAttribute("fill", "none");
  ring.setAttribute("r", String(o.radius * unit));
  ring.setAttribute("stroke-width", String(o.stroke * unit));
  ring.style.stroke = o.color;
  svg.appendChild(ring);
  document.body.appendChild(svg);

  const tl = gsap.timeline({ onComplete: () => svg.remove() });
  tl.fromTo(
    ring,
    { attr: { r: o.radius * unit, "stroke-width": o.stroke * unit } },
    { attr: { r: o.endRadius * unit, "stroke-width": 0 }, duration: o.duration, ease: o.ease },
    0,
  );
  if (o.flash) flash(tl, svg, o.flash);
  return tl;
}

export type StarFlightOptions = {
  /** Seconds for the whole flight (path, scale). */
  duration?: number;
  /** Ease of the travel along the path. */
  ease?: string | gsap.EaseFunction;
  path?: StarPath;
  /** Rotational symmetry of the star in degrees; the frozen spin settles to the next multiple. 0 = keep angle. */
  symmetry?: number;
  /** Flicker as it takes off. */
  flash?: Flash | false;
  /** Full clockwise turns mid-flight: start `at`, lasting `duration` (s). */
  turn?: { at: number; duration: number; turns?: number; ease?: string | gsap.EaseFunction } | false;
  /** Pinch the star needle-thin mid-flight: normal at `at`, `waist` at `peak`, normal again at `end` (s). */
  pinch?: { at: number; peak: number; end: number; waist: number; ease?: string | gsap.EaseFunction } | false;
  /** Shockwave ring(s) fired together when the star lands. */
  impact?: ShockwaveOptions | ShockwaveOptions[] | false;
  /** Fading ghost copies following the star along the path, `gap` s apart. */
  trail?: { count: number; gap: number; opacity: number } | false;
  /** Extra shockwaves mid-flight, each fired at wherever the star is at time `at` (s). */
  bursts?: Array<{ at: number; rings: ShockwaveOptions | ShockwaveOptions[] }> | false;
};

/**
 * Defaults, authored for a 1 s flight: the mid-flight timings (turn, pinch, burst) scale with `duration`.
 * The take-off flicker, trail spacing and landing shockwaves stay in absolute seconds.
 */
const defaultsFor = (d: number): Required<StarFlightOptions> => ({
  duration: d,
  ease: STAR_EASE,
  path: sPath(),
  symmetry: 180,
  flash: FLASH,
  turn: { at: (9 / 24) * d, duration: (6 / 24) * d, turns: 1, ease: SWEEP_EASE },
  pinch: { at: (9 / 24) * d, peak: (24 / 24) * d, end: (24 / 24) * d, waist: 0.1, ease: SWEEP_EASE },
  // teal ring + a smaller ink ring inside it
  impact: [{}, { radius: 150, endRadius: 300, stroke: 14, color: "var(--c-ink)" }],
  trail: { count: 5, gap: 0.03, opacity: 0.45 },
  // a tiny ring where the star is when the turn / pinch kicks in
  bursts: [{ at: (9 / 24) * d, rings: { radius: 40, endRadius: 100, stroke: 8 } }],
});

const centre = (r: DOMRect): Point => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

/**
 * Flies `star` (a positioned element, usually the loader's) onto `anchor` (the page's `[data-star-anchor]`)
 * along `path`, scaling to the anchor's size. On the way: a take-off flicker, a ghost trail, a small burst ring,
 * a full clockwise turn, a pinch to a needle-thin star and back, then a shockwave on landing (each optional).
 *
 * `spinner` is the star's rotating child (its CSS spin is frozen and settled upright before the turn);
 * its `<path>` is what gets pinched. Returns a timeline; nest or control it like any other.
 */
export function flyStar(star: HTMLElement, anchor: Element, spinner: Element | null, options: StarFlightOptions = {}) {
  const o = { ...defaultsFor(options.duration ?? 1), ...options };
  const tl = gsap.timeline();
  const fromRect = star.getBoundingClientRect();
  const toRect = anchor.getBoundingClientRect();
  const from = centre(fromRect);
  const to = centre(toRect);
  // CSS px per design px: the page's Stage scale (falls back to the anchor star's size)
  const unit = Number.parseFloat(getComputedStyle(anchor).getPropertyValue("--u")) || toRect.width / BRAND_STAR.width;

  // MotionPath moves the element by x/y offsets, so express the path relative to the start
  const raw = o.path(from, to);
  const rel = (pts: Point[]) => pts.map((p) => ({ x: p.x - from.x, y: p.y - from.y }));
  const motionPath = Array.isArray(raw)
    ? { path: rel(raw), type: "cubic" as const }
    : { path: rel(raw.thru), curviness: raw.curviness ?? 1 };

  // ghosts: plain copies parked on the star's start, chasing it along the same path a little later. Made only when
  // the flight actually starts (a flight that is reverted / never played, e.g. a StrictMode remount, leaves none
  // behind) and removed when it ends or is killed
  if (o.trail) {
    const { count, gap, opacity } = o.trail;
    const ghosts: HTMLElement[] = [];
    const clear = () => ghosts.splice(0).forEach((g) => g.remove());
    tl.eventCallback("onComplete", clear);
    tl.eventCallback("onInterrupt", clear);
    tl.add(() => {
      if (ghosts.length) return;
      for (let k = 1; k <= count; k++) {
        const ghost = star.cloneNode(true) as HTMLElement;
        ghost.removeAttribute("data-loader-star");
        ghost.setAttribute("aria-hidden", "true");
        Object.assign(ghost.style, {
          position: "fixed",
          left: `${fromRect.left}px`,
          top: `${fromRect.top}px`,
          width: `${fromRect.width}px`,
          height: `${fromRect.height}px`,
          margin: "0",
          pointerEvents: "none",
          opacity: String(opacity * (1 - (k - 1) / count)),
          transform: "none",
          visibility: "visible",
        });
        star.before(ghost);
        ghosts.push(ghost);
        tl.to(
          ghost,
          {
            motionPath,
            scaleX: toRect.width / (star.offsetWidth || 1),
            scaleY: toRect.height / (star.offsetHeight || 1),
            duration: o.duration,
            ease: o.ease,
            onComplete: () => ghost.remove(),
          },
          tl.time() + k * gap,
        );
        tl.to(ghost, { opacity: 0, duration: 0.15, ease: "power1.in" }, tl.time() + o.duration - 0.15 + k * gap);
      }
    }, 0);
  }

  tl.to(
    star,
    {
      motionPath,
      scaleX: toRect.width / (star.offsetWidth || 1),
      scaleY: toRect.height / (star.offsetHeight || 1),
      duration: o.duration,
      ease: o.ease,
    },
    0,
  );
  if (o.flash) flash(tl, star, o.flash);

  if (spinner instanceof HTMLElement || spinner instanceof SVGElement) {
    const spin = { deg: Number.parseFloat(getComputedStyle(spinner).rotate) || 0 };
    spinner.style.animation = "none";
    const apply = () => void (spinner.style.rotate = `${spin.deg}deg`);
    apply();
    // settle the frozen spin upright (before the turn, if there is one)
    if (o.symmetry > 0) {
      const upright = (Math.floor(spin.deg / o.symmetry) + 1) * o.symmetry;
      const settle = o.turn ? o.turn.at : o.duration;
      tl.to(spin, { deg: upright, duration: settle, ease: o.turn ? SWEEP_EASE : o.ease, onUpdate: apply }, 0);
    }
    if (o.turn) {
      const { at, duration, turns = 1, ease = SWEEP_EASE } = o.turn;
      tl.to(spin, { deg: `+=${360 * turns}`, duration, ease, onUpdate: apply }, at);
    }

    const shape = spinner.querySelector("path");
    if (o.pinch && shape) {
      const { at, peak, end, waist, ease = SWEEP_EASE } = o.pinch;
      const w = { v: BRAND_STAR.waist };
      const morph = () => shape.setAttribute("d", sparklePath(w.v));
      tl.to(w, { v: waist, duration: peak - at, ease, onUpdate: morph }, at).to(
        w,
        { v: BRAND_STAR.waist, duration: end - peak, ease, onUpdate: morph },
        peak,
      );
    }
  }

  /** Fires `rings` at `where()` (evaluated at that moment), at the flight's effective speed (e.g. ?slowmo). */
  const fire = (rings: ShockwaveOptions | ShockwaveOptions[], where: () => Point, at: number) =>
    tl.add(() => {
      let speed = 1;
      for (let t: gsap.core.Timeline | null = tl; t; t = t.parent) speed *= t.timeScale();
      const point = where();
      for (const ring of Array.isArray(rings) ? rings : [rings]) shockwave(point, unit, ring).timeScale(speed);
    }, at);

  if (o.bursts) for (const b of o.bursts) fire(b.rings, () => centre(star.getBoundingClientRect()), b.at);
  if (o.impact) fire(o.impact, () => to, o.duration);
  return tl;
}
