import gsap from "gsap";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate, type Location } from "react-router-dom";
import { routeOf } from "../lib/base";
import { BrandStar } from "../components/shapes/BrandStar";
import { BRAND_STAR } from "../components/shapes/brandStarSpec";
import { LeavingContext, PageTransitionContext, type PageTransition } from "./pageTransitionContext";
import { preloadBakedIntro } from "./bakedIntro";
import { preloadImages } from "./preloadImages";
import { flyStar as flyStarTo } from "./starFlight";
import styles from "./PageTransition.module.css";

const isInternal = (a: HTMLAnchorElement) => {
  const href = a.getAttribute("href") ?? "";
  return href.startsWith("/") && !href.startsWith("//") && !a.target && !a.hasAttribute("download");
};

type Rect = { left: number; top: number; width: number; height: number };

/**
 * SPA page transitions. Internal links (`<a href="/…">`) are intercepted; navigating runs, from the click:
 *   t = 0          the shared star is lifted off the current page (a travel star outside every page, placed
 *                  exactly over the current `[data-star-anchor]`); the current page plays its exit, on top, while the
 *                  next page mounts hidden underneath;
 *   t = starDelay  the travel star flies to the next page's anchor (that page's flight options);
 *   t = delay      the leaving page is removed and the next page's intro starts (usePageIntro), or as soon as its
 *                  assets are ready if that is later.
 * The app renders the leaving page with useLeavingLocation() (see App).
 * Browser back / forward also enter without the loading screen (the star starts from the screen centre).
 * Any page using usePageIntro gets this for free: adding a page only needs a route.
 */
export function PageTransitionProvider({
  children,
  delay = 1,
  starDelay = 0.5,
  preload = [],
  images = [],
}: {
  children: ReactNode;
  /** Seconds from click to the next intro. */
  delay?: number;
  /** Seconds from click until the travel star leaves for the next page's anchor. */
  starDelay?: number;
  /**
   * Baked intros (public/intro/<name>) the first loading screen decodes up front, so transitions start instantly.
   * A function is resolved when preloading starts (e.g. a bake that depends on the viewport).
   */
  preload?: Array<string | (() => string)>;
  /** Every page's artwork, decoded behind the first loading screen too (no empty frames on later pages / scrolls). */
  images?: string[];
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);
  const [leaving, setLeaving] = useState<Location | null>(null);
  const starRef = useRef<HTMLDivElement>(null);
  const spinRef = useRef<HTMLDivElement>(null);
  const state = useRef({
    arriving: false,
    busy: false,
    startedAt: 0,
    /** performance.now() the travel star is due to leave (0: as soon as the next page asks, e.g. back / forward). */
    starDue: 0,
    exit: null as null | (() => Promise<void>),
    /** The current page's intro (see registerIntro). */
    intro: null as null | { canLeave: () => boolean; finish: () => void },
  });
  // the travel star outlives every page, so its tweens must never be recorded in a page's useGSAP context: that
  // context is reverted when the page unmounts, which would rewind a flight it started (star back at the old page's
  // anchor, hidden) in the middle of the next transition. (Context.add would still nest into the active page
  // context; ignore() records nowhere.)
  const own = useMemo(() => {
    const ctx = gsap.context(() => {});
    return <T,>(fn: () => T): T => {
      let out!: T;
      ctx.ignore(() => void (out = fn()));
      return out;
    };
  }, []);

  const preloadRef = useRef({ bakes: preload, images });
  useEffect(() => {
    preloadRef.current = { bakes: preload, images };
  }, [preload, images]);

  const star = useMemo(
    () => ({
      /** Put the travel star over a rect (viewport px), visible and still. */
      placeAt(r: Rect) {
        const el = starRef.current!;
        gsap.killTweensOf(el);
        own(() => gsap.set(el, { x: 0, y: 0, scaleX: 1, scaleY: 1, autoAlpha: 1, left: r.left, top: r.top, width: r.width, height: r.height }));
        const spin = spinRef.current!;
        spin.classList.remove(styles.spin);
        spin.style.removeProperty("rotate");
        spin.style.removeProperty("animation");
      },
      placeAtCentre() {
        const w = BRAND_STAR.width;
        const h = BRAND_STAR.height;
        this.placeAt({ left: innerWidth / 2 - w / 2, top: innerHeight / 2 - h / 2, width: w, height: h });
      },
      /** Spin in place while the next page loads. */
      wait() {
        spinRef.current!.classList.add(styles.spin);
      },
      hide() {
        own(() => gsap.set(starRef.current!, { autoAlpha: 0 }));
      },
    }),
    [own],
  );

  const api = useMemo<PageTransition>(
    () => ({
      arriving: () => state.current.arriving,
      registerIntro: (intro) => {
        state.current.intro = intro;
        return () => {
          if (state.current.intro === intro) state.current.intro = null;
        };
      },
      registerExit: (exit) => {
        state.current.exit = exit;
        return () => {
          if (state.current.exit === exit) state.current.exit = null;
        };
      },
      flyStar: (anchor, options) => {
        const tl = own(() => flyStarTo(starRef.current!, anchor, spinRef.current, options));
        // in a transition the star leaves at `starDelay` after the click, on the wall clock (like the intro beat).
        // If the main thread was busy then (the next page mounting), the flight starts as far in as it is late, so
        // it still lands on time: what's skipped are frames that couldn't have been painted anyway.
        const due = state.current.starDue || performance.now();
        const launch = () => tl.play(Math.min(tl.duration(), Math.max(0, (performance.now() - due) / 1000)), false);
        tl.pause();
        const wait = due - performance.now();
        if (wait > 0) window.setTimeout(launch, wait);
        else launch();
        return tl;
      },
      landed: () => {
        star.hide();
        state.current.arriving = false;
        state.current.busy = false;
      },
      go: (href) => {
        const s = state.current;
        // already there (the router's path, so the base is stripped; a trailing slash doesn't make it another page)
        const trim = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path);
        if (trim(href) === trim(locationRef.current.pathname)) return;
        // mid-intro: ignored for its first moments (no spam clicking, and the page is barely there), after that
        // the intro snaps to its end (page fully in place, handover done) and the normal exit runs from there
        if (s.intro && !s.intro.canLeave()) return;
        s.intro?.finish();
        if (s.busy) return;
        s.busy = true;
        const anchor = document.querySelector<HTMLElement>("[data-star-anchor]");
        if (anchor) {
          star.placeAt(anchor.getBoundingClientRect());
          anchor.style.visibility = "hidden";
        } else star.placeAtCentre();
        // t = 0: the current page starts leaving while the next one mounts hidden underneath (so its star anchor
        // exists and the travel star can fly there right away); at t = delay the leaving page is removed
        const exit = s.exit;
        s.arriving = true;
        s.startedAt = performance.now();
        s.starDue = s.startedAt + starDelay * 1000;
        setLeaving(locationRef.current);
        navigate(href);
        void exit?.();
        window.setTimeout(() => setLeaving(null), delay * 1000);
      },
      introAt: () => state.current.startedAt + delay * 1000,
      preload: async (onProgress) => {
        const { bakes, images: urls } = preloadRef.current;
        const names = bakes.map((p) => (typeof p === "function" ? p() : p));
        const steps = names.length + (urls.length ? 1 : 0); // each bake, then all the artwork, as equal steps
        for (const [i, name] of names.entries())
          await preloadBakedIntro(name, (f, step) => onProgress((i + f) / steps, `${name} · ${step}`));
        if (urls.length) await preloadImages(urls, (f, step) => onProgress((names.length + f) / steps, step));
      },
    }),
    [navigate, star, delay, starDelay, own],
  );

  // intercept internal links anywhere on the page
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || !isInternal(a)) return;
      e.preventDefault();
      api.go(routeOf(a.getAttribute("href")!));
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [api]);

  // back / forward: no exit, but enter without the loading screen (popstate fires before the router re-renders)
  useEffect(() => {
    const onPop = () => {
      const s = state.current;
      if (s.arriving) return;
      s.busy = true;
      s.arriving = true;
      s.startedAt = performance.now() - delay * 1000; // nothing is leaving: start as soon as ready
      s.starDue = 0;
      star.placeAtCentre();
      star.wait();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [star, delay]);

  return (
    <PageTransitionContext.Provider value={api}>
      <LeavingContext.Provider value={leaving}>{children}</LeavingContext.Provider>
      <div ref={starRef} className={styles.star} aria-hidden>
        <div ref={spinRef} className={styles.spinner}>
          <BrandStar style={{ width: "100%", height: "100%" }} />
        </div>
      </div>
    </PageTransitionContext.Provider>
  );
}
