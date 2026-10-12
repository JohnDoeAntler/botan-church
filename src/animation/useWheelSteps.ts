import { useEffect, useRef, type RefObject } from "react";

/**
 * Wheel → whole steps: one step per wheel event at most (a notch is one step however far the OS scrolls), while
 * small high-precision deltas (trackpads) add up until they make a step. `horizontal`: sideways scrolling counts
 * too. Calls `onStep(±1)`; the page never scrolls.
 */
export function useWheelSteps(target: RefObject<HTMLElement | null>, onStep: (dir: 1 | -1) => void, { horizontal = false, threshold = 60 } = {}) {
  const stepRef = useRef(onStep);
  useEffect(() => {
    stepRef.current = onStep;
  });
  useEffect(() => {
    const el = target.current;
    if (!el) return;
    let acc = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const d = horizontal && Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!d) return;
      const px = e.deltaMode === 0 ? d : d * 40; // lines / pages → px
      if (Math.sign(px) !== Math.sign(acc)) acc = 0; // a change of direction starts fresh
      acc += px;
      if (Math.abs(acc) < threshold) return;
      acc = 0;
      stepRef.current(px > 0 ? 1 : -1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [target, horizontal, threshold]);
}

/** ← / → (and, with `vertical`, ↑ / ↓) as steps. */
export function useArrowKeySteps(onStep: (dir: 1 | -1) => void, { vertical = false } = {}) {
  const stepRef = useRef(onStep);
  useEffect(() => {
    stepRef.current = onStep;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || (vertical && e.key === "ArrowDown")) stepRef.current(1);
      if (e.key === "ArrowLeft" || (vertical && e.key === "ArrowUp")) stepRef.current(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [vertical]);
}
