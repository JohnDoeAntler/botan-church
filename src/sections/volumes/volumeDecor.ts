import type { BandLayout, Disc } from "../../components/blocks/blocks";
import { seeded } from "../../lib/random";

export type VolumeDecor = BandLayout & { discs: Disc[] };

/**
 * Print decoration around one volume's cover (item-local design px; the cover is `w` × `h` at 0,0, spine
 * included), drawn behind it so the shapes peek out from its edges. Seeded: same seed, same decoration.
 *   mass     2–3 of: a worn teal disc behind a top corner, a teal block behind the left edge, a teal stack behind
 *            the bottom right, a halftone patch behind the top, a light teal slab under the bottom
 *   accents  2–4 of: teal slashes across a corner, a teal dot row above the cover, an ink star off a corner,
 *            a thin teal ring, a grey halftone strip down the left edge
 */
export function volumeDecor(seed: number, w: number, h: number): VolumeDecor {
  const rand = seeded(seed * 53 + 19);
  const r = (a: number, b: number) => a + (b - a) * rand();
  const chance = (p: number) => rand() < p;
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
  const out: VolumeDecor = { blocks: [], hairs: [], sparks: [], discs: [] };

  const masses: Array<() => void> = [
    () => {
      const left = chance(0.6);
      out.discs.push({ cx: left ? r(-10, 50) : w - r(10, 60), cy: r(-20, 40), r: r(46, 78), fill: pick(["teal", "teal", "tealDots"] as const) });
    },
    () => {
      const bh = r(70, 150);
      out.blocks.push({ x: -r(22, 40), y: r(h * 0.25, h * 0.6), w: r(30, 52), h: bh, fill: pick(["teal", "tealDots"] as const) });
      if (chance(0.5)) out.blocks.push({ x: -r(30, 46), y: r(h * 0.6, h * 0.8), w: r(18, 28), h: r(40, 70), fill: "tealLight" });
    },
    () => {
      const sw = r(40, 70);
      const sh = r(60, 120);
      out.blocks.push({ x: w - sw * r(0.3, 0.6), y: h - sh + r(10, 30), w: sw, h: sh, fill: pick(["teal", "tealDots"] as const) });
      out.blocks.push({ x: w - sw * 0.1, y: h - sh * 0.4, w: r(18, 30), h: sh * 0.5, fill: "tealLight" });
    },
    () => out.blocks.push({ x: r(w * 0.4, w * 0.7), y: -r(18, 30), w: r(70, 120), h: r(50, 80), fill: pick(["grayDots", "tealDots"] as const), fade: "down" }),
    () => out.blocks.push({ x: r(-20, w * 0.3), y: h - r(4, 14), w: r(w * 0.4, w * 0.7), h: r(24, 40), fill: pick(["tealLight", "tealDots"] as const), fade: "right" }),
  ];
  const accents: Array<() => void> = [
    () => {
      // two parallel teal slashes across a corner
      const atTop = chance(0.5);
      const x0 = atTop ? w - r(20, 60) : r(-30, 20);
      const y0 = atTop ? r(-10, 20) : h - r(10, 60);
      const len = r(60, 130);
      for (let k = 0; k < 2; k++) {
        const o = k * r(8, 12);
        // 45 degrees, bottom-left to top-right (every slash on the site runs this way)
        const d = len * 0.7;
        out.hairs.push({ x1: x0 + o, y1: y0 + d / 2, x2: x0 + o + d, y2: y0 - d / 2, tone: "teal", width: k ? 1 : 1.6 });
      }
    },
    () => {
      const n = Math.round(r(6, 12));
      const x0 = r(10, w * 0.4);
      const y = -r(10, 18);
      for (let i = 0; i < n; i++) out.sparks.push({ x: x0 + i * 10, y, size: 1.8, kind: "dot", tone: "teal" });
    },
    () => out.sparks.push({ x: chance(0.5) ? -r(18, 30) : w + r(14, 30), y: chance(0.5) ? r(-10, 30) : r(h * 0.5, h * 0.8), size: r(8, 13), kind: "star", tone: pick(["ink", "teal"] as const) }),
    () => out.discs.push({ cx: chance(0.5) ? r(-20, 30) : w + r(-10, 30), cy: r(h * 0.15, h * 0.85), r: r(24, 52), fill: "outline" }),
    () => out.blocks.push({ x: -r(14, 24), y: r(0, h * 0.2), w: r(14, 22), h: r(h * 0.4, h * 0.7), fill: "grayDots", fade: "down" }),
  ];

  const draw = (list: Array<() => void>, min: number, max: number) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(r(0, i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    list.slice(0, Math.round(r(min, max + 0.49))).forEach((add) => add());
  };
  draw(masses, 2, 3);
  draw(accents, 2, 4);
  return out;
}
