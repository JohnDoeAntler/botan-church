import type { HTMLAttributes, Ref } from "react";
import { cx } from "../../lib/units";
import { BrandStar } from "../shapes/BrandStar";
import styles from "./LoadingScreen.module.css";

export type LoadingScreenProps = HTMLAttributes<HTMLDivElement> & {
  brand?: string;
  tagline?: string;
  ref?: Ref<HTMLDivElement>;
};

/**
 * Full-viewport preloader. Purely presentational: drive it with `createLoaderControl()` (animation/loader.ts),
 * which writes progress into the `data-loader-*` hooks, flies the star to the page and fades the loader out.
 * The star sits outside the content layer so it can stay visible while the content fades.
 *
 * The content layer is 99% opaque on purpose: the browser skips rasterizing anything fully hidden behind an
 * opaque layer, and the page underneath should be painted and ready when the loader leaves.
 */
export function LoadingScreen({
  brand = "botan.church",
  tagline = "A shrine to the bestest girl.",
  className,
  ref,
  ...rest
}: LoadingScreenProps) {
  return (
    <div ref={ref} className={cx(styles.loader, className)} role="status" aria-live="polite" {...rest}>
      <div className={styles.content} data-loader-content>
        <header className={styles.top}>
          <span>{brand}</span>
          <span>{tagline}</span>
        </header>

        <div />

        <footer className={styles.bottom}>
          <div className={styles.counter} aria-label="Loading progress">
            <span data-loader-count>000</span>
            <small>%</small>
          </div>
          <div className={styles.meta}>
            <span className={styles.step} data-loader-step>
              preparing
            </span>
            <div className={styles.track}>
              <span className={styles.bar} data-loader-bar />
            </div>
          </div>
        </footer>
      </div>
      <div className={styles.starSlot}>
        <div className={styles.star} data-loader-star>
          <BrandStar className={styles.spin} />
        </div>
      </div>
    </div>
  );
}
