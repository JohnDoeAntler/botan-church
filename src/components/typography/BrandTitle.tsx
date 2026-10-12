import { useMemo } from "react";
import { Place } from "../layout/Place";
import type { Anchor } from "../layout/Place";
import { BrandStar } from "../shapes/BrandStar";
import { BRAND_STAR } from "../shapes/brandStarSpec";
import { glyphCenter } from "./parseGlyphSvg";
import { SvgTitle } from "./SvgTitle";

export type BrandTitleProps = {
  /** Raw glyph-SVG markup and its accessible text. */
  svg: string;
  label: string;
  /** Top-left of the title, design px, anchored like Place. */
  x: number;
  y: number;
  ax?: Anchor;
  ay?: Anchor;
  scale?: number;
  /** Size of the page star sitting in the title's `starIn` letter. */
  starScale?: number;
  starIn?: string;
  /** Stacking: the title at `z`, its star one above. */
  z?: number;
};

/**
 * A page's logotype with the page star centred in one of its letters (the "O"): the star is the page's
 * `[data-star-anchor]`, where the travel / loader star lands. Title and star are sibling units, placed together.
 */
export function BrandTitle({ svg, label, x, y, ax = "center", ay = "center", scale = 1, starScale = 1, starIn = "O", z = 5 }: BrandTitleProps) {
  const centre = useMemo(() => glyphCenter(svg, starIn), [svg, starIn]);
  return (
    <>
      <Place x={x} y={y} ax={ax} ay={ay} z={z} data-anim="title">
        <SvgTitle svg={svg} label={label} scale={scale} />
      </Place>
      {centre && (
        <Place
          x={x + centre.x * scale - (BRAND_STAR.width * starScale) / 2}
          y={y + centre.y * scale - (BRAND_STAR.height * starScale) / 2}
          ax={ax}
          ay={ay}
          z={z + 1}
          data-star-anchor
        >
          <BrandStar scale={starScale} />
        </Place>
      )}
    </>
  );
}
