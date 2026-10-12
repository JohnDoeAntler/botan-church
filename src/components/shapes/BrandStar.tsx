import { BRAND_STAR } from "./brandStarSpec";
import { Sparkle, type SparkleProps } from "./Sparkle";

export type BrandStarProps = Omit<SparkleProps, "size" | "height" | "color" | "waist"> & {
  /** Size multiplier (e.g. a smaller anchor on a page with a smaller title). */
  scale?: number;
};

/** The shared brand star (see BRAND_STAR). Used by the loader and as each page's star anchor. */
export function BrandStar({ scale = 1, ...props }: BrandStarProps) {
  return (
    <Sparkle
      size={BRAND_STAR.width * scale}
      height={BRAND_STAR.height * scale}
      waist={BRAND_STAR.waist}
      color={BRAND_STAR.color}
      {...props}
    />
  );
}
