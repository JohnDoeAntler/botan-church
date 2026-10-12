import type { CSSProperties, HTMLAttributes, Ref } from "react";
import { u } from "../../lib/units";

/** Which viewport edge an element sticks to when the screen is wider / taller than the design. */
export type Anchor = "start" | "center" | "end";

export type PlaceProps = HTMLAttributes<HTMLDivElement> & {
  /** Position and size in design px (relative to the parent Stage). */
  x: number;
  y: number;
  w?: number;
  h?: number;
  z?: number;
  /** Horizontal anchor: start = left edge, end = right edge, center = moves with the composition. */
  ax?: Anchor;
  /** Vertical anchor: start = top edge, end = bottom edge, center = moves with the composition. */
  ay?: Anchor;
  /** Static rotation in degrees. Uses the CSS `rotate` property so GSAP transforms stay free. */
  rotate?: number;
  ref?: Ref<HTMLDivElement>;
};

const SLACK = { start: "0px", center: "0.5", end: "1" } as const;

/** Design px → CSS length, plus the share of spare room (--ox / --oy) the anchor asks for. */
const anchored = (px: number, anchor: Anchor, spare: "--ox" | "--oy") =>
  anchor === "start" ? u(px) : `calc(${u(px)} + var(${spare}, 0px) * ${SLACK[anchor]})`;

/** Absolute-positioning wrapper. Usually the element GSAP targets via `data-anim`. */
export function Place({ x, y, w, h, z, ax = "center", ay = "center", rotate, style, ref, ...rest }: PlaceProps) {
  const placed: CSSProperties = {
    position: "absolute",
    left: anchored(x, ax, "--ox"),
    top: anchored(y, ay, "--oy"),
    width: w === undefined ? undefined : u(w),
    height: h === undefined ? undefined : u(h),
    zIndex: z,
    rotate: rotate ? `${rotate}deg` : undefined,
    ...style,
  };
  return <div ref={ref} style={placed} {...rest} />;
}
