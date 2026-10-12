import { DESIGN_SIZE } from "../hero/heroContent";

/**
 * Design px the viewport has beyond the composition's width: the Stage scales the design to fit, so on screens
 * wider than 1672:941 this much room is left over, which list / carousel pages grow into.
 */
export function spareWidth(w = window.innerWidth, h = window.innerHeight) {
  const unit = Math.min(w / DESIGN_SIZE.width, h / DESIGN_SIZE.height);
  return Math.max(0, Math.round(w / unit - DESIGN_SIZE.width));
}

/** Pages whose layout depends on the spare width are baked at these spare widths (scripts/bake-intro.mjs). */
export const BAKE_SPARE = { step: 60, max: 600 };

/** Baked intro of `page` closest to a spare width: public/intro/<page>-<spare>/ (leftover stretch under 2 %). */
export const bakeBucket = (page: string, spare = spareWidth()) =>
  `${page}-${Math.min(BAKE_SPARE.max, Math.round(spare / BAKE_SPARE.step) * BAKE_SPARE.step)}`;
