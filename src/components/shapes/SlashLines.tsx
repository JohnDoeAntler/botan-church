import type { Ref, SVGAttributes } from "react";
import { u } from "../../lib/units";
import { decayStyle, type DecayValue } from "../effects/decayPresets";

export type SlashLinesProps = SVGAttributes<SVGSVGElement> & {
  /** Bounding box in design px; lines run at 45°, bottom-left → top-right, as long as the box allows. */
  width: number;
  height: number;
  count?: number;
  /** Horizontal offset between parallel lines, design px. */
  spacing?: number;
  color?: string;
  thickness?: number;
  decay?: DecayValue;
  ref?: Ref<SVGSVGElement>;
};

/**
 * Parallel diagonal speed lines. Each path has pathLength=1, so animate a draw-on with
 * `strokeDashoffset: 1 → 0` on `[data-anim-item="stroke"]`.
 */
export function SlashLines({
  width,
  height,
  count = 2,
  spacing = 10,
  color = "var(--c-teal)",
  thickness = 1.6,
  decay = "pencil",
  style,
  ref,
  ...rest
}: SlashLinesProps) {
  // every slash on the site is 45° (bottom-left → top-right), whatever the box's proportions
  const run = Math.min(height, width - spacing * (count - 1));
  return (
    <svg
      ref={ref}
      aria-hidden
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", width: u(width), height: u(height), overflow: "visible", ...decayStyle(decay, 3), ...style }}
      {...rest}
    >
      {Array.from({ length: count }, (_, i) => {
        const x = i * spacing;
        return (
          <path
            key={i}
            data-anim-item="stroke"
            d={`M${x} ${height}L${x + run} ${height - run}`}
            pathLength={1}
            strokeDasharray="1 1"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            fill="none"
          />
        );
      })}
    </svg>
  );
}
