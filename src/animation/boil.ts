export type BoilOptions = {
  /** How many different noise seeds to cycle through. */
  frames?: number;
  /** Seconds for one full cycle (each seed shows for duration / frames). */
  duration?: number;
  /** Distance between consecutive seeds (any number works; bigger = less related patterns). */
  seedStep?: number;
  /** Only boil these decay presets (e.g. ["heavy", "pencil"]); default: all. */
  levels?: string[];
};

/** Marker attribute on <feTurbulence> nodes that should boil; its value is the base seed. */
export const BOIL_ATTR = "data-boil-seed";

/**
 * "Line boil" idle animation: steps the seed of every tagged Perlin-noise generator through `frames` variants
 * per `duration`, so worn edges, specks and pencil grain shimmer like hand-drawn animation on twos.
 * Hard cuts, no interpolation. Returns a stop function that restores the base seeds.
 *
 * Every step re-renders the elements using those filters. To avoid one big hitch, a step is rolled out one
 * filter per animation frame (a few frames in total), so each element still boils at the requested rhythm.
 */
export function startDecayBoil(
  root: ParentNode = document,
  { frames = 4, duration = 1, seedStep = 101, levels }: BoilOptions = {},
) {
  const wanted = (n: SVGElement) => {
    if (!levels) return true;
    const id = n.closest("filter")?.id ?? "";
    return levels.some((l) => id === `bc-decay-${l}` || id === `bc-decay-${l}-svg`);
  };
  const nodes = () => Array.from(root.querySelectorAll<SVGElement>(`feTurbulence[${BOIL_ATTR}]`)).filter(wanted);
  const seed = (n: SVGElement, frame: number) => n.setAttribute("seed", String(Number(n.getAttribute(BOIL_ATTR)) + frame * seedStep));

  /** Group noise nodes by their <filter>, so one frame updates one filter (and only its users re-render). */
  const groups = () => {
    const map = new Map<Element | null, SVGElement[]>();
    for (const n of nodes()) {
      const f = n.closest("filter");
      map.set(f, [...(map.get(f) ?? []), n]);
    }
    return [...map.values()];
  };

  let frame = 0;
  let raf = 0;
  const step = () => {
    if (document.hidden) return;
    frame = (frame + 1) % Math.max(1, frames);
    const queue = groups();
    const next = () => {
      queue.shift()?.forEach((n) => seed(n, frame));
      if (queue.length) raf = requestAnimationFrame(next);
    };
    cancelAnimationFrame(raf);
    next();
  };
  const timer = window.setInterval(step, (duration * 1000) / Math.max(1, frames));

  return () => {
    window.clearInterval(timer);
    cancelAnimationFrame(raf);
    nodes().forEach((n) => seed(n, 0));
  };
}
