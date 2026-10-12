import type { HTMLAttributes, Ref } from "react";
import { decayFilter, type DecayLevel } from "../effects/decayPresets";

export type DecayShapeProps = HTMLAttributes<HTMLDivElement> & {
  shape?: "rect" | "circle";
  /** Any CSS clip-path, e.g. a polygon for L-shapes or cut corners. */
  clip?: string;
  color?: string;
  decay?: DecayLevel | "none";
  ref?: Ref<HTMLDivElement>;
};

/**
 * Flat ink block with a worn print texture. Fills its parent (use inside a Place).
 * The filter sits on the outer element and the shape on the inner one, so clip edges get roughened too.
 */
export function DecayShape({
  shape = "rect",
  clip,
  color = "var(--c-teal)",
  decay = "soft",
  style,
  children,
  ref,
  ...rest
}: DecayShapeProps) {
  return (
    <div
      ref={ref}
      style={{ position: "relative", width: "100%", height: "100%", filter: decayFilter(decay), ...style }}
      {...rest}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: color,
          borderRadius: shape === "circle" ? "50%" : undefined,
          clipPath: clip,
        }}
      />
      {children}
    </div>
  );
}
