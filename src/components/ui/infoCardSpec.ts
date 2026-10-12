import { seeded } from "../../lib/random";

type Box = { x: number; y: number; w: number; h: number };

export type CardLayout = {
  w: number;
  h: number;
  /** Detail crop, top-right. */
  thumb: Box;
  /** Where the copy goes (design px, card-local). */
  title: { x: number; y: number };
  tags: { x: number; y: number };
  /** Teal blocks along the card's bottom / left edge (may overhang it). */
  accents: Array<Box & { dots: boolean }>;
  /** Grey halftone patch on the card. */
  halftone: Box;
  /** Vertical teal dot column near the left edge. */
  dotColumn: boolean;
};

/** Deterministic card layout from a seed; shared by <InfoCard> (art) and the page (live copy). Rectangles only. */
export function cardLayout(seed: number, w: number, h: number): CardLayout {
  const rand = seeded(seed * 13 + 5);
  const r = (a: number, b: number) => a + (b - a) * rand();
  const tw = Math.round(r(108, 140));
  const th = Math.round(r(72, 86));
  const accents = [
    { x: r(0, 50), y: h - r(12, 20), w: r(50, 90), h: r(16, 26), dots: rand() < 0.4 },
    ...(rand() < 0.55 ? [{ x: r(-10, 4), y: r(h * 0.25, h * 0.5), w: r(12, 22), h: r(40, 70), dots: false }] : []),
  ];
  return {
    w,
    h,
    thumb: { x: w - tw, y: 0, w: tw, h: th },
    title: { x: 82, y: 64 },
    tags: { x: w - 102, y: th + 14 },
    accents,
    halftone: { x: r(120, w - 220), y: r(10, h * 0.35), w: r(50, 80), h: r(40, 70) },
    dotColumn: rand() < 0.6,
  };
}
