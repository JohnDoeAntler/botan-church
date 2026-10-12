import type { HTMLAttributes, Ref } from "react";
import { u } from "../../lib/units";
import { decayStyle, type DecayValue } from "../effects/decayPresets";

export type RuleProps = HTMLAttributes<HTMLSpanElement> & {
  length: number;
  thickness?: number;
  vertical?: boolean;
  /** Dash length in design px (dash and gap are equal). */
  dash?: number;
  color?: string;
  decay?: DecayValue;
  ref?: Ref<HTMLSpanElement>;
};

/** Straight line / dash with a pencil texture. Animate with scaleX (or scaleY when vertical) from 0. */
export function Rule({
  length,
  thickness = 1,
  vertical,
  dash,
  color = "currentColor",
  decay = "pencil",
  style,
  ref,
  ...rest
}: RuleProps) {
  const background = dash
    ? `repeating-linear-gradient(to ${vertical ? "bottom" : "right"}, ${color} 0 ${u(dash)}, transparent 0 ${u(dash * 2)})`
    : color;
  return (
    <span
      ref={ref}
      aria-hidden
      style={{
        display: "block",
        width: u(vertical ? thickness : length),
        height: u(vertical ? length : thickness),
        background,
        transformOrigin: vertical ? "top" : "left",
        ...decayStyle(decay, 3),
        ...style,
      }}
      {...rest}
    />
  );
}
