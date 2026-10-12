import { BlockArt, Place, Rule, Sparkle, type BlockArtLayout } from "../../components";
import { decayFilter } from "../../components/effects/decayPresets";
import { AVATAR, WAIST } from "./aboutLayout";
import styles from "./AboutPage.module.css";

type Box = { x: number; y: number; w: number; h: number };

/** A slash at 45°, from (x, y) up to the right: the only diagonal the print uses. */
const slash = (x: number, y: number, len: number, width = 1, tone: "teal" | "ink" = "ink") => ({ x1: x, y1: y, x2: x + len, y2: y - len, tone, width });
const dotField = (x: number, y: number, cols: number, rows: number, pitchX: number, pitchY: number, size: number) =>
  Array.from({ length: cols * rows }, (_, k) => ({ x: x + (k % cols) * pitchX, y: y + Math.floor(k / cols) * pitchY, size, kind: "dot" as const, tone: "teal" as const }));

/** The portrait's blocks, authored around the reference's portrait (x = 714); they move with it. */
const DX = AVATAR.x - 714;
const AVATAR_DECOR: { box: Box; layout: BlockArtLayout } = {
  box: { x: 620 + DX, y: 118, w: 360, h: 180 },
  layout: {
    blocks: [
      { x: 625 + DX, y: 134, w: 92, h: 78, fill: "grayDots", fade: "left" },
      { x: 700 + DX, y: 176, w: 18, h: 64, fill: "teal" },
      { x: 906 + DX, y: 122, w: 40, h: 38, fill: "teal" },
      { x: 944 + DX, y: 198, w: 30, h: 78, fill: "tealDots", fade: "down" },
      { x: 928 + DX, y: 150, w: 26, h: 40, fill: "grayDots", fade: "right" },
    ],
  },
};

/** Lines, halftone bands and marks on both margins. */
const MARGIN_DECOR: Array<{ box: Box; layout: BlockArtLayout }> = [
  {
    box: { x: 150, y: 190, w: 300, h: 640 },
    layout: {
      hairs: [slash(268, 455, 150, 1), slash(330, 352, 92, 1), slash(310, 716, 28, 1.4, "teal")],
      blocks: [{ x: 320, y: 694, w: 7, h: 7, fill: "ink" }],
      sparks: dotField(190, 204, 9, 4, 11, 15, 1.8),
    },
  },
  {
    box: { x: 1200, y: 140, w: 400, h: 800 },
    layout: {
      hairs: [slash(1294, 410, 206, 1), slash(1320, 434, 140, 1), slash(1518, 524, 46, 1.4, "teal"), slash(1232, 896, 160, 1)],
      sparks: dotField(1280, 490, 7, 6, 13, 13, 1.6),
    },
  },
];

/** Free-standing stars around the centre column. */
const STARS = [
  { x: 662, y: 164, s: 18, c: "teal" },
  { x: 595, y: 219, s: 14, c: "ink" },
  { x: 967, y: 154, s: 18, c: "ink" },
  { x: 1116, y: 346, s: 14, c: "ink" },
  { x: 1180, y: 237, s: 12, c: "teal" },
];

/** The thin outline circle, cut by the page edge. `decay`: pencil grain on its line. */
function Circle({ size, decay }: { size: number; decay?: boolean }) {
  const r = size / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} aria-hidden className={styles.circle}>
      <circle cx={r} cy={r} r={r - 0.5} strokeWidth={decay ? 1.3 : 1.1} filter={decay ? decayFilter("pencil", "svg") : undefined} />
    </svg>
  );
}

/** The print artwork behind the copy, placed where the reference has it. */
export function AboutBackdrop() {
  return (
    <>
      <Place x={58} y={75} ax="start" ay="start" z={4} data-anim="rule" style={{ right: "calc(60 * var(--u))" }}>
        <div className={styles.hline} />
      </Place>
      <Place x={63} y={210} ax="start" ay="start" z={3} data-anim="rule">
        <Rule length={380} thickness={1} vertical />
      </Place>
      <Place x={-141} y={293} ax="start" ay="start" w={376} h={376} z={2} data-anim="shape">
        <Circle size={376} />
      </Place>
      <Place x={160} y={380} ax="start" ay="start" z={1} rotate={45} data-anim="shape">
        <BlockArt box={{ x: 0, y: 0, w: 64, h: 470 }} layout={{ blocks: [{ x: 0, y: 0, w: 64, h: 470, fill: "grayDots", fade: "down" }] }} />
      </Place>
      {MARGIN_DECOR.map((d, i) => (
        <Place key={i} x={d.box.x} y={d.box.y} ax={i ? "end" : "start"} ay="start" z={2} data-anim="shape">
          <BlockArt box={d.box} layout={d.layout} />
        </Place>
      ))}
      <Place x={215} y={458} ax="start" ay="start" z={5} data-anim="sparkle">
        <Sparkle size={46} waist={3} color="var(--c-ink)" />
      </Place>
      <Place x={290} y={567} ax="start" ay="start" z={5} data-anim="sparkle">
        <Sparkle size={16} waist={WAIST} color="var(--c-teal)" />
      </Place>

      <Place x={AVATAR_DECOR.box.x} y={AVATAR_DECOR.box.y} z={2} data-anim="shape">
        <BlockArt box={AVATAR_DECOR.box} layout={AVATAR_DECOR.layout} />
      </Place>
      {STARS.map((s, i) => (
        <Place key={i} x={s.x} y={s.y} z={5} data-anim="sparkle">
          <Sparkle size={s.s} waist={WAIST} color={`var(--c-${s.c})`} />
        </Place>
      ))}

      <Place x={1500} y={520} ax="end" ay="start" z={1} rotate={45} data-anim="shape">
        <BlockArt box={{ x: 0, y: 0, w: 56, h: 200 }} layout={{ blocks: [{ x: 0, y: 0, w: 56, h: 200, fill: "grayDots", fade: "up" }] }} />
      </Place>
      <Place x={1541} y={486} w={9} h={9} ax="end" ay="start" z={5} rotate={45} data-anim="shape">
        <div className={styles.diamond} />
      </Place>
      <Place x={1267} y={817} w={216} h={216} ax="end" ay="end" z={2} data-anim="shape">
        <Circle size={216} decay />
      </Place>
    </>
  );
}
