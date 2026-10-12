import type { Ref } from "react";
import { Place } from "../../components";
import type { PlacedItem } from "./fanartLayout";
import { FanartItem } from "./FanartItem";
import styles from "./FanartPage.module.css";

/** Vertical clip of the scrolling list (design px): between the nav and the page frame. */
const CLIP = { top: 58, bottom: 926 };

/**
 * The scrolling window of fanart items: a full-width band (overflow hidden) with each shown item placed where the
 * procedural layout put it. Keyed by entry, so items that stay keep their DOM. `boxRef` = the band, `listRef` =
 * what slides.
 */
export function FanartList({ items, boxRef, listRef }: { items: PlacedItem[]; boxRef: Ref<HTMLDivElement>; listRef: Ref<HTMLDivElement> }) {
  return (
    <Place ref={boxRef} x={0} y={CLIP.top} ax="start" h={CLIP.bottom - CLIP.top} z={2} style={{ right: 0, overflow: "hidden" }}>
      <div ref={listRef} className={styles.list}>
        {items.map((item) => (
          <Place key={item.index} x={item.x} y={item.y - CLIP.top} ax="start" ay="start" z={2}>
            <FanartItem item={item} className={styles.item} />
          </Place>
        ))}
      </div>
    </Place>
  );
}
