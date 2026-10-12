import type { BandVariant } from "../../components/blocks/blocks";
import { seeded } from "../../lib/random";
import type { FanartEntry } from "./fanartContent";

/** Everything about an entry's look that is generated, not authored (independent of where it is shown). */
export type EntryPlan = {
  entry: FanartEntry;
  /** Position in the full list (0-based) and its label "01", "02", … */
  index: number;
  number: string;
  variant: BandVariant;
  /** Where the artwork begins inside the item. */
  artLeft: number;
  numberAt: { x: number; y: number };
  /** Preferred left edge on the canvas (before keeping clear of the title). */
  left: number;
  /** Relative height weight (≈1). */
  weight: number;
  /** Handwritten note placement, as fractions of the item height for y. */
  note?: { x: number; y: number; size: number; rotate: number };
};

/** An entry placed in the visible window. */
export type PlacedItem = EntryPlan & { x: number; y: number; w: number; h: number; note?: { x: number; y: number; size: number; rotate: number } };

export type ListRegion = {
  /** Vertical span the list fills, and the gap between items. */
  top: number;
  bottom: number;
  gap: number;
  /** Items never get shorter than this: the window shows as many as fit. */
  minHeight: number;
  /** Right edge every item ends at. */
  right: number;
  /** Left edges: plate items reach further left; paper items sit further right. */
  plateLeft: [number, number];
  paperLeft: [number, number];
  /** Items crossing this vertical band start at least at `minLeft` (keeps them clear of the page title). */
  avoid?: { top: number; bottom: number; minLeft: number };
};

export const NUMBER_SIZE = 62;

/**
 * Per-entry look, from its seed and index: variant (seeded, never three in a row), art start, number position,
 * preferred left edge, height weight and note placement. Authored data is only the content.
 */
export function planEntries(entries: FanartEntry[], region: ListRegion): EntryPlan[] {
  const variants: BandVariant[] = [];
  return entries.map((entry, i) => {
    const rand = seeded(entry.seed * 101 + i * 7 + 3);
    const r = (a: number, b: number) => a + (b - a) * rand();

    let variant: BandVariant = entry.variant ?? (rand() < 0.5 ? "paper" : "plate");
    if (!entry.variant && i >= 2 && variants[i - 1] === variant && variants[i - 2] === variant) variant = variant === "paper" ? "plate" : "paper";
    variants.push(variant);

    const hasNote = !!entry.note?.length;
    const artLeft = Math.round(variant === "plate" ? r(120, 146) : hasNote && !entry.subtitle ? r(232, 262) : r(146, 176));
    const numberAt =
      variant === "plate" ? { x: Math.round(r(34, 46)), y: Math.round(r(16, 28)) } : { x: Math.round(r(4, 22)), y: Math.round(r(14, 28)) };
    const left = Math.round(variant === "plate" ? r(...region.plateLeft) : r(...region.paperLeft));
    const weight = 1 + (rand() - 0.5) * 0.12;

    let note: EntryPlan["note"];
    if (hasNote) {
      const size = Math.round(r(23, 28));
      const rotate = Math.round(r(-17, -9));
      note =
        variant === "plate"
          ? { x: artLeft + Math.round(r(40, 90)), y: r(0.42, 0.55), size, rotate }
          : entry.subtitle
            ? { x: numberAt.x + Math.round(r(66, 80)), y: r(0.4, 0.5), size, rotate }
            : { x: numberAt.x + Math.round(r(40, 56)), y: r(0.38, 0.46), size, rotate };
    }
    return { entry, index: i, number: String(i + 1).padStart(2, "0"), variant, artLeft, numberAt, left, weight, note };
  });
}

/** How many items the window shows. */
export const windowSize = (region: ListRegion, total: number) =>
  Math.min(total, Math.max(1, Math.floor((region.bottom - region.top + region.gap) / (region.minHeight + region.gap))));

/**
 * The visible window: `size` consecutive entries starting at `start` (wrapping around the list), stacked to fill
 * `region` (heights from the entries' weights, total preserved).
 */
export function placeWindow(plans: EntryPlan[], start: number, region: ListRegion): PlacedItem[] {
  const n = plans.length;
  if (!n) return [];
  const size = windowSize(region, n);
  const shown = Array.from({ length: size }, (_, k) => plans[(((start + k) % n) + n) % n]);
  const span = region.bottom - region.top - region.gap * (size - 1);
  const sum = shown.reduce((a, p) => a + p.weight, 0);
  const heights = shown.map((p) => Math.round((p.weight / sum) * span));
  heights[size - 1] += span - heights.reduce((a, b) => a + b, 0);

  let y = region.top;
  return shown.map((p, k) => {
    const h = heights[k];
    const a = region.avoid;
    const x = a && y < a.bottom && y + h > a.top ? Math.max(p.left, a.minLeft) : p.left;
    const item: PlacedItem = { ...p, x, y, w: region.right - x, h, note: p.note && { ...p.note, y: Math.round(p.note.y * h) } };
    y += h + region.gap;
    return item;
  });
}
