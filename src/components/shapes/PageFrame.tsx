import type { CSSProperties, HTMLAttributes, Ref } from "react";
import { u } from "../../lib/units";
import { decayStyle, type DecayValue } from "../effects/decayPresets";

export type PageFrameProps = HTMLAttributes<HTMLDivElement> & {
  /** Distance of the outer line from the container edge, design px. */
  inset?: number;
  /** Distance between the outer and inner line. */
  gap?: number;
  /** Size of the notched corner ornament. */
  corner?: number;
  color?: string;
  decay?: DecayValue;
  ref?: Ref<HTMLDivElement>;
};

type Side = "top" | "right" | "bottom" | "left";
const SIDES: Side[] = ["top", "right", "bottom", "left"];
const CORNERS = [
  { key: "tl", rotate: 0, pos: { top: 0, left: 0 } },
  { key: "tr", rotate: 90, pos: { top: 0, right: 0 } },
  { key: "br", rotate: 180, pos: { bottom: 0, right: 0 } },
  { key: "bl", rotate: 270, pos: { bottom: 0, left: 0 } },
] as const;

const isHorizontal = (side: Side) => side === "top" || side === "bottom";

function lineStyle(side: Side, offset: number, corner: number, weight: number, decay: DecayValue): CSSProperties {
  return {
    position: "absolute",
    [side]: u(offset),
    ...(isHorizontal(side)
      ? { left: u(corner), right: u(corner), height: u(weight) }
      : { top: u(corner), bottom: u(corner), width: u(weight) }),
    background: "currentColor",
    transformOrigin: "center",
    ...decayStyle(decay, 3),
  };
}

/** Double-ruled border with notched corners, like a printed card. Covers its positioned parent. */
export function PageFrame({
  inset = 8,
  gap = 4,
  corner = 30,
  color = "var(--c-ink)",
  decay = "pencil",
  style,
  ref,
  ...rest
}: PageFrameProps) {
  const r = corner;
  const lines = [
    { offset: 0, weight: 1.6 },
    { offset: gap, weight: 0.9 },
  ];
  return (
    <div
      ref={ref}
      aria-hidden
      style={{ position: "absolute", inset: u(inset), pointerEvents: "none", color, ...style }}
      {...rest}
    >
      {lines.flatMap(({ offset, weight }) =>
        SIDES.map((side) => (
          <span
            key={`${offset}-${side}`}
            data-anim-item="frame-line"
            data-axis={isHorizontal(side) ? "x" : "y"}
            style={lineStyle(side, offset, r, weight, decay)}
          />
        )),
      )}
      {CORNERS.map((c) => (
        <svg
          key={c.key}
          data-anim-item="frame-corner"
          viewBox={`0 0 ${r} ${r}`}
          style={{
            position: "absolute",
            ...c.pos,
            width: u(r),
            height: u(r),
            rotate: `${c.rotate}deg`,
            overflow: "visible",
            ...decayStyle(decay),
          }}
        >
          <path d={`M${r} 0.8A${r} ${r} 0 0 1 0.8 ${r}`} fill="none" stroke="currentColor" strokeWidth={1.6} />
          <path d={`M${r} ${gap + 0.4}A${r - gap} ${r - gap} 0 0 1 ${gap + 0.4} ${r}`} fill="none" stroke="currentColor" strokeWidth={0.9} />
          <path d={`M${gap + 2} ${gap + 2}H${r * 0.5}L${gap + 2} ${r * 0.5}Z`} fill="currentColor" />
          <path d={`M${r * 0.5} ${gap + 2}V${r * 0.5}H${gap + 2}`} fill="none" stroke="currentColor" strokeWidth={0.9} />
        </svg>
      ))}
    </div>
  );
}
