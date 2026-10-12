import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useMemo, useRef, type RefObject } from "react";
import { loadBakedIntro, playBakedIntro, prewarmIntroCanvas, type IntroSurface } from "./bakedIntro";
import { liveArtUnits, withLiveArt } from "./liveArt";
import { startDecayBoil, type BoilOptions } from "./boil";
import { flickerOut } from "./exit";
import { usePageTransition } from "./pageTransitionContext";
import type { StarFlightOptions } from "./starFlight";
import { createLoaderControl } from "./loader";
import { staggerTime, sweepIn, type SweepOptions } from "./sweep";
import { textRise, type TextRiseOptions } from "./textRise";
import { canvasUnits, diagonalOrder, textUnits } from "./units";
import { prefersReducedMotion, waitForAssets } from "./waitForAssets";

gsap.registerPlugin(useGSAP);

export type PageIntroOptions = {
  /** Folder of this page's baked intro under public/intro/ (written by `npm run bake`). */
  bake?: string;
  /** Class added to the root when the intro finishes; drives the CSS-only ambient loop. */
  ambientClass?: string;
  /** The <LoadingScreen> element. */
  loader?: RefObject<HTMLElement | null>;
  sweep?: SweepOptions;
  text?: TextRiseOptions;
  /** Seconds over which all text units start (in the page's stagger order). */
  textSpread?: number;
  /** Units matching this selector jump to the front of the page-wide stagger (in DOM order), before the "/" wave. */
  lead?: string;
  /** Idle "line boil" of the decay textures after the intro; `false` to disable. */
  boil?: BoilOptions | false;
  /**
   * Loader star → page `[data-star-anchor]` flight. `introAt` = seconds into the flight when the page
   * intro starts (default: when the star lands).
   */
  star?: StarFlightOptions & { introAt?: number };
  /**
   * How this page leaves during an SPA transition. Default: the intro reversed on the canvas (see
   * playBakedIntro direction "out") plus text leaving upwards; pages whose content changed since the bake mark
   * the root `data-bake-stale` and fall back to flickerOut for shapes.
   */
  exit?: (root: HTMLElement) => Promise<void>;
  /** Seconds each element takes to leave in the default exit (the intro uses `sweep.duration`). */
  exitDuration?: number;
  /** Seconds over which elements start leaving, along the diagonal (the intro uses `sweep.stagger`). */
  exitSpread?: number;
  /** Images zoom in inside their own frame (overflow hidden). Default true; false lets them spill (home). */
  imageClip?: boolean;
};

const params = () => new URLSearchParams(window.location.search);

/** Seconds into a page's intro after which a nav click may interrupt it (earlier clicks are ignored). */
const INTERRUPT_AFTER = 0.5;

/**
 * Bake mode (`?bake`, used by scripts/bake-intro.mjs): static page, transparent background, no paper overlay,
 * text hidden, and `window.__bakeUnits()` exposing the canvas units in canonical order.
 */
function enterBakeMode(root: HTMLElement) {
  gsap.set(root, { visibility: "visible", background: "transparent" });
  document.documentElement.style.background = "transparent";
  document.body.style.background = "transparent";
  root.querySelectorAll<HTMLElement>('[class*="paper"]').forEach((el) => (el.style.display = "none"));
  // text animates live, so it must not end up inside any baked bitmap
  textUnits(root).forEach((el) => (el.style.visibility = "hidden"));
  // the page star is the loader star after its flight, never part of a baked bitmap
  root.querySelectorAll<HTMLElement>("[data-star-anchor]").forEach((el) => (el.style.visibility = "hidden"));
  // recolours declared via data-intro-matrix are applied by the intro shader; bake the untouched pixels
  root.querySelectorAll<HTMLElement>('[data-intro-matrix] [style*="filter"]').forEach((el) => (el.style.filter = "none"));
  (window as unknown as { __bakeUnits: () => Element[] }).__bakeUnits = () => canvasUnits(root);
}

/**
 * Entrance for the hero:
 *   1. Loading screen with real progress: fonts + page images, then the baked intro
 *      (download, decode, GPU upload). The live page is painted underneath meanwhile.
 *   2. The loader star flies to the page's star anchor (`star` options); when it lands the loader fades and
 *      everything enters in one diagonal stagger:
 *      shapes / panels / main character on one <canvas> from the baked bitmaps (see playBakedIntro),
 *      text as a per-character rise in the live DOM (see textRise). Then the live page takes over.
 *   Without a matching bake (`npm run bake`), the canvas part falls back to the live DOM sweep.
 * When entered through an SPA transition (see PageTransitionProvider) the loading screen is skipped: assets load
 * while the travel star waits, then the travel star (instead of the loader star) flies to this page's anchor.
 * The page also registers its exit for transitions away from it.
 * `?static` skips everything, `?slowmo=10` plays the intro 10× slower.
 */
export function usePageIntro(
  scope: RefObject<HTMLElement | null>,
  { bake = "hero", ambientClass, loader, sweep, text, textSpread = 0.25, boil = {}, star = {}, lead, exit, exitDuration = 1, exitSpread = 0.25, imageClip = true }: PageIntroOptions = {},
) {
  const transition = usePageTransition();
  const releaseRef = useRef<(regions: HTMLElement[]) => boolean>(() => false);
  useGSAP(
    (_, contextSafe) => {
      const root = scope.current;
      if (!root || !contextSafe) return;
      let alive = true;
      /** loading: nothing on screen yet; playing: the intro runs; done: the live page is all there is. */
      let phase: "loading" | "playing" | "done" = "loading";
      let releaseUnits: (regions: HTMLElement[]) => void = () => {};
      const released: Array<() => void> = [];
      releaseRef.current = (regions) => {
        if (phase === "loading") return false;
        if (phase === "done" || released.length) return true;
        releaseUnits(regions);
        for (const region of regions) {
          const z = region.style.zIndex;
          region.style.zIndex = "10"; // above the intro canvas (9); the live paper overlay (10, later in the DOM) stays on top
          released.push(() => void (region.style.zIndex = z));
        }
        return true;
      };
      let dispose = () => {};
      let stopBoil = () => {};
      const idle = () => {
        if (ambientClass) root.classList.add(ambientClass);
        // the next page's intro canvas: its WebGL context is made now, in idle time, not mid-transition
        if (transition) (window.requestIdleCallback ?? window.setTimeout)(() => prewarmIntroCanvas());
        if (boil === false || prefersReducedMotion()) return;
        const only = params().get("boil"); // ?boil=heavy,soft to try a subset
        stopBoil = startDecayBoil(root, only ? { ...boil, levels: only.split(",") } : boil);
      };
      const ctl = loader?.current ? createLoaderControl(loader.current) : null;

      if (params().has("bake")) {
        ctl?.hide();
        enterBakeMode(root);
        return;
      }

      // entered through an SPA transition: no loading screen, the travel star is already up
      const arriving = transition?.arriving() ?? false;
      if (arriving) ctl?.hide();
      const landed = () => (arriving ? transition?.landed() : ctl?.hide());

      /** Start time of every unit: one diagonal stagger (leads first); text gets its own short spread, same order. */
      const startTimes = (units: Element[], words: Element[], spread = sweep?.stagger ?? { amount: 1, ease: "none" }) => {
        const all = [...units, ...words];
        const starts: number[] = [];
        const leads = lead ? all.flatMap((el, i) => (el.matches(lead) ? [i] : [])) : [];
        const order = [...leads, ...diagonalOrder(all).filter((i) => !leads.includes(i))];
        order.forEach((i, rank) => (starts[i] = staggerTime(rank, all.length, spread)));
        order
          .filter((i) => i >= units.length)
          .forEach((i, rank, textOrder) => (starts[i] = staggerTime(rank, textOrder.length, { amount: textSpread, ease: "none" })));
        return starts;
      };

      let disposeExit = () => {};
      // the intro's canvas, textures and grain stay on the GPU afterwards: the exit plays on them with no upload
      let surface: IntroSurface | null = null;
      /** The intro reversed: shapes / images on the canvas from the baked bitmaps, text leaving upwards. */
      const reverseIntro = async () => {
        const units = canvasUnits(root);
        const words = textUnits(root);
        const starts = startTimes(units, words, { amount: exitSpread, ease: "none" });
        const stale = root.dataset.bakeStale === "1";
        const cached = stale ? null : await loadBakedIntro(bake, units.length, () => {}); // session cache: instant
        const assets = cached && (await withLiveArt(cached, units, root)); // the artwork showing now
        const rise = textRise(words, starts.slice(units.length), { ...text, direction: "out", duration: exitDuration, liftWithin: root });
        const tl = gsap.timeline({ paused: true });
        if (assets) {
          const player = playBakedIntro(root, units, assets, {
            ...sweep,
            duration: exitDuration,
            direction: "out",
            startTimes: starts.slice(0, units.length),
            zIndex: 9,
            overlay: root.querySelector<HTMLElement>('[class*="paper"]'),
            surface,
            refresh: liveArtUnits(units),
          });
          disposeExit = () => {
            player.dispose();
            rise.dispose();
          };
          await player.warm(undefined, units.length); // on the kept surface: nothing left to upload, starts next frame
          tl.add(player.timeline.play(), 0);
        } else {
          disposeExit = () => rise.dispose();
          tl.add(() => void flickerOut(root, { units: "shapes" }), 0);
        }
        tl.add(rise.timeline.play(), 0);
        await new Promise<void>((resolve) => tl.eventCallback("onComplete", () => resolve()).play());
      };

      // nav clicks mid-intro (PageTransitionProvider.go): allowed once the intro has played INTERRUPT_AFTER s (by
      // then the eases have done nearly all their travel); leaving finishes the intro at once first
      let introStarted = 0;
      let finishIntro = () => {};
      const unregisterIntro =
        transition?.registerIntro({
          canLeave: () => phase === "done" || (phase === "playing" && performance.now() - introStarted >= INTERRUPT_AFTER * 1000),
          finish: () => phase === "playing" && finishIntro(),
        }) ?? (() => {});

      const unregisterExit =
        transition?.registerExit(async () => {
          stopBoil();
          await (exit ? exit(root) : reverseIntro());
          root.style.visibility = "hidden";
        }) ?? (() => {});

      const showPage = contextSafe(() => gsap.set(root, { visibility: "visible" }));
      // the shared frame + nav (SiteChrome): animated once, by the first page's intro, never by transitions
      const chrome = document.querySelector<HTMLElement>("[data-site-chrome]");
      const introChrome = !arriving && chrome && !("shown" in chrome.dataset) ? chrome : null;
      const showChrome = () => chrome && (chrome.dataset.shown = "");

      const { introAt, ...flight } = star;
      // arriving: the travel star leaves for this page's anchor right away, alongside the previous page's exit
      const anchor = root.querySelector("[data-star-anchor]");
      if (arriving && transition && anchor && !prefersReducedMotion()) transition.flyStar(anchor, flight);

      const run = async () => {
        ctl?.setProgress(0.02, "fonts");
        await waitForAssets(root);
        if (!alive) return;
        // first load: painted under the loader from here on. Arriving: no loader, so stay hidden until the intro
        // canvas is up (otherwise the finished page flashes before the intro starts)
        if (!arriving) showPage();
        ctl?.setProgress(0.15, "artwork");

        if (prefersReducedMotion()) {
          phase = "done";
          showPage();
          showChrome();
          landed();
          idle();
          return;
        }

        const units = canvasUnits(root);
        const words = textUnits(root);
        const chromeShapes = introChrome ? canvasUnits(introChrome) : [];
        const chromeWords = introChrome ? textUnits(introChrome) : [];
        // one diagonal stagger across everything (the shared chrome included), so it all arrives as a single wave
        const all = startTimes([...units, ...chromeShapes], [...words, ...chromeWords]);
        const take = (n: number) => all.splice(0, n);
        const starts = take(units.length);
        const chromeShapeStarts = take(chromeShapes.length);
        starts.push(...take(words.length));
        const chromeWordStarts = take(chromeWords.length);

        // first load: this page's intro, then every other page's (decoded once, here, behind the loading screen, so
        // later transitions never download or decode). Arriving: already decoded, instant
        const others = ctl && transition ? 0.25 : 0;
        const baked0 = await loadBakedIntro(bake, units.length, (f, step) => ctl?.setProgress(0.15 + (0.7 - others) * f, step));
        if (!alive) return;
        const assets = baked0 && (await withLiveArt(baked0, units, root)); // live artwork (e.g. rotating panels) as shown now
        if (!alive) return;
        if (ctl && transition) await transition.preload((f, step) => ctl.setProgress(0.6 + others * f, step));
        if (!alive) return;

        let intro: { timeline: gsap.core.Timeline; dispose: () => void };
        if (assets) {
          const baked = playBakedIntro(root, units, assets, {
            ...sweep,
            startTimes: starts.slice(0, units.length),
            zIndex: 9,
            overlay: root.querySelector<HTMLElement>('[class*="paper"]'),
            keep: !!transition,
            imageClip,
          });
          intro = baked;
          releaseUnits = (regions) => baked.release((el) => regions.some((region) => region.contains(el)));
          surface = baked.surface;
          // a few per frame: arriving, this runs alongside the previous page's exit and must not stall it
          await baked.warm((f) => ctl?.setProgress(0.85 + 0.13 * f, "uploading to gpu"));
        } else {
          ctl?.setProgress(0.9, "warming layers");
          const dom = sweepIn(units, sweep);
          await dom.ready();
          intro = dom;
        }
        // the chrome sits above the intro canvas: its shapes sweep live in the DOM (each at its own start time)
        // (on the page's own layers: see SweepOptions.promote)
        const chromeSweeps = chromeShapes.map((el) => sweepIn([el], { ...sweep, promote: false }));
        await Promise.all(chromeSweeps.map((s) => s.ready()));
        const rise = textRise(words, starts.slice(units.length), { ...text, liftWithin: root });
        const chromeRise = textRise(chromeWords, chromeWordStarts, text);
        dispose = () => {
          intro.dispose();
          rise.dispose();
          chromeSweeps.forEach((s) => s.dispose());
          chromeRise.dispose();
        };
        if (!alive) return dispose();

        const both = gsap.timeline({ paused: true, onStart: showChrome });
        both.add(intro.timeline.play(), 0).add(rise.timeline.play(), 0).add(chromeRise.timeline.play(), 0);
        chromeSweeps.forEach((s, i) => both.add(s.timeline.play(), chromeShapeStarts[i]));
        both.add(() => {
          released.splice(0).forEach((restore) => restore()); // before rise.lower(), which restores what it flattened
          phase = "done";
          rise.lower(); // same tick the canvas is removed, so text never sits behind it
          chromeRise.lower();
          landed(); // …and the flying star is swapped for the page's own star
          idle();
        });
        const slowmo = Number(params().get("slowmo"));
        if (slowmo > 0) both.timeScale(1 / slowmo);

        if (arriving && transition) {
          // the star is already on its way; start at the transition's beat (or now, if loading ran late)
          // wall-clock timer, not the GSAP clock: GSAP's lag smoothing drifts while the page is busy mounting
          const wait = Math.max(0, transition.introAt() - performance.now());
          window.setTimeout(
            contextSafe(() => {
              if (!alive) return;
              showPage(); // the intro canvas covers everything now, safe to show
              phase = "playing";
              introStarted = performance.now();
              finishIntro = () => void both.progress(1);
              both.play();
            }),
            wait,
          );
          return;
        }

        await ctl?.finished();
        if (!alive) return dispose();
        const seq = gsap.timeline();
        seq.add(() => showPage(), 0);
        if (ctl && anchor) seq.add(ctl.flyStar(anchor, flight), 0);
        seq.add(
          () => {
            ctl?.exit();
            phase = "playing";
            introStarted = performance.now();
            // finishing also ends the loader star's flight (its trail and landing rings)
            finishIntro = () => {
              seq.progress(1);
              both.progress(1);
            };
            both.play();
          },
          ctl && anchor ? (introAt ?? flight.duration ?? 1) : 0,
        );
        if (slowmo > 0) seq.timeScale(1 / slowmo);
      };

      run();
      return () => {
        alive = false;
        dispose();
        stopBoil();
        unregisterExit();
        unregisterIntro();
        disposeExit();
        surface?.dispose();
      };
    },
    { scope },
  );
  return useMemo(
    () => ({
      /**
       * Hands `region`(s) (e.g. a scrolling list and the controls that follow it) over to the live DOM mid-intro so
       * the user can use them right away: their units stop being drawn by the intro canvas and they are raised
       * above it until the handover. Returns false while the intro hasn't started yet (nothing is on screen: leave
       * it alone), true otherwise.
       */
      release: (region: HTMLElement | HTMLElement[]) => releaseRef.current(Array.isArray(region) ? region : [region]),
    }),
    [],
  );
}
