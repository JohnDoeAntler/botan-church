import type { Ref, SVGAttributes } from "react";
import { u } from "../../lib/units";
import { decayStyle, type DecayValue } from "../effects/decayPresets";

export type PlusProps = SVGAttributes<SVGSVGElement> & {
  size: number;
  color?: string;
  thickness?: number;
  decay?: DecayValue;
  ref?: Ref<SVGSVGElement>;
};

export function Plus({ size, color = "currentColor", thickness = 1.5, decay = "pencil", style, ref, ...rest }: PlusProps) {
  return (
    <svg
      ref={ref}
      aria-hidden
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block", width: u(size), height: u(size), ...decayStyle(decay, 3), ...style }}
      {...rest}
    >
      <path
        d={`M${size / 2} 0V${size}M0 ${size / 2}H${size}`}
        stroke={color}
        strokeWidth={thickness}
      />
    </svg>
  );
}
