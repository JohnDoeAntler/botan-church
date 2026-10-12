import { useId, useMemo, type HTMLAttributes, type Ref } from "react";
import { u } from "../../lib/units";
import { decayFilter, type DecayValue } from "../effects/decayPresets";
import { parseGlyphSvg } from "./parseGlyphSvg";

export type SvgTitleProps = HTMLAttributes<HTMLDivElement> & {
  /** Raw glyph-SVG markup (import "./title.svg?raw"). See parseGlyphSvg for the format. */
  svg: string;
  /** Accessible text, e.g. "BOTAN CHURCH". */
  label: string;
  /** Uniform size multiplier on the SVG's own (design px) size. */
  scale?: number;
  ink?: string;
  accent?: string;
  inkDecay?: DecayValue;
  accentDecay?: DecayValue;
  ref?: Ref<HTMLDivElement>;
};

/** Room around each glyph for edge wobble, in viewBox units. */
const PAD = 6;

/**
 * Vector logotype. Each letter is its own small <svg> (`[data-anim-item="glyph"]`) with its accent piece as a
 * sibling <svg> (`[data-anim-item="shard"]`), so letters animate as GPU layers without re-running filters.
 * Sized in design px from the SVG's viewBox.
 */
export function SvgTitle({
  svg,
  label,
  scale = 1,
  ink = "var(--c-ink)",
  accent = "var(--c-teal)",
  inkDecay = "ink",
  accentDecay = "edge",
  style,
  ref,
  ...rest
}: SvgTitleProps) {
  const art = useMemo(() => parseGlyphSvg(svg), [svg]);
  const uid = useId().replace(/[^\w-]/g, "");

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      style={{ position: "relative", width: u(art.width * scale), height: u(art.height * scale), ...style }}
      {...rest}
    >
      {art.glyphs.map((g, i) => {
        const b = { x: g.box.x - PAD, y: g.box.y - PAD, w: g.box.w + PAD * 2, h: g.box.h + PAD * 2 };
        const layer = {
          viewBox: `${b.x} ${b.y} ${b.w} ${b.h}`,
          style: { position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" } as const,
        };
        return (
          <div
            key={g.id}
            data-anim-item="glyph"
            data-char={g.char}
            style={{ position: "absolute", left: u(b.x * scale), top: u(b.y * scale), width: u(b.w * scale), height: u(b.h * scale) }}
          >
            <svg aria-hidden {...layer}>
              <path d={g.ink} fill={ink} filter={decayFilter(inkDecay, "svg")} />
            </svg>
            {g.shards.length > 0 && (
              <svg aria-hidden data-anim-item="shard" {...layer}>
                <clipPath id={`${uid}-shard-${i}`}>
                  {g.shards.map((d, j) => (
                    <path key={j} d={d} />
                  ))}
                </clipPath>
                <g clipPath={`url(#${uid}-shard-${i})`}>
                  <path d={g.ink} fill={accent} filter={decayFilter(accentDecay, "svg")} />
                </g>
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}
