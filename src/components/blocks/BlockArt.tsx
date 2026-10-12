import type { HTMLAttributes, Ref } from "react";
import { u } from "../../lib/units";
import { useBlockKit } from "./blockKit";
import type { Block, Disc, Hair, Spark } from "./blocks";

export type BlockArtLayout = { blocks?: Block[]; hairs?: Hair[]; sparks?: Spark[]; discs?: Disc[] };

export type BlockArtProps = HTMLAttributes<HTMLDivElement> & {
  /** The area drawn, in the layout's own coordinates (design px); the element is this size. */
  box: { x: number; y: number; w: number; h: number };
  layout: BlockArtLayout;
  ref?: Ref<HTMLDivElement>;
};

/**
 * A static SVG of block-vocabulary shapes (blocks.ts: teal / ink rectangles, halftones, discs, hairlines, sparks)
 * whose coordinates are given in some outer space (e.g. page design px): only `box` of it is drawn, at the
 * element's own size, so shapes can be authored where they appear on the page. Shapes may overhang the box.
 */
export function BlockArt({ box, layout, style, ref, ...rest }: BlockArtProps) {
  const kit = useBlockKit();
  return (
    <div ref={ref} style={{ position: "relative", width: u(box.w), height: u(box.h), ...style }} {...rest}>
      <svg
        aria-hidden
        viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
      >
        <defs>{kit.defs}</defs>
        {layout.discs?.map(kit.disc)}
        {layout.blocks?.map(kit.block)}
        {layout.hairs?.map(kit.hair)}
        {layout.sparks?.map(kit.spark)}
      </svg>
    </div>
  );
}
