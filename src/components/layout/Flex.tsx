import type { CSSProperties, HTMLAttributes } from "react";
import { u } from "../../lib/units";
import { Place, type PlaceProps } from "./Place";

const ALIGN = { start: "flex-start", center: "center", end: "flex-end", baseline: "baseline", stretch: "stretch" } as const;
const JUSTIFY = { start: "flex-start", center: "center", end: "flex-end", between: "space-between" } as const;

export type FlexProps = PlaceProps & {
  /** Main axis. */
  dir?: "row" | "column";
  /** Space between children, design px. */
  gap?: number;
  align?: keyof typeof ALIGN;
  justify?: keyof typeof JUSTIFY;
  wrap?: boolean;
};

/**
 * A group placed once on the page (anchored like Place: x / y in design px, `ax` / `ay` = which edge it keeps to
 * on screens of other proportions) whose children flow in a row or column with `gap`. Use it for anything that
 * reads as a line or a stack (a caption block, a footer row, a set of controls) instead of placing each piece.
 * The group itself is never an animated unit: give `data-anim` to its children.
 */
export function Flex({ dir = "row", gap = 0, align = "start", justify = "start", wrap, style, ...place }: FlexProps) {
  const flex: CSSProperties = {
    display: "flex",
    flexDirection: dir,
    gap: gap ? u(gap) : undefined,
    alignItems: ALIGN[align],
    justifyContent: JUSTIFY[justify],
    flexWrap: wrap ? "wrap" : undefined,
  };
  return <Place {...place} style={{ ...flex, ...style }} />;
}

export type StackProps = HTMLAttributes<HTMLDivElement> & Pick<FlexProps, "dir" | "gap" | "align" | "justify">;

/** A flex group inside the flow (e.g. a column within a Flex row). Like Flex, never an animated unit itself. */
export function Stack({ dir = "column", gap = 0, align = "start", justify = "start", style, ...rest }: StackProps) {
  return (
    <div
      style={{ display: "flex", flexDirection: dir, gap: gap ? u(gap) : undefined, alignItems: ALIGN[align], justifyContent: JUSTIFY[justify], ...style }}
      {...rest}
    />
  );
}
