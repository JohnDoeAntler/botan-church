import type { Ref } from "react";
import { Barcode, BrandTitle, Flex, Place, Rule, Sparkle, Stack, Text, VerticalText } from "../../components";
import { u } from "../../lib/units";
import { PagerCounter } from "../shared/Pager";
import titleSvg from "./art/gospel.svg?raw";
import { COPY } from "./gospelContent";

/** The title (top-left, design px) and its size: the subtitle row centres on it, SUBTITLE_GAP below it. */
const TITLE = { x: 62, y: 395, w: 626, h: 140 };
const SUBTITLE_GAP = 16;
const WAIST = 4;

/**
 * The left half's copy: tagline, the vertical line, the GOSPEL title (page star in its "O") with its subtitle
 * centred under it, the thank-you column, the counter (`counterRef`: handed over mid-intro with the entry), and
 * the captions.
 */
export function GospelLeft({ active, count, onPrev, onNext, counterRef }: { active: number; count: number; onPrev: () => void; onNext: () => void; counterRef: Ref<HTMLDivElement> }) {
  return (
    <>
      <Place x={228} y={34} ax="start" ay="start" z={6} data-anim="text">
        <Text size={8.5} leading={13.5} tracking={0.26} lines={COPY.tagline} />
      </Place>
      <Flex x={50} y={77} ax="start" ay="start" z={6} dir="column" gap={22}>
        <div data-anim="rule" style={{ marginLeft: u(7) }}>
          <Rule length={10} thickness={1.2} />
        </div>
        <div data-anim="vtext">
          <VerticalText lines={COPY.vertical} size={30} leading={54} weight={600} />
        </div>
      </Flex>
      <Place x={617} y={166} ax="start" ay="start" z={6} data-anim="text">
        <Text size={7.6} leading={15.5} tracking={0.2} lines={COPY.forAll} />
      </Place>

      <BrandTitle svg={titleSvg} label="GOSPEL" x={TITLE.x} y={TITLE.y} ax="start" ay="start" starScale={1.1} />
      {/* star — subtitle — star, spread across the title's width */}
      <Flex x={TITLE.x} y={TITLE.y + TITLE.h + SUBTITLE_GAP} w={TITLE.w} ax="start" ay="start" z={6} align="center" justify="between">
        <div data-anim="sparkle">
          <Sparkle size={13} waist={WAIST} color="var(--c-ink)" />
        </div>
        <div data-anim="text">
          <Text size={13.5} tracking={0.42} weight={450}>
            {COPY.subtitle}
          </Text>
        </div>
        <div data-anim="sparkle">
          <Sparkle size={13} waist={WAIST} color="var(--c-ink)" />
        </div>
      </Flex>

      <Flex x={56} y={607} ax="start" ay="start" z={6} dir="column" gap={16}>
        <div data-anim="rule">
          <Rule length={10} thickness={1.2} />
        </div>
        <div data-anim="text">
          <Text variant="mincho" size={18} leading={32} weight={500} lines={COPY.thanks} lang="ja" />
        </div>
        <div data-anim="rule" style={{ marginTop: u(-11) }}>
          <Rule length={10} thickness={1.2} />
        </div>
        <Stack gap={27} style={{ marginTop: u(13) }}>
          <div data-anim="barcode">
            <Barcode width={80} height={38} />
          </div>
          <div data-anim="text">
            <Text size={8.5} leading={17} tracking={0.2} lines={COPY.colophon} />
          </div>
        </Stack>
      </Flex>

      <PagerCounter ref={counterRef} x={232} y={608} width={265} index={active} count={count} onPrev={onPrev} onNext={onNext} sizes={{ number: 74, total: 26 }} spaced>
        <div data-anim="text">
          <Text size={13} leading={23} tracking={0.14} weight={450} lines={COPY.archive} />
        </div>
      </PagerCounter>

      <Place x={325} y={872} ax="start" ay="start" z={6} data-anim="text">
        <Text size={8.5} leading={16} tracking={0.2} lines={COPY.collection} />
      </Place>
      <Flex x={1475} y={892} ax="end" ay="start" z={6} align="center" gap={9}>
        <div data-anim="rule">
          <Rule length={16} thickness={1.2} />
        </div>
        <div data-anim="text">
          <Text size={8.5} tracking={0.26}>
            {COPY.footer}
          </Text>
        </div>
      </Flex>
    </>
  );
}
