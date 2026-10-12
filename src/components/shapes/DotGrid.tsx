import type { HTMLAttributes, Ref } from "react";
import { u } from "../../lib/units";

export type DotGridProps = HTMLAttributes<HTMLDivElement> & {
  rows: number;
  cols: number;
  /** Centre-to-centre spacing, design px. */
  pitch: number;
  /** Dot diameter, design px. */
  dot?: number;
  color?: string;
  ref?: Ref<HTMLDivElement>;
};

/** Grid of real elements, one per dot, so animations can stagger them (`[data-anim-item="dot"]`). */
export function DotGrid({
  rows,
  cols,
  pitch,
  dot = 3,
  color = "var(--c-teal)",
  style,
  ref,
  ...rest
}: DotGridProps) {
  return (
    <div
      ref={ref}
      aria-hidden
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${u(dot)})`,
        gap: u(pitch - dot),
        ...style,
      }}
      {...rest}
    >
      {Array.from({ length: rows * cols }, (_, i) => (
        <span
          key={i}
          data-anim-item="dot"
          style={{ width: u(dot), height: u(dot), borderRadius: "50%", background: color }}
        />
      ))}
    </div>
  );
}
