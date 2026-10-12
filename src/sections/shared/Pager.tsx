import type { CSSProperties, ReactNode, Ref } from "react";
import { Place, Text, type Anchor } from "../../components";
import { u } from "../../lib/units";
import styles from "./Pager.module.css";

const pad2 = (n: number) => String(n).padStart(2, "0");

type Labels = { prevLabel?: string; nextLabel?: string };

/**
 * Prev (outlined) / next (solid) square buttons, side by side, in the flow. Same on every page that pages.
 * `scale` sizes them (1 = desktop; touch layouts use bigger). Each button is its own animated unit.
 */
export function PagerArrows({ onPrev, onNext, prevLabel = "Previous", nextLabel = "Next", scale = 1 }: Labels & { onPrev: () => void; onNext: () => void; scale?: number }) {
  return (
    <div className={styles.arrows} style={{ "--s": scale } as CSSProperties}>
      <div data-anim="shape" className={styles.arrowBox}>
        <button type="button" className={styles.arrow} aria-label={prevLabel} onClick={onPrev}>
          <svg viewBox="0 0 10 16" aria-hidden>
            <path d="M7 2 2 8l5 6" />
          </svg>
        </button>
      </div>
      <div data-anim="shape" className={styles.arrowBox}>
        <button type="button" className={`${styles.arrow} ${styles.arrowSolid}`} aria-label={nextLabel} onClick={onNext}>
          <svg viewBox="0 0 10 16" aria-hidden>
            <path d="M3 2l5 6-5 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/** A thin track with end ticks, as wide as its container, and a teal marker sliding to `index` of `count`. */
export function ProgressTrack({ index, count, scale = 1, className }: { index: number; count: number; scale?: number; className?: string }) {
  const f = count > 1 ? index / (count - 1) : 0;
  return (
    <div className={`${styles.trackBox} ${className ?? ""}`} style={{ "--s": scale, "--f": f } as CSSProperties}>
      <div data-anim="rule" className={styles.track} />
      <div data-anim="shape" className={styles.marker}>
        <span />
      </div>
    </div>
  );
}

export type PagerCounterProps = Labels & {
  /** Where the counter sits (top-left, design px) and how wide it is. */
  x: number;
  y: number;
  ax?: Anchor;
  ay?: Anchor;
  z?: number;
  width: number;
  index: number;
  count: number;
  onPrev: () => void;
  onNext: () => void;
  /** "below": number + arrows, the track under them (desktop). "inline": number, track, arrows in one row. */
  layout?: "below" | "inline";
  /** Font sizes of the current number and the "/NN" total, design px. */
  sizes?: { number: number; total: number };
  /** "/05" or "/ 05". */
  spaced?: boolean;
  scale?: number;
  /** Extra content under the counter (e.g. an archive caption). */
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
};

/**
 * "01 / 05" with the prev / next arrows and the progress track: the pager of every page that steps through
 * entries. Laid out by CSS grid inside one placed box.
 */
export function PagerCounter({
  x,
  y,
  ax = "start",
  ay = "start",
  z = 6,
  width,
  index,
  count,
  onPrev,
  onNext,
  layout = "below",
  sizes = { number: 72, total: 24 },
  spaced,
  scale = 1,
  prevLabel,
  nextLabel,
  children,
  ref,
}: PagerCounterProps) {
  return (
    <Place ref={ref} x={x} y={y} w={width} ax={ax} ay={ay} z={z} className={`${styles.counter} ${styles[layout]}`}>
      <div className={styles.figure}>
        <div data-anim="number">
          <Text key={index} variant="display" size={sizes.number} leading={sizes.number * 1.12} weight={500}>
            {pad2(index + 1)}
          </Text>
        </div>
        <div data-anim="text">
          <Text variant="display" size={sizes.total} leading={sizes.total * 1.15} weight={400}>
            {`/${spaced ? " " : ""}${pad2(count)}`}
          </Text>
        </div>
      </div>
      <ProgressTrack index={index} count={count} scale={scale} className={styles.counterTrack} />
      <PagerArrows onPrev={onPrev} onNext={onNext} prevLabel={prevLabel} nextLabel={nextLabel} scale={scale} />
      {children && (
        <div className={styles.extra} style={{ marginTop: u(22) }}>
          {children}
        </div>
      )}
    </Place>
  );
}
