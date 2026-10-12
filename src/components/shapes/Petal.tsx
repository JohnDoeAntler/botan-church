import type { Ref, SVGAttributes } from "react";
import { u } from "../../lib/units";
import { decayStyle, type DecayValue } from "../effects/decayPresets";

export type PetalProps = SVGAttributes<SVGSVGElement> & {
  size: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  decay?: DecayValue;
  ref?: Ref<SVGSVGElement>;
};

/** Notched cherry-blossom petal outline. Rotate it with a wrapping Place. */
export function Petal({
  size,
  stroke = "var(--c-teal)",
  fill = "none",
  strokeWidth = 1.6,
  decay = "pencil",
  style,
  ref,
  ...rest
}: PetalProps) {
  return (
    <svg
      ref={ref}
      aria-hidden
      viewBox="0 0 40 60"
      style={{ display: "block", width: u(size), height: u(size * 1.5), overflow: "visible", ...decayStyle(decay, 3), ...style }}
      {...rest}
    >
      <path
        d="M20 57C5 45 2 22 13 5c2.5 2 4.6 4.5 7 7.5 2.4-3 4.5-5.5 7-7.5 11 17 8 40-7 52Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
