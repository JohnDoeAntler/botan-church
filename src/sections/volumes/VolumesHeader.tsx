import type { Ref } from "react";
import { BrandTitle, DotGrid, Flex, Place, Rule, Sparkle, Text } from "../../components";
import { PagerCounter } from "../shared/Pager";
import titleSvg from "./art/manga-volumes.svg?raw";
import { COPY } from "./volumesContent";

/**
 * The top of the page: print marks on the left, the MANGA VOLUMES title (the page star in its "O"), and on the
 * right the caption and the counter with its arrows and track. `controlsRef` is the counter (it follows the
 * carousel, so it is handed over with it mid-intro).
 */
export function VolumesHeader({ active, count, onPrev, onNext, controlsRef }: { active: number; count: number; onPrev: () => void; onNext: () => void; controlsRef: Ref<HTMLDivElement> }) {
  return (
    <>
      {/* decoration: the brand's star, a large star, a dot field */}
      <Place x={216} y={36} ax="start" ay="start" z={6} data-anim="sparkle">
        <Sparkle size={18} color="var(--c-ink)" />
      </Place>
      <Place x={60} y={108} ax="start" ay="start" z={4} data-anim="sparkle">
        <Sparkle size={38} waist={3} color="var(--c-ink)" />
      </Place>
      <Place x={52} y={196} ax="start" ay="start" z={1} data-anim="dots">
        <DotGrid rows={2} cols={10} pitch={11} dot={2} />
      </Place>

      <BrandTitle svg={titleSvg} label="MANGA VOLUMES" x={168} y={92} ax="start" ay="start" starScale={0.72} />

      <Flex x={1220} y={84} ax="end" ay="start" z={6} gap={48}>
        <div data-anim="text" style={{ marginTop: "calc(12 * var(--u))" }}>
          <Text variant="mono" size={12.5} leading={24.5} tracking={0.12} lines={COPY.caption} />
        </div>
        <div data-anim="rule">
          <Rule length={104} thickness={1.4} vertical />
        </div>
      </Flex>
      <PagerCounter
        ref={controlsRef}
        x={1410}
        y={82}
        ax="end"
        width={226}
        index={active}
        count={count}
        onPrev={onPrev}
        onNext={onNext}
        prevLabel="Previous volume"
        nextLabel="Next volume"
      />
    </>
  );
}
