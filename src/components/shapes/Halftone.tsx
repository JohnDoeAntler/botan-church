import type { CSSProperties, HTMLAttributes, Ref } from "react";
import { u } from "../../lib/units";
import { decayFilter, type DecayLevel } from "../effects/decayPresets";

type FadeDirection = "left" | "right" | "top" | "bottom" | "radial";

export type HalftoneProps = HTMLAttributes<HTMLDivElement> & {
  color?: string;
  /** Distance between dot centres, design px. */
  cell?: number;
  /** Dot diameter as a fraction of the cell (0..1). */
  dot?: number;
  /** Screen angle in degrees (classic print halftone uses 45). */
  angle?: number;
  /** Direction the pattern fades out toward. */
  fade?: FadeDirection;
  round?: boolean;
  clip?: string;
  decay?: DecayLevel | "none";
  ref?: Ref<HTMLDivElement>;
};

const fadeMask = (fade?: FadeDirection) => {
  if (!fade) return undefined;
  if (fade === "radial") return "radial-gradient(closest-side, #000 35%, transparent)";
  return `linear-gradient(to ${fade}, #000 20%, transparent)`;
};

/** Screen-print dot pattern. Fills its parent. */
export function Halftone({
  color = "var(--c-teal)",
  cell = 5,
  dot = 0.6,
  angle = 45,
  fade,
  round,
  clip,
  decay = "edge",
  style,
  ref,
  ...rest
}: HalftoneProps) {
  const radius = `calc(${u(cell)} * ${dot / 2})`;
  const mask = fadeMask(fade);
  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: round ? "50%" : undefined,
        clipPath: clip,
        maskImage: mask,
        WebkitMaskImage: mask,
        filter: decayFilter(decay),
        ...style,
      }}
      {...rest}
    >
      <div
        style={
          {
            position: "absolute",
            inset: "-50%",
            rotate: `${angle}deg`,
            backgroundImage: `radial-gradient(circle, ${color} ${radius}, transparent calc(${radius} + 0.6px))`,
            backgroundSize: `${u(cell)} ${u(cell)}`,
          } as CSSProperties
        }
      />
    </div>
  );
}
