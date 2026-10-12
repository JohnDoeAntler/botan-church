import { BlockArt, DotGrid, Place, Sparkle } from "../../components";
import { COLLAGE } from "./gospelDecor";

/** Pointy stars, like the print (Sparkle's waist: 0 needle, 14 classic). */
const WAIST = 4;

/** Free-standing stars of the left half (design px, size). */
const STARS = [
  { x: 413, y: 26, s: 38 },
  { x: 166, y: 110, s: 80 },
  { x: 510, y: 112, s: 50 },
  { x: 602, y: 310, s: 68 },
  { x: 534, y: 588, s: 30 },
  { x: 406, y: 816, s: 30 },
];

/**
 * The print decoration, placed where the reference has it (these are artwork, not layout): the left half's
 * collage clusters and stars, and the few marks around the entry on the right.
 */
export function GospelCollage() {
  return (
    <>
      {COLLAGE.map((c, i) => (
        <Place key={i} x={c.box.x} y={c.box.y} ax="start" ay="start" z={1} data-anim="shape">
          <BlockArt box={c.box} layout={c.layout} />
        </Place>
      ))}
      {STARS.map((s, i) => (
        <Place key={i} x={s.x} y={s.y} ax="start" ay="start" z={5} data-anim="sparkle">
          <Sparkle size={s.s} waist={WAIST} color="var(--c-ink)" />
        </Place>
      ))}
      <Place x={166} y={758} ax="start" ay="start" z={5} data-anim="sparkle">
        <Sparkle size={26} waist={WAIST} color="var(--c-teal)" />
      </Place>

      {/* around the entry */}
      <Place x={1308} y={474} ax="end" ay="start" z={5} data-anim="sparkle">
        <Sparkle size={22} waist={WAIST} color="var(--c-teal)" />
      </Place>
      <Place x={1262} y={712} ax="end" ay="start" z={1} data-anim="dots">
        <DotGrid rows={9} cols={7} pitch={11} dot={1.8} />
      </Place>
      <Place x={1592} y={442} ax="end" ay="start" z={1} data-anim="dots">
        <DotGrid rows={6} cols={3} pitch={11} dot={1.8} />
      </Place>
    </>
  );
}
