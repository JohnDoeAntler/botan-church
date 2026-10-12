import type { BlockArtLayout } from "../../components";
import type { Spark } from "../../components";
import { seeded } from "../../lib/random";

type Box = { x: number; y: number; w: number; h: number };

/** A teal dot field: `cols` × `rows` dots `pitch` apart from (x, y). */
const dots = (x: number, y: number, cols: number, rows: number, pitch = 11, size = 1.8): Spark[] =>
  Array.from({ length: cols * rows }, (_, k) => ({ x: x + (k % cols) * pitch, y: y + Math.floor(k / cols) * pitch, size, kind: "dot", tone: "teal" }));

/** A teal slash at 45°, from (x, y) up to the right: the only diagonal the print uses. */
const slash = (x: number, y: number, len: number, width = 1.2) => ({ x1: x, y1: y, x2: x + len, y2: y - len, tone: "teal" as const, width });

/**
 * The print collage of the left half, in page design px (as in the reference): each cluster is its own animated
 * unit (`box` is what it draws; keep shapes inside it, since only the box is baked).
 */
export const COLLAGE: Array<{ box: Box; layout: BlockArtLayout }> = [
  // above the title: halftone squares, the ink / teal columns, the teal dome, the striped block on the right
  {
    box: { x: 140, y: 56, w: 560, h: 340 },
    layout: {
      blocks: [
        { x: 170, y: 82, w: 92, h: 56, fill: "grayDots" },
        { x: 385, y: 80, w: 46, h: 58, fill: "darkDots", fade: "down" },
        { x: 482, y: 74, w: 44, h: 42, fill: "grayDots" },
        { x: 155, y: 210, w: 94, h: 66, fill: "tealDots", fade: "left" },
        // ink column, and the teal / halftone column beside it
        { x: 253, y: 186, w: 47, h: 176, fill: "ink" },
        { x: 300, y: 136, w: 48, h: 52, fill: "teal" },
        { x: 300, y: 188, w: 48, h: 64, fill: "tealDots" },
        { x: 300, y: 252, w: 48, h: 86, fill: "tealLight" },
        { x: 300, y: 338, w: 48, h: 26, fill: "grayDots" },
        { x: 300, y: 364, w: 48, h: 18, fill: "teal" },
        // the dome's base
        { x: 318, y: 312, w: 186, h: 70, fill: "teal" },
        { x: 318, y: 260, w: 30, h: 60, fill: "grayDots" },
        // the striped block on the right: light dots, dark dots, an ink strip
        { x: 458, y: 186, w: 46, h: 114, fill: "grayDots" },
        { x: 504, y: 186, w: 44, h: 114, fill: "darkDots" },
        { x: 548, y: 186, w: 30, h: 114, fill: "ink" },
        { x: 584, y: 186, w: 3, h: 114, fill: "ink" },
      ],
      discs: [{ cx: 411, cy: 330, r: 94, fill: "teal", half: "top" }],
      hairs: [
        slash(232, 266, 176, 1.3),
        slash(246, 296, 200, 1),
        slash(296, 300, 120, 1),
        slash(392, 168, 70, 1),
      ],
      sparks: [...dots(566, 52, 10, 6), ...dots(520, 312, 7, 6, 11, 1.5), ...dots(158, 284, 7, 3, 11, 1.4)],
    },
  },
  // left edge, behind the title's first letter
  {
    box: { x: 22, y: 462, w: 110, h: 130 },
    layout: {
      blocks: [
        { x: 30, y: 470, w: 24, h: 112, fill: "ink" },
        { x: 54, y: 474, w: 20, h: 70, fill: "grayDots", fade: "down" },
        { x: 50, y: 576, w: 74, h: 9, fill: "teal" },
      ],
    },
  },
  // halftone over the thank-you note
  { box: { x: 112, y: 580, w: 110, h: 66 }, layout: { blocks: [{ x: 120, y: 585, w: 95, h: 56, fill: "grayDots", fade: "down" }] } },
  // bottom right of the left half: the tall teal column, the teal "D", halftones, slashes
  {
    box: { x: 320, y: 500, w: 380, h: 380 },
    layout: {
      blocks: [
        { x: 410, y: 576, w: 70, h: 34, fill: "darkDots" },
        { x: 518, y: 655, w: 80, h: 46, fill: "grayDots" },
        { x: 597, y: 575, w: 48, h: 112, fill: "teal" },
        { x: 597, y: 687, w: 48, h: 34, fill: "tealLight" },
        { x: 467, y: 766, w: 26, h: 36, fill: "teal" },
        { x: 467, y: 802, w: 80, h: 64, fill: "grayDots" },
        { x: 602, y: 760, w: 68, h: 100, fill: "grayDots", fade: "right" },
        { x: 672, y: 766, w: 20, h: 96, fill: "darkDots" },
      ],
      discs: [{ cx: 600, cy: 797, r: 69, fill: "teal", half: "left" }],
      hairs: [slash(545, 650, 140), slash(332, 846, 112), slash(352, 610, 36, 1)],
      sparks: [...dots(398, 818, 7, 5, 10, 1.5), ...dots(612, 726, 6, 3, 10, 1.4)],
    },
  },
  // dot field by the barcode
  { box: { x: 200, y: 785, w: 70, h: 70 }, layout: { sparks: dots(208, 792, 5, 5, 11, 1.5) } },
];

/**
 * Print decoration over one art panel (`w` × `h`, panel-local design px), seeded per entry: a teal corner block,
 * a dark halftone / ink strip and teal blocks near the right edge, a teal block low on the left, white halftone
 * patches on the art and a teal slash. Everything stays inside the panel.
 */
export function panelDecor(seed: number, w: number, h: number): BlockArtLayout {
  const rand = seeded(seed * 41 + 3);
  const r = (a: number, b: number) => a + (b - a) * rand();
  const chance = (p: number) => rand() < p;
  const out: Required<Pick<BlockArtLayout, "blocks" | "hairs" | "sparks">> = { blocks: [], hairs: [], sparks: [] };

  const c = r(34, 50);
  out.blocks.push({ x: 0, y: 0, w: c, h: c * r(0.8, 1.1), fill: chance(0.6) ? "teal" : "tealDots" });
  if (chance(0.6)) out.blocks.push({ x: 0, y: c, w: r(14, 24), h: h * r(0.25, 0.5), fill: "darkDots", fade: "down" });

  const sx = w - r(60, 240);
  out.blocks.push({ x: sx, y: 0, w: r(16, 34), h: h * r(0.45, 0.9), fill: chance(0.5) ? "darkDots" : "ink" });
  const tw = r(36, 60);
  out.blocks.push({ x: w - tw - r(0, 40), y: r(0, h * 0.2), w: tw, h: r(30, 46), fill: "teal" });
  out.blocks.push({ x: w - r(30, 60), y: h * r(0.45, 0.65), w: r(30, 60), h: r(30, 50), fill: chance(0.5) ? "tealLight" : "tealDots" });
  if (chance(0.6)) out.blocks.push({ x: sx - r(80, 160), y: h * r(0.55, 0.75), w: r(50, 80), h: h - h * 0.75, fill: "teal" });

  out.blocks.push({ x: r(120, 220), y: h - r(50, 70), w: r(36, 50), h: r(44, 60), fill: chance(0.5) ? "teal" : "tealDots" });
  for (let k = 0; k < 2; k++) out.blocks.push({ x: r(w * 0.3, w * 0.8), y: r(10, h - 50), w: r(26, 44), h: r(20, 34), fill: "whiteDots" });

  const x0 = r(w * 0.05, w * 0.3);
  out.hairs.push(slash(x0, h - 6, r(70, 110), 1.4));
  out.sparks.push({ x: r(w * 0.55, w * 0.85), y: r(20, h * 0.5), size: r(7, 11), kind: "star", tone: "paper" });
  return out;
}
