import { useMemo, type Ref, type SVGAttributes } from "react";
import { seeded } from "../../lib/random";
import { u } from "../../lib/units";
import { decayStyle, type DecayValue } from "../effects/decayPresets";

export type BarcodeProps = SVGAttributes<SVGSVGElement> & {
  width: number;
  height: number;
  bars?: number;
  seed?: number;
  color?: string;
  decay?: DecayValue;
  ref?: Ref<SVGSVGElement>;
};

/** Decorative pseudo-random barcode. Same seed → same bars. */
export function Barcode({
  width,
  height,
  bars = 26,
  seed = 2024,
  color = "currentColor",
  decay = "ink",
  style,
  ref,
  ...rest
}: BarcodeProps) {
  const rects = useMemo(() => {
    const rand = seeded(seed);
    const raw = Array.from({ length: bars }, () => ({
      w: 1 + Math.floor(rand() * 3),
      gap: 1 + Math.floor(rand() * 2),
    }));
    const total = raw.reduce((sum, b) => sum + b.w + b.gap, 0);
    const scale = width / total;
    let x = 0;
    return raw.map((b) => {
      const rect = { x, w: b.w * scale };
      x += (b.w + b.gap) * scale;
      return rect;
    });
  }, [bars, seed, width]);

  return (
    <svg
      ref={ref}
      aria-hidden
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ display: "block", width: u(width), height: u(height), ...decayStyle(decay, 2), ...style }}
      {...rest}
    >
      {rects.map((r, i) => (
        <rect key={i} data-anim-item="bar" x={r.x} y={0} width={r.w} height={height} fill={color} />
      ))}
    </svg>
  );
}
