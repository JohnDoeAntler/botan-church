import type { Ref, SVGAttributes } from "react";
import { u } from "../../lib/units";
import { sparklePath } from "./sparklePath";

export type SparkleProps = SVGAttributes<SVGSVGElement> & {
  /** Size in design px. Pass `height` too for a stretched star (e.g. long vertical flare). */
  size: number;
  height?: number;
  color?: string;
  /** How far the curved sides stay from the centre (0 = needle thin, 14 = classic ✦, 30 = chubby). */
  waist?: number;
  ref?: Ref<SVGSVGElement>;
};

/** Four-point concave star (✦). Drawn in a 100×100 box with cubic curves pinched toward the centre. */
export function Sparkle({
  size,
  height = size,
  color = "currentColor",
  waist = 14,
  style,
  ref,
  ...rest
}: SparkleProps) {
  const d = sparklePath(waist);
  return (
    <svg
      ref={ref}
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ display: "block", width: u(size), height: u(height), overflow: "visible", ...style }}
      {...rest}
    >
      <path d={d} fill={color} />
    </svg>
  );
}
