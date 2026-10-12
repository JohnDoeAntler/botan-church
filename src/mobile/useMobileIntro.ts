import gsap from "gsap";
import { useLayoutEffect, type RefObject } from "react";
import { prefersReducedMotion, waitForAssets } from "../animation/waitForAssets";

/**
 * The mobile entrance, deliberately light (phones have less to spare): once the page's fonts and images are
 * ready, the animated parts on the first screen fade up into place, top to bottom, in under a second. One
 * opacity + translate tween per part (no canvas, no per-letter splitting, no filters re-run); parts below the
 * fold are simply there when scrolled to.
 */
export function useMobileIntro(scope: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = scope.current;
    if (!root || prefersReducedMotion()) return;
    const parts = Array.from(root.querySelectorAll<HTMLElement>("[data-anim]")).filter((el) => !el.parentElement?.closest("[data-anim]"));
    const firstScreen = parts
      .map((el) => ({ el, top: el.getBoundingClientRect().top }))
      .filter((p) => p.top < window.innerHeight)
      .sort((a, b) => a.top - b.top)
      .map((p) => p.el);
    gsap.set(firstScreen, { opacity: 0, y: 14 });
    let alive = true;
    void waitForAssets(root, 2500).then(() => {
      if (!alive) return;
      gsap.to(firstScreen, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: { amount: 0.45 }, clearProps: "opacity,transform" });
    });
    return () => {
      alive = false;
      gsap.killTweensOf(firstScreen);
      gsap.set(firstScreen, { clearProps: "opacity,transform" });
    };
  }, [scope]);
}
