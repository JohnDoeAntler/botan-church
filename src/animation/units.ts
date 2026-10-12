/**
 * What the intro animates, and how:
 *   - text units (labels, Japanese copy, notes, nav, "01", the title): per-character rise in the live DOM;
 *   - everything else with `[data-anim]`: drawn on the intro canvas from baked bitmaps
 *     (panels flicker + zoom, the main character sweeps + slides, the rest sweeps).
 * The bake script and the runtime use `canvasUnits()` in DOM order, so index i means the same element in both.
 */
const TEXT_KINDS = ["text", "vtext", "number", "note", "nav", "title"];

export const TEXT_UNITS = TEXT_KINDS.map((k) => `[data-anim="${k}"]`).join(", ");
export const CANVAS_UNITS = `[data-anim]${TEXT_KINDS.map((k) => `:not([data-anim="${k}"])`).join("")}`;

export type Unit = HTMLElement | SVGElement;

export const canvasUnits = (root: Element) => Array.from(root.querySelectorAll<Unit>(CANVAS_UNITS));
export const textUnits = (root: Element) => Array.from(root.querySelectorAll<HTMLElement>(TEXT_UNITS));

export type UnitKind = "image" | "hero" | "sweep";

/** Panels flicker + zoom, the main character sweeps + slides, everything else sweeps. */
export const kindOf = (el: Element): UnitKind => {
  const anim = el.getAttribute("data-anim");
  return anim === "panel" ? "image" : anim === "character" ? "hero" : "sweep";
};

/** z-index of the unit's top-level wrapper directly under `root` (auto → 0). */
function stackLevel(root: Element, el: Element) {
  let node: Element | null = el;
  while (node && node.parentElement !== root) node = node.parentElement;
  const z = node ? Number.parseInt(getComputedStyle(node).zIndex, 10) : 0;
  return Number.isNaN(z) ? 0 : z;
}

/** Units sorted back → front the way the browser paints them (stack level, then DOM order). */
export function paintOrder(root: Element, units: Unit[]) {
  return units
    .map((el, i) => ({ el, i, z: stackLevel(root, el) }))
    .sort((a, b) => a.z - b.z || a.i - b.i)
    .map((u) => u.i);
}

/** Units sorted along the "/" diagonal (top-left first): the stagger order of the intro. */
export function diagonalOrder(units: Element[]) {
  return units
    .map((el, i) => ({ i, r: el.getBoundingClientRect() }))
    .sort((a, b) => a.r.left + a.r.top - (b.r.left + b.r.top))
    .map((u) => u.i);
}
