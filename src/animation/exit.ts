import gsap from "gsap";
import { staggerTime } from "./sweep";
import { canvasUnits, diagonalOrder, textUnits } from "./units";

export type FlickerOutOptions = {
  /** Seconds over which units start leaving, along the "/" diagonal. */
  spread?: number;
  /** Hard visibility cuts (s) per unit, alternating hide / show, ending hidden. */
  cuts?: number[];
  /** Which units: everything, or shapes only (when text leaves by other means). */
  units?: "all" | "shapes";
};

/**
 * Default page exit: every animated unit (`[data-anim]` shapes and text) flickers out with hard cuts, staggered
 * along the same "/" diagonal the page enters on. Visibility toggles only (no repaints of filters or clips), so it is
 * cheap in every browser. Resolves when everything is hidden.
 */
export function flickerOut(
  root: Element,
  { spread = 0.35, cuts = [0, 1 / 24, 2 / 24, 3 / 24, 4 / 24], units: which = "all" }: FlickerOutOptions = {},
) {
  const units = which === "shapes" ? canvasUnits(root) : [...canvasUnits(root), ...textUnits(root)];
  const tl = gsap.timeline();
  diagonalOrder(units).forEach((i, rank) => {
    const t = staggerTime(rank, units.length, { amount: spread, ease: "none" });
    cuts.forEach((at, k) => tl.set(units[i], { autoAlpha: k % 2 === 0 ? 0 : 1 }, t + at));
  });
  return new Promise<void>((resolve) => tl.eventCallback("onComplete", () => resolve()));
}
