import type { Ref } from "react";
import { Place } from "../../components";
import type { Volume } from "./volumesContent";
import { VolumeItem } from "./VolumeItem";
import styles from "./VolumesPage.module.css";

/** The carousel's clip band (design px) and the top of its row. */
const CAROUSEL = { top: 140, bottom: 818, row: 200 };

export type CarouselSlot = { key: number; volume: Volume; x: number };

/**
 * The cyclic window of volumes: a full-width band (overflow hidden) with one placed volume per slot. Slots are
 * keyed by absolute position, so the volumes that stay keep their DOM and slide (the list itself is moved by
 * the page). `boxRef` = the band, `listRef` = what slides.
 */
export function VolumesCarousel({ slots, boxRef, listRef }: { slots: CarouselSlot[]; boxRef: Ref<HTMLDivElement>; listRef: Ref<HTMLDivElement> }) {
  return (
    <Place ref={boxRef} x={0} y={CAROUSEL.top} ax="start" h={CAROUSEL.bottom - CAROUSEL.top} z={2} style={{ right: 0, overflow: "hidden" }}>
      <div ref={listRef} className={styles.list}>
        {slots.map((s) => (
          <Place key={s.key} x={s.x} y={CAROUSEL.row - CAROUSEL.top} ax="start" ay="start" z={2}>
            <VolumeItem volume={s.volume} index={s.key} className={styles.item} />
          </Place>
        ))}
      </div>
    </Place>
  );
}
