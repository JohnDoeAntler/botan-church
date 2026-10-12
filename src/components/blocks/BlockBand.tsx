import { useMemo, type CSSProperties, type HTMLAttributes, type Ref } from "react";
import { coverRect, type Art } from "../../lib/cover";
import { u } from "../../lib/units";
import { useBlockKit } from "./blockKit";
import { bandLayout, type BandVariant } from "./blocks";

export type BlockBandProps = HTMLAttributes<HTMLDivElement> & {
  /** Artwork URL, shown grayscale and cover-fitted to its rectangle. */
  art: Art;
  /** Band size, design px. */
  width: number;
  height: number;
  /** Same seed → same layout. */
  seed: number;
  /** Where the artwork begins (band-local x). */
  artLeft: number;
  /** Where the info card begins (band-local x); the artwork ends there. */
  card: number;
  variant: BandVariant;
  /** Big number: white on the plate, black on the paper. Position is band-local (top-left). */
  number?: { text: string; x: number; y: number; size: number };
  ref?: Ref<HTMLDivElement>;
};

const C = { ink: "var(--c-ink)", paper: "var(--c-paper)" } as const;
const fill = (c: string): CSSProperties => ({ fill: c });
/** Room around the band for blocks that overhang it. */
const PAD = 30;

/**
 * One list item band in rectangles only: a left zone (number on paper, or a black halftone plate over a teal
 * stack), the artwork, and decoration on the hard boundary where the artwork meets the info card (see
 * bandLayout()). One static SVG.
 */
export function BlockBand({ art, width, height: h, seed, artLeft, card, variant, number, style, ref, ...rest }: BlockBandProps) {
  const numberRight = number ? number.x + number.size * 1.2 : 0;
  const L = useMemo(() => {
    const numberBox = number && { x: number.x, y: number.y + number.size * 0.08, w: number.size * 1.4, h: number.size * 0.78 };
    return bandLayout({ seed, height: h, artLeft, card, variant, numberRight, numberBox });
  }, [seed, h, artLeft, card, variant, numberRight, number]);
  const { id, url, block, hair, spark, defs } = useBlockKit();

  return (
    <div ref={ref} style={{ position: "relative", width: u(width), height: u(h), ...style }} {...rest}>
      <svg
        aria-hidden
        viewBox={`${-PAD} ${-PAD} ${width + PAD * 2} ${h + PAD * 2}`}
        style={{ position: "absolute", left: u(-PAD), top: u(-PAD), width: u(width + PAD * 2), height: u(h + PAD * 2), overflow: "visible" }}
      >
        <defs>
          {defs}
          <clipPath id={id("art")}>
            <rect x={artLeft} y={0} width={card - artLeft} height={h} />
          </clipPath>
        </defs>

        <g clipPath={url("art")}>
          {(() => {
            const r = coverRect({ x: artLeft, y: 0, w: card - artLeft, h }, art);
            return <image data-art href={art.src} x={r.x} y={r.y} width={r.w} height={r.h} preserveAspectRatio="none" />;
          })()}
        </g>

        {L.blocks.map(block)}
        {L.hairs.map(hair)}
        {L.sparks.map(spark)}

        {number && (
          <text
            x={number.x}
            y={number.y + number.size * 0.82}
            style={{
              ...fill(L.plate ? C.paper : C.ink),
              fontFamily: "var(--f-display)",
              fontSize: number.size,
              fontWeight: 500,
              letterSpacing: "-0.02em",
            }}
          >
            {number.text}
          </text>
        )}
      </svg>
    </div>
  );
}
