import { createContext, useContext } from "react";
import type { Location } from "react-router-dom";
import type { LoadProgress } from "./bakedIntro";
import type { StarFlightOptions } from "./starFlight";

export type PageTransition = {
  /** True while the current page is being entered through a transition (no loading screen). */
  arriving: () => boolean;
  /** Pages register how they leave; returns an unregister function. */
  registerExit: (exit: () => Promise<void>) => () => void;
  /**
   * Pages register their intro: whether it can be left yet (a nav click mid-intro), and how to finish it at once
   * (so the exit starts from the page fully in place). Returns an unregister function.
   */
  registerIntro: (intro: { canLeave: () => boolean; finish: () => void }) => () => void;
  /** Flies the travel star onto `anchor` (the arriving page's `[data-star-anchor]`). */
  flyStar: (anchor: Element, options?: StarFlightOptions) => gsap.core.Timeline;
  /** The arriving page took over: hide the travel star, end the transition. */
  landed: () => void;
  /** Navigate with an exit → star → entrance transition. */
  go: (href: string) => void;
  /**
   * performance.now() at which the arriving page's intro should start (the click + the transition delay).
   * Pages start then, or as soon as their assets are ready if that is later.
   */
  introAt: () => number;
  /**
   * Decodes every page's baked intro into the session cache (the first loading screen runs this, so transitions
   * never download or decode). Progress 0..1.
   */
  preload: (onProgress: LoadProgress) => Promise<void>;
};

export const PageTransitionContext = createContext<PageTransition | null>(null);

/** The transition API, or null outside a <PageTransitionProvider> (pages then fall back to the loading screen). */
export const usePageTransition = () => useContext(PageTransitionContext);

/** The location of the page that is leaving (still mounted, on top, playing its exit), if any. */
export const LeavingContext = createContext<Location | null>(null);
export const useLeavingLocation = () => useContext(LeavingContext);

