import { seeded } from "../../lib/random";

export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Fills (each rendered with its texture by <BlockBand>):
 *   teal / tealLight   worn solid teal, light teal        tealDots   teal halftone on paper
 *   ink                speckled black                     inkDots    black with a dark halftone
 *   inkTeal            black with a teal halftone         grayDots   grey halftone on paper
 *   whiteDots          white halftone over the artwork    darkDots   dark halftone over art / paper
 *   lightDots          pale halftone over black
 */
export type BlockFill = "teal" | "tealLight" | "tealDots" | "ink" | "inkDots" | "inkTeal" | "grayDots" | "whiteDots" | "darkDots" | "lightDots";

export type Block = Rect & { fill: BlockFill; fade?: "down" | "up" | "right" | "left" };
export type Hair = { x1: number; y1: number; x2: number; y2: number; tone: "paper" | "teal" | "ink"; width: number };
export type Spark = { x: number; y: number; size: number; kind: "star" | "plus" | "dot"; tone: "paper" | "teal" | "ink" };
/** A circle: solid worn teal, teal halftone, or a thin teal outline. */
/** `half`: only that half of the circle (e.g. "top" = a dome, "left" = a "D" facing left). */
export type Disc = { cx: number; cy: number; r: number; fill: "teal" | "tealDots" | "outline"; half?: "top" | "bottom" | "left" | "right" };

export type BandLayout = { blocks: Block[]; hairs: Hair[]; sparks: Spark[] };

export type BandVariant = "plate" | "paper";

type Rng = { r: (a: number, b: number) => number; chance: (p: number) => boolean; pick: <T>(xs: readonly T[]) => T };

function rng(seed: number): Rng {
  const rand = seeded(seed);
  return { r: (a, b) => a + (b - a) * rand(), chance: (p) => rand() < p, pick: (xs) => xs[Math.floor(rand() * xs.length)] };
}

export type LeftOptions = {
  seed: number;
  height: number;
  /** Where the artwork begins (item-local x). Everything before it is the left zone. */
  artLeft: number;
  /** plate: black halftone plate with a teal stack under it; paper: number straight on the paper. */
  variant: BandVariant;
  /** Right edge of the number (paper variant): marks next to it start after this. */
  numberRight?: number;
  /** The number's box (paper variant): motifs keep clear of it, except a backdrop meant to sit behind it. */
  numberBox?: Rect;
};

/**
 * Paper left zone (width `A`, number in `nb`): two or three motifs with mass, so no two items read the same, then
 * a few small accents. Same vocabulary as the plate (teal stacks, halftones, hairlines, stars), lighter on the paper.
 *   mass    stack     teal blocks stacked along the bottom (solid + halftone + light), like the plate's stack
 *           backdrop  a halftone patch printed behind the number
 *           column    a tall halftone column between the number and the art, capped with solid teal
 *           bleed     teal blocks straddling the art's edge (top or bottom), a white halftone on the art next to it
 *   accents teal underline running into the art, ink rule, crosshair, teal dot grid, ink tick + dots, stars,
 *           a small teal square, the grey halftone along the art's edge, a teal halftone strip off the left edge
 */
function paperMotifs(g: Rng, out: BandLayout, h: number, A: number, nb: Rect) {
  const below = nb.y + nb.h; // first free y under the number
  const right = nb.x + nb.w; // first free x right of the number
  const room = A - right - 10; // free width between the number and the art

  const masses = ["stack", "backdrop", "column", "bleed"] as const;
  // two motifs with mass (three, sometimes), never both of the same kind
  const first = g.pick(masses);
  const chosen = new Set<(typeof masses)[number]>([first]);
  chosen.add(g.pick(masses.filter((m) => m !== first)));
  if (g.chance(0.3)) chosen.add(g.pick(masses.filter((m) => !chosen.has(m))));
  if (chosen.has("column") && room < 26) chosen.delete("column");
  // always one solid-teal anchor, or halftone-only items read too light next to the plates
  if (!chosen.has("stack") && !chosen.has("bleed")) chosen.add(g.chance(0.6) ? "stack" : "bleed");

  if (chosen.has("stack")) {
    const sh = Math.round(h * g.r(0.3, 0.5));
    const x0 = Math.round(g.r(-14, A * 0.08));
    const total = (A - x0) * g.r(0.65, 1.05);
    const fills = g.pick([
      ["teal", "tealDots"],
      ["tealDots", "teal", "tealLight"],
      ["teal", "tealLight"],
      ["tealLight", "teal", "tealDots"],
    ] as const);
    let x = x0;
    fills.forEach((fill, k) => {
      const w = k === fills.length - 1 ? x0 + total - x : total * g.r(0.3, 0.5);
      const lift = k === 0 ? 0 : Math.round(g.r(-sh * 0.35, sh * 0.2)); // uneven tops
      out.blocks.push({ x, y: h - sh - lift, w, h: sh + lift, fill, fade: fill === "tealDots" ? "up" : undefined });
      x += w;
    });
    if (g.chance(0.5)) out.sparks.push({ x: x0 + total + g.r(8, 18), y: h - sh - g.r(6, 14), size: g.r(5, 7), kind: "star", tone: "teal" });
  }

  if (chosen.has("backdrop")) {
    out.blocks.push({
      x: nb.x + g.r(-16, nb.w * 0.3),
      y: nb.y + g.r(-14, nb.h * 0.25),
      w: nb.w * g.r(1, 1.5),
      h: nb.h * g.r(1.4, 2.2),
      fill: g.pick(["grayDots", "grayDots", "tealDots"] as const),
      fade: g.pick(["down", "right", "left", undefined] as const),
    });
  }

  if (chosen.has("column")) {
    const w = Math.min(room - 4, g.r(22, 40));
    const x = right + 6 + g.r(0, Math.max(0, room - w - 6));
    const top = g.r(-4, h * 0.2);
    out.blocks.push({ x, y: top, w, h: h - top, fill: g.pick(["grayDots", "tealDots"] as const), fade: "up" });
    const capH = g.r(16, 34);
    out.blocks.push({ x, y: g.chance(0.5) ? top : h - capH, w, h: capH, fill: g.pick(["teal", "tealLight"] as const) });
  }

  if (chosen.has("bleed")) {
    const atTop = g.chance(0.4);
    const bw = g.r(44, 80);
    const bh = g.r(34, 60);
    const x = A - bw * g.r(0.45, 0.75);
    const y = atTop ? g.r(-4, 6) : h - bh + g.r(0, 4);
    out.blocks.push({ x, y, w: bw, h: bh, fill: g.pick(["teal", "teal", "tealDots"] as const) });
    out.blocks.push({ x: x - bw * 0.35, y: atTop ? y + bh : y - bh * 0.55, w: bw * 0.55, h: bh * 0.55, fill: "tealLight" });
    if (g.chance(0.7)) {
      out.blocks.push({ x: x + bw + g.r(8, 30), y: atTop ? g.r(10, h * 0.25) : h * g.r(0.5, 0.65), w: g.r(24, 40), h: g.r(18, 30), fill: "whiteDots" });
    }
  }

  // accents: 3–5 of these, drawn from a seeded shuffle
  const accents: Array<() => void> = [
    () => {
      // teal underline from under the number into the art
      const y = Math.min(h - 12, below + g.r(10, 34));
      out.hairs.push({ x1: g.r(-12, 4), y1: y, x2: A + g.r(80, 220), y2: y, tone: "teal", width: 1.2 });
    },
    () => {
      // thin ink rule, vertical, between the number and the art
      if (room < 12) return;
      const x = right + g.r(4, room);
      out.hairs.push({ x1: x, y1: g.r(-6, h * 0.15), x2: x, y2: g.r(h * 0.6, h + 6), tone: "ink", width: 0.8 });
    },
    () => {
      // crosshair: a plus where a short ink rule crosses
      const cx = g.r(nb.x, A - 16);
      const cy = g.r(below + 14, h - 18);
      out.hairs.push({ x1: cx - g.r(18, 40), y1: cy, x2: cx + g.r(18, 40), y2: cy, tone: "ink", width: 0.8 });
      out.sparks.push({ x: cx, y: cy, size: 6, kind: "plus", tone: "ink" });
    },
    () => {
      // teal dot grid in the empty space under the number
      const cols = Math.round(g.r(3, 5));
      const rows = Math.round(g.r(2, 4));
      const x0 = g.r(nb.x, Math.max(nb.x, A - cols * 12 - 10));
      const y0 = g.r(below + 12, Math.max(below + 12, h - rows * 12 - 12));
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) out.sparks.push({ x: x0 + i * 12, y: y0 + j * 12, size: 1.8, kind: "dot", tone: "teal" });
    },
    () => {
      // ink tick + teal dots right of the number (the original mark)
      if (room < 64) return;
      const x = right + g.r(8, 14);
      out.blocks.push({ x, y: g.r(6, 14), w: 5, h: g.r(40, 60), fill: "ink" });
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) out.sparks.push({ x: x + 18 + i * 12, y: 18 + j * 12, size: 1.8, kind: "dot", tone: "teal" });
    },
    () => out.sparks.push({ x: g.r(nb.x + 8, A - 8), y: g.r(below + 10, h - 14), size: g.r(6, 11), kind: "star", tone: g.pick(["ink", "teal"] as const) }),
    () => {
      const s = g.r(8, 14);
      out.blocks.push({ x: g.r(nb.x, A - s - 6), y: g.r(below + 8, h - s - 8), w: s, h: s, fill: "teal" });
    },
    () => {
      // grey halftone hugging the artwork's edge
      const w = g.r(30, 52);
      out.blocks.push({ x: A - w + g.r(4, 14), y: g.chance(0.5) ? 0 : h * g.r(0.2, 0.4), w, h: h * g.r(0.5, 0.85), fill: "grayDots", fade: g.pick(["down", "up"] as const) });
    },
    () => out.blocks.push({ x: -g.r(14, 26), y: g.r(0, h * 0.2), w: g.r(20, 30), h: h * g.r(0.5, 0.8), fill: "tealDots", fade: "down" }),
  ];
  for (let i = accents.length - 1; i > 0; i--) {
    const j = Math.floor(g.r(0, i + 1));
    [accents[i], accents[j]] = [accents[j], accents[i]];
  }
  accents.slice(0, Math.round(g.r(3, 5.49))).forEach((add) => add());
  if (g.chance(0.5)) out.sparks.push({ x: A - g.r(10, 40), y: h * g.r(0.08, 0.22), size: 7, kind: "plus", tone: "ink" });
}

/** The left zone of a band, plus the hairlines / stars that cross into the artwork. All rectangles. */
export function leftBlocks({ seed, height: h, artLeft: A, variant, numberRight = 0, numberBox }: LeftOptions): BandLayout & { plate: Rect | null } {
  const g = rng(seed * 31 + 7);
  const out: BandLayout = { blocks: [], hairs: [], sparks: [] };

  if (variant === "plate") {
    const strip = g.chance(0.6) ? Math.round(g.r(22, 32)) : 0;
    if (strip) out.blocks.push({ x: 0, y: 0, w: strip, h, fill: g.pick(["tealDots", "teal"] as const), fade: "down" });
    const plate = { x: strip, y: 0, w: A - strip, h: Math.round(h * g.r(0.56, 0.72)) };
    out.blocks.push({ ...plate, fill: "inkDots" });

    // teal stack under the plate
    const stackW = Math.round(plate.w * g.r(0.5, 0.78));
    const below = h - plate.h;
    out.blocks.push({ x: plate.x, y: plate.y + plate.h, w: stackW, h: below, fill: g.pick(["teal", "tealDots"] as const) });
    out.blocks.push({ x: plate.x + stackW, y: plate.y + plate.h, w: plate.w - stackW, h: below, fill: g.pick(["tealLight", "ink", "tealDots"] as const) });
    if (g.chance(0.5)) out.blocks.push({ x: plate.x, y: plate.y + plate.h - below * 0.35, w: stackW * 0.6, h: below * 0.35, fill: "tealLight" });

    // dark teal-dot block on the artwork, against the plate
    if (g.chance(0.7)) out.blocks.push({ x: A, y: 0, w: g.r(70, 120), h: h * g.r(0.3, 0.42), fill: "inkTeal" });

    // hairlines: one horizontal through the plate into the art, one vertical on the art
    const hy = plate.h - g.r(12, 30);
    out.hairs.push({ x1: -18, y1: hy, x2: A + g.r(130, 300), y2: hy, tone: "paper", width: 1 });
    const vx = A + g.r(110, 220);
    out.hairs.push({ x1: vx, y1: -6, x2: vx, y2: h + 6, tone: "paper", width: 1 });
    if (g.chance(0.6)) out.hairs.push({ x1: A, y1: h * g.r(0.78, 0.9), x2: A + g.r(220, 360), y2: h * 0.84, tone: "paper", width: 0.9 });
    out.sparks.push({ x: plate.x + plate.w * g.r(0.55, 0.8), y: hy, size: 9, kind: "star", tone: "paper" });
    if (g.chance(0.7)) out.sparks.push({ x: A + g.r(80, 200), y: h * g.r(0.3, 0.55), size: g.r(16, 26), kind: "star", tone: "paper" });
    if (g.chance(0.5)) out.blocks.push({ x: A + g.r(140, 240), y: h * g.r(0.15, 0.35), w: g.r(26, 44), h: g.r(20, 34), fill: "whiteDots" });
    return { ...out, plate };
  }

  // paper: the number printed straight on the paper, dressed with seeded motifs (see paperMotifs)
  paperMotifs(g, out, h, A, numberBox ?? { x: 10, y: 20, w: Math.max(0, numberRight - 10), h: 50 });
  return { ...out, plate: null };
}

/**
 * Decoration on the hard vertical boundary at `x` where the artwork meets the black info card (card on the
 * right). All rectangles: a dark halftone strip on the art fading away from the edge, a pale halftone strip just
 * inside the card, teal blocks straddling the edge (top, bottom, sometimes middle), sometimes a teal hairline /
 * dots, one small teal mark.
 */
export function cardSeam({ seed, height: h, card: x }: { seed: number; height: number; card: number }): BandLayout {
  const g = rng(seed * 17 + 11);
  const out: BandLayout = { blocks: [], hairs: [], sparks: [] };

  const dw = g.r(26, 46);
  const dy = g.r(-2, h * 0.35);
  out.blocks.push({ x: x - dw, y: dy, w: dw, h: Math.min(h - dy, g.r(h * 0.45, h)), fill: "darkDots", fade: "left" });
  if (g.chance(0.7)) {
    const ly = g.r(h * 0.3, h * 0.7);
    out.blocks.push({ x, y: ly, w: g.r(14, 26), h: h - ly, fill: "lightDots", fade: "right" });
  }

  const tw = g.r(10, 18);
  out.blocks.push({ x: x - tw * g.r(0.3, 0.7), y: g.r(-4, h * 0.12), w: tw, h: g.r(28, 60), fill: g.pick(["teal", "teal", "tealLight"] as const) });
  const bw = g.r(14, 28);
  const bh = g.r(26, 56);
  out.blocks.push({ x: x - bw * g.r(0.2, 0.8), y: h - bh + g.r(0, 6), w: bw, h: bh, fill: g.pick(["teal", "tealLight", "tealDots"] as const) });
  if (g.chance(0.45)) {
    const s = g.r(8, 14);
    out.blocks.push({ x: x - g.r(4, 16) - s, y: g.r(h * 0.35, h * 0.6), w: s, h: s, fill: "teal" });
  }

  if (g.chance(0.5)) {
    const hx = x - g.r(6, 14);
    out.hairs.push({ x1: hx, y1: g.r(-2, h * 0.2), x2: hx, y2: g.r(h * 0.6, h + 2), tone: "teal", width: 1 });
  }
  out.sparks.push({ x: x - g.r(18, 44), y: g.r(h * 0.08, h * 0.25), size: g.r(5, 8), kind: g.pick(["star", "plus"] as const), tone: "teal" });
  if (g.chance(0.5)) for (let i = 0; i < 4; i++) out.sparks.push({ x: x - g.r(28, 40), y: h * 0.45 + i * 12, size: 1.8, kind: "dot", tone: "teal" });
  return out;
}

export function bandLayout(o: LeftOptions & { card: number }) {
  const left = leftBlocks(o);
  const seamL = cardSeam({ seed: o.seed, height: o.height, card: o.card });
  return {
    blocks: [...left.blocks, ...seamL.blocks],
    hairs: [...left.hairs, ...seamL.hairs],
    sparks: [...left.sparks, ...seamL.sparks],
    plate: left.plate,
  };
}
