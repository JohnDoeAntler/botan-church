import gsap from "gsap";
import {
  create2DRenderer,
  createWebGLRenderer,
  GL_ATTRIBUTES,
  rasterizeMultiplyOverlay,
  type Box,
  type ColorMatrix,
  type IntroRenderer,
  type Tint,
} from "./introRenderer";
import { parseColorMatrix } from "../lib/color";
import { staggerTime, SWEEP_EASE, type SweepOptions } from "./sweep";
import { diagonalOrder, kindOf, paintOrder, type Unit, type UnitKind } from "./units";

/** Written by scripts/bake-intro.mjs into public/intro/manifest.json. */
export type BakeManifest = {
  version: 2;
  /** Device pixels per design px in the baked images. */
  scale: number;
  /** `pad`: design px baked around the unit's bounding box per side [left, top, right, bottom]. */
  units: Array<{ file: string; bytes: number; pad: [number, number, number, number] }>;
};

export type BakedIntroAssets = { manifest: BakeManifest; bitmaps: ImageBitmap[] };

export type LoadProgress = (fraction: number, step: string) => void;

const introBase = (bake: string) => `${import.meta.env.BASE_URL}intro/${bake}/`;

/** Downloads with byte-level progress. */
async function fetchWithProgress(url: string, onBytes: (n: number) => void) {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`${url}: ${res.status}`);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    onBytes(value.byteLength);
  }
  return new Blob(chunks as BlobPart[], { type: res.headers.get("content-type") ?? "image/webp" });
}

/**
 * Decoded bakes, kept for the whole session: once a bake is decoded (normally during the first loading screen, see
 * preloadBakedIntro) every later intro and exit of that page reuses the same bitmaps, with no download or decode.
 */
const decodedBakes = new Map<string, Promise<BakedIntroAssets | null>>();

function decodedBake(bake: string, onProgress: LoadProgress, concurrency: number) {
  let job = decodedBakes.get(bake);
  if (!job) {
    job = decodeBake(bake, onProgress, concurrency);
    decodedBakes.set(bake, job);
    void job.then((assets) => assets || decodedBakes.delete(bake)); // nothing to keep: try again next time
  }
  return job;
}

/** Downloads and decodes a page's baked intro into the session cache ahead of time (for its first transition). */
export async function preloadBakedIntro(bake: string, onProgress: LoadProgress = () => {}, concurrency = 6) {
  await decodedBake(bake, onProgress, concurrency);
  onProgress(1, "decoded");
}

/**
 * Loads the baked intro: manifest, then every unit image (byte progress) and its decode, or straight from the
 * session cache. Resolves to null when there is no bake or it doesn't match the page (`expectedUnits`), so the
 * caller can fall back to the live DOM sweep. Progress is reported 0..1 across the whole job.
 * The bitmaps are shared: never close them.
 */
export async function loadBakedIntro(
  bake: string,
  expectedUnits: number,
  onProgress: LoadProgress,
  concurrency = 6,
): Promise<BakedIntroAssets | null> {
  const assets = await decodedBake(bake, onProgress, concurrency);
  onProgress(1, "decoded");
  return assets && assets.manifest.units.length === expectedUnits ? assets : null;
}

async function decodeBake(bake: string, onProgress: LoadProgress, concurrency: number): Promise<BakedIntroAssets | null> {
  const BASE = introBase(bake);
  let manifest: BakeManifest;
  try {
    const res = await fetch(`${BASE}manifest.json`, { cache: "no-cache" });
    if (!res.ok) return null;
    manifest = await res.json();
  } catch {
    return null;
  }
  if (manifest.version !== 2) return null;

  const n = manifest.units.length;
  const total = manifest.units.reduce((sum, u) => sum + u.bytes, 0) || 1;
  let loaded = 0;
  let decoded = 0;
  // 0–85 %: download, 85–100 %: decode
  const report = (step: string) => onProgress(0.85 * Math.min(1, loaded / total) + 0.15 * (decoded / n), step);

  const bitmaps: ImageBitmap[] = new Array(n);
  let next = 0;
  const worker = async () => {
    while (next < n) {
      const i = next++;
      const blob = await fetchWithProgress(`${BASE}${manifest.units[i].file}`, (bytes) => {
        loaded += bytes;
        report(`artwork ${String(i + 1).padStart(3, "0")} / ${n}`);
      });
      bitmaps[i] = await createImageBitmap(blob, { premultiplyAlpha: "premultiply" });
      decoded++;
      report(`decode ${String(decoded).padStart(3, "0")} / ${n}`);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  return { manifest, bitmaps };
}

/**
 * A canvas with its renderer, textures and paper overlay already on the GPU. An intro played with `keep` hands
 * its surface over when it ends (canvas hidden, nothing released), so the page's exit can start on it at once.
 */
export type IntroSurface = {
  canvas: HTMLCanvasElement;
  renderer: IntroRenderer;
  overlayReady: boolean;
  /** Releases the canvas and everything on the GPU. Idempotent. */
  dispose: () => void;
};

/**
 * A canvas whose WebGL context already exists. Creating a context costs tens of ms of main thread (more on some
 * machines); made in idle time once a page has settled (prewarmIntroCanvas), the next page's intro just takes it,
 * so that cost never lands in the middle of a transition (where it held up the travel star).
 */
let spareCanvas: HTMLCanvasElement | null = null;

export function prewarmIntroCanvas() {
  if (spareCanvas) return;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  if (canvas.getContext("webgl2", GL_ATTRIBUTES)) spareCanvas = canvas;
}

function takeIntroCanvas() {
  const canvas = spareCanvas ?? document.createElement("canvas");
  spareCanvas = null;
  return canvas;
}

type Band = { hide: number; reveal: number; on: boolean };
type Slot = {
  kind: UnitKind;
  colors: { top: Exclude<Tint, null>; under: Exclude<Tint, null> };
  box: Box;
  original: Band;
  under: Band;
  top: Band;
  /** image: visible right now (hard flicker); zoom inside its box. hero: horizontal slide offset (px). */
  visible: boolean;
  /** Recolour from the unit's `data-intro-matrix` (feColorMatrix values), mirroring a CSS filter on the live element. */
  matrix: ColorMatrix | null;
  zoom: { v: number };
  /** Exit only: the image's box shrinks around its centre. */
  scale: { v: number };
  slide: { v: number };
  done: boolean;
  /** Handed over to the live DOM mid-intro (see release()): no longer drawn. */
  released: boolean;
};

/** Image flicker: hard cuts at these frame offsets (s), alternating show / hide, ending shown. */
const FLICKER = [0, 1 / 24, 2 / 24, 3 / 24, 4 / 24];

/** Exit flicker for images: hide / show cuts, ending shown (the sweep-out at `imageSweepAt` removes them). */
const FLICKER_OUT = [0, 1 / 24, 2 / 24, 3 / 24];

const DEFAULTS = {
  /** Images start this much larger and settle to 1. */
  imageZoom: 1.5,
  /** Exit: images shrink to this size, and sweep out starting this many seconds in. */
  imageShrink: 0.82,
  imageSweepAt: 12 / 24,
  /** The main character slides in from the right by this many design px. */
  heroSlide: 50,
  duration: 1.5,
  stagger: { amount: 1, ease: "none" } as NonNullable<SweepOptions["stagger"]>,
  ease: SWEEP_EASE as SweepOptions["ease"],
  offsets: { underIn: 0, topIn: 1 / 24, originalIn: 3 / 24, topOut: 6 / 24, underOut: 7 / 24 },
};

const ALL = 1e9;

/**
 * Plays the intro on one <canvas> laid over `root`, using baked bitmaps placed where the live units are
 * (so anchors / aspect ratios still match). Per unit kind (see units.kindOf):
 *   - sweep: diagonal print sweep (ink + teal copies, then the original);
 *   - image: hard on/off flicker at 0, 1, 2, 3, 4 /24 s while zooming from `imageZoom` to 1;
 *   - hero: the sweep plus a right → left slide of `heroSlide` design px. Drawn with WebGL2 when available (cheap in every
 * browser), Canvas 2D otherwise. The live DOM stays painted underneath; when the timeline ends the canvas
 * is removed and the page is simply there.
 *
 * Returns a paused timeline plus `warm()`, which uploads everything to the GPU a few units per frame —
 * call it behind the loading screen so the sweep never stalls.
 */
export function playBakedIntro(
  root: HTMLElement,
  units: Unit[],
  assets: BakedIntroAssets,
  options: Pick<SweepOptions, "duration" | "stagger" | "ease" | "offsets"> & {
    /** Start time per unit (same index as `units`); defaults to the stagger along the "/" diagonal. */
    startTimes?: number[];
    /**
     * in: the entrance (everything starts hidden). out: the exit, the same presets reversed: sweeps run black
     * reveal → teal reveal → original hides → teal hides → black hides; images flicker and shrink, then sweep out at
     * `imageSweepAt`; the main character sweeps out while sliding on to the left. The canvas stays up when done.
     */
    direction?: "in" | "out";
    imageZoom?: number;
    imageShrink?: number;
    imageSweepAt?: number;
    heroSlide?: number;
    zIndex?: number;
    /** A full-screen `mix-blend-mode: multiply` overlay (paper grain) to reproduce inside the canvas. */
    overlay?: HTMLElement | null;
    /** Images zoom inside their own frame (overflow hidden) instead of spilling past it. Default true. */
    imageClip?: boolean;
    /** Play on this surface (from an earlier `keep` playback) instead of a new one, if it still fits the page. */
    surface?: IntroSurface | null;
    /** When done (or disposed), hide the canvas but keep the surface (returned as `surface`) for a later playback. */
    keep?: boolean;
    /** Units whose bitmap changed since `surface` was prepared (live artwork): re-uploaded on a reused surface. */
    refresh?: number[];
  } = {},
) {
  const o = { ...DEFAULTS, ...options };
  const out = options.direction === "out";
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rootRect = root.getBoundingClientRect();
  const unit = Number.parseFloat(getComputedStyle(root).getPropertyValue("--u")) || 1; // CSS px per design px
  const view = { w: rootRect.width, h: rootRect.height };

  const size = { w: Math.round(view.w * dpr), h: Math.round(view.h * dpr) };
  const given = options.surface;
  const fits = given && given.canvas.parentElement === root && given.canvas.width === size.w && given.canvas.height === size.h;
  if (given && !fits) given.dispose(); // resized since: start over

  const canvas = fits ? given.canvas : takeIntroCanvas();
  canvas.setAttribute("aria-hidden", "true");
  canvas.width = size.w;
  canvas.height = size.h;
  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    zIndex: String(options.zIndex ?? 9),
    pointerEvents: "none",
    // leaving: stay invisible until warm() has drawn the page as it is (no blank-paper frames over the live page)
    visibility: options.direction === "out" ? "hidden" : "",
  });
  root.appendChild(canvas);

  const css = getComputedStyle(root);
  const colors = {
    paper: css.getPropertyValue("--c-paper").trim() || "#fff",
    teal: css.getPropertyValue("--c-teal").trim() || "#23a9a3",
    ink: css.getPropertyValue("--c-ink").trim() || "#171717",
  };
  const renderer: IntroRenderer = fits
    ? given.renderer
    : (createWebGLRenderer(canvas, assets.bitmaps, colors, view) ?? create2DRenderer(canvas, assets.bitmaps, colors, view, dpr));
  if (fits) for (const i of options.refresh ?? []) renderer.update(i, assets.bitmaps[i]);
  let released = false;
  const surface: IntroSurface = {
    canvas,
    renderer,
    overlayReady: fits ? given.overlayReady : false,
    dispose: () => {
      if (released) return;
      released = true;
      canvas.remove();
      renderer.dispose(); // the bitmaps stay: they belong to the session cache
    },
  };

  const slots: Slot[] = units.map((el, i) => {
    const r = el.getBoundingClientRect();
    const [pl, pt, pr, pb] = assets.manifest.units[i].pad.map((p) => p * unit);
    const band = (): Band => ({ hide: -40, reveal: -40, on: false });
    const box = { x: r.left - rootRect.left - pl, y: r.top - rootRect.top - pt, w: r.width + pl + pr, h: r.height + pt + pb };
    return {
      kind: kindOf(el),
      visible: out,
      matrix: parseColorMatrix(el.getAttribute("data-intro-matrix") ?? ""),
      zoom: { v: 1 },
      scale: { v: 1 },
      slide: { v: 0 },
      colors: el.getAttribute("data-sweep-base") === "teal" ? { top: "ink", under: "teal" } : { top: "teal", under: "ink" },
      box,
      // leaving: the original starts fully shown
      original: out ? { hide: -40, reveal: box.w + box.h + 40, on: true } : band(),
      under: band(),
      top: band(),
      done: false,
      released: false,
    };
  });
  const order = paintOrder(root, units);

  const render = () => {
    renderer.begin();
    for (const i of order) {
      const s = slots[i];
      if (s.released) continue;
      if (s.done) {
        renderer.draw(i, s.box, -ALL, ALL, null, 1, s.matrix);
        continue;
      }
      if (s.kind === "image" && !out) {
        if (s.visible) renderer.draw(i, s.box, -ALL, ALL, null, s.zoom.v, s.matrix, options.imageClip ?? true);
        continue;
      }
      if (s.kind === "image" && !s.visible) continue;
      let box = s.slide.v ? { ...s.box, x: s.box.x + s.slide.v } : s.box;
      if (s.scale.v !== 1) {
        const k = s.scale.v;
        box = { x: box.x + (box.w * (1 - k)) / 2, y: box.y + (box.h * (1 - k)) / 2, w: box.w * k, h: box.h * k };
      }
      if (s.original.on) renderer.draw(i, box, s.original.hide, s.original.reveal, null, 1, s.matrix);
      if (s.under.on) renderer.draw(i, box, s.under.hide, s.under.reveal, s.colors.under);
      if (s.top.on) renderer.draw(i, box, s.top.hide, s.top.reveal, s.colors.top);
    }
    renderer.end(grain);
  };
  /** Paper grain drawn by the canvas (true) or by the live overlay (after a release). */
  let grain = true;

  const tl = gsap.timeline({
    paused: true,
    onStart: () => {
      // the canvas applies the overlay itself while it runs; the live one comes back at handover
      if (overlayReady && options.overlay) options.overlay.style.visibility = "hidden";
      gsap.ticker.add(render);
    },
    // leaving: keep the (now empty) canvas up until the page unmounts
    onComplete: () => (out ? gsap.ticker.remove(render) : dispose()),
  });

  const starts = o.startTimes ?? (() => {
    const t: number[] = [];
    const sweepOrder = diagonalOrder(units);
    sweepOrder.forEach((i, rank) => (t[i] = staggerTime(rank, sweepOrder.length, o.stagger)));
    return t;
  })();

  slots.forEach((s, i) => {
    const t = starts[i];
    const end = s.box.w + s.box.h + 40;
    const band = (b: Band, edge: "hide" | "reveal", at: number) =>
      tl.to(b, { [edge]: end, duration: o.duration, ease: o.ease, onStart: () => void (b.on = true) }, t + at);

    if (out) {
      // same sweep, reversed roles: the copies cover the original, it vanishes under them, then they leave
      const sweepOut = (at: number) => {
        band(s.under, "reveal", at + o.offsets.underIn);
        band(s.top, "reveal", at + o.offsets.topIn);
        band(s.original, "hide", at + o.offsets.originalIn);
        band(s.top, "hide", at + o.offsets.topOut);
        band(s.under, "hide", at + o.offsets.underOut);
      };
      if (s.kind === "image") {
        FLICKER_OUT.forEach((at, k) => tl.call(() => void (s.visible = k % 2 === 1), undefined, t + at));
        tl.to(s.scale, { v: o.imageShrink, duration: o.duration, ease: o.ease }, t);
        sweepOut(o.imageSweepAt);
        return;
      }
      if (s.kind === "hero") tl.to(s.slide, { v: -o.heroSlide * unit, duration: o.duration, ease: o.ease }, t);
      sweepOut(0);
      return;
    }

    if (s.kind === "image") {
      FLICKER.forEach((at, k) => tl.call(() => void (s.visible = k % 2 === 0), undefined, t + at));
      tl.fromTo(s.zoom, { v: o.imageZoom }, { v: 1, duration: o.duration, ease: o.ease, immediateRender: false }, t);
      tl.add(() => void (s.done = true), t + o.duration);
      return;
    }

    if (s.kind === "hero") {
      s.slide.v = o.heroSlide * unit;
      tl.to(s.slide, { v: 0, duration: o.duration, ease: o.ease }, t);
    }

    band(s.under, "reveal", o.offsets.underIn);
    band(s.top, "reveal", o.offsets.topIn);
    band(s.original, "reveal", o.offsets.originalIn);
    band(s.top, "hide", o.offsets.topOut);
    band(s.under, "hide", o.offsets.underOut);
    tl.add(() => void (s.done = true), t + o.offsets.underOut + o.duration);
  });

  let overlayReady = surface.overlayReady;

  /** GPU upload / preparation of every unit, a few per frame, reported 0..1 (instant on a kept surface). */
  const warm = async (onProgress?: (fraction: number) => void, perFrame = 4) => {
    if (options.overlay && !overlayReady) {
      const image = await rasterizeMultiplyOverlay(options.overlay, view, dpr).catch(() => null);
      if (image) {
        renderer.setOverlay(image);
        overlayReady = surface.overlayReady = true;
      }
    }
    for (let i = 0; i < slots.length; i += perFrame) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      for (let j = i; j < Math.min(slots.length, i + perFrame); j++) renderer.prepare(j);
      onProgress?.(Math.min(1, (i + perFrame) / slots.length));
    }
    if (out) {
      render(); // the page as it is, so the swap from live DOM to canvas is invisible
      canvas.style.visibility = "";
      if (overlayReady && options.overlay) options.overlay.style.visibility = "hidden"; // the canvas draws the grain now
    }
    else {
      renderer.begin(); // empty paper for the start of the sweep
      renderer.end();
    }
  };

  renderer.begin();
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    gsap.ticker.remove(render);
    if (options.overlay) options.overlay.style.visibility = "";
    if (options.keep) canvas.style.visibility = "hidden";
    else surface.dispose();
  };
  /**
   * Hands the units matching `match` over to the live DOM mid-intro (e.g. a list the user starts scrolling, raised
   * above the canvas by the caller): the canvas stops drawing them, and the paper grain moves back to the live
   * overlay so the raised content gets it too (instead of being drawn under the canvas's own grain).
   */
  const release = (match: (el: Element) => boolean) => {
    slots.forEach((s, i) => match(units[i]) && (s.released = true));
    if (overlayReady && options.overlay) {
      grain = false;
      options.overlay.style.visibility = "";
    }
  };
  return { timeline: tl, dispose, warm, release, renderer: renderer.kind, surface };
}
