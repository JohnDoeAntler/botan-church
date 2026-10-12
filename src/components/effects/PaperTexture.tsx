import type { HTMLAttributes, Ref } from "react";
import { cx } from "../../lib/units";
import styles from "./PaperTexture.module.css";

export type PaperTextureProps = HTMLAttributes<HTMLDivElement> & {
  /** 0..1 overall strength of the grain + fibre overlay. */
  intensity?: number;
  ref?: Ref<HTMLDivElement>;
};

/** Full-bleed print-paper overlay. Put it last inside a positioned container. */
export function PaperTexture({ intensity = 0.5, className, style, ref, ...rest }: PaperTextureProps) {
  return (
    <div
      ref={ref}
      aria-hidden
      className={cx(styles.paper, className)}
      style={{ opacity: intensity, ...style }}
      {...rest}
    />
  );
}
