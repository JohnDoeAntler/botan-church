import { useMemo } from "react";
import { BlockArt, Flex, HandNote, Place, Rule, Stack, Text } from "../../components";
import { u } from "../../lib/units";
import { COPY, type GospelEntry } from "./gospelContent";
import { panelDecor } from "./gospelDecor";
import styles from "./GospelPage.module.css";

/** The picture (page design px). */
const PANEL = { x: 806, y: 76, w: 820, h: 340 };
/** Top-left of the copy under the picture. */
const COPY_AT = { x: 819, y: 434 };
/** The headline column (up to the dashed rule) and its largest size: longer lines get smaller. */
const HEADLINE = { width: 466, size: 46 };
const pad2 = (n: number) => String(n).padStart(2, "0");

/** How SVG keeps a picture's focus in view while it covers the panel (preserveAspectRatio … slice). */
const ALIGN = { top: "xMidYMin", center: "xMidYMid", bottom: "xMidYMax" } as const;

/** The entry's picture, covering the panel, with its print decoration. */
function EntryPicture({ entry }: { entry: GospelEntry }) {
  const decor = useMemo(() => panelDecor(entry.seed, PANEL.w, PANEL.h), [entry.seed]);
  return (
    <div className={styles.panel}>
      <Place x={PANEL.x} y={PANEL.y} w={PANEL.w} h={PANEL.h} ax="end" ay="start" z={2} data-anim="panel">
        <svg aria-hidden viewBox={`0 0 ${PANEL.w} ${PANEL.h}`} style={{ display: "block", width: "100%", height: "100%" }}>
          <image data-art href={entry.art.src} x={0} y={0} width={PANEL.w} height={PANEL.h} preserveAspectRatio={`${ALIGN[entry.art.focus]} slice`} />
        </svg>
      </Place>
      <Place x={PANEL.x} y={PANEL.y} w={PANEL.w} h={PANEL.h} ax="end" ay="start" z={3} data-anim="shape" className={styles.panelFrame}>
        <BlockArt box={{ x: 0, y: 0, w: PANEL.w, h: PANEL.h }} layout={decor} />
      </Place>
    </div>
  );
}

/** GOSPEL 01 (teal, underlined, with a short rule after it), the headline, its English line and the body. */
function EntryCopy({ entry, index }: { entry: GospelEntry; index: number }) {
  const longest = Math.max(...entry.title.map((line) => Array.from(line).length));
  const headline = Math.min(HEADLINE.size, Math.floor((HEADLINE.width / (longest * 1.02)) * 10) / 10);
  return (
    <Flex x={COPY_AT.x} y={COPY_AT.y} ax="end" ay="start" z={6} dir="column">
      <Stack dir="row" align="center" gap={18}>
        <Stack gap={4}>
          <Stack dir="row" align="baseline" gap={20}>
            <div data-anim="text">
              <Text size={12} tracking={0.22} color="var(--c-teal)">
                {COPY.label}
              </Text>
            </div>
            <div data-anim="number">
              <Text variant="display" size={24} leading={28} color="var(--c-teal)" weight={500}>
                {pad2(index + 1)}
              </Text>
            </div>
          </Stack>
          <div data-anim="rule">
            <Rule length={132} thickness={1.4} color="var(--c-teal)" />
          </div>
        </Stack>
        <div data-anim="rule">
          <Rule length={46} thickness={1.2} color="var(--c-teal)" />
        </div>
      </Stack>
      <div data-anim="text" style={{ marginTop: u(10) }}>
        <Text variant="mincho" size={headline} leading={60} weight={700} tracking={0.02} lines={entry.title} lang="ja" />
      </div>
      <div data-anim="text" style={{ margin: `${u(13)} 0 0 ${u(10)}` }}>
        <Text size={11.5} tracking={0.38}>
          {entry.en}
        </Text>
      </div>
      <div data-anim="text" style={{ margin: `${u(19)} 0 0 ${u(12)}` }}>
        <Text variant="gothic" size={13.5} leading={27} weight={500} tracking={0.1} lines={entry.body} lang="ja" />
      </div>
    </Flex>
  );
}

/** The quote, handwritten, signed, beside a dashed rule; the tags flow under it, wrapping. */
function EntryQuote({ entry }: { entry: GospelEntry }) {
  const english = entry.quoteScript === "en";
  return (
    <>
      <Place x={1301} y={524} ax="end" ay="start" z={6} data-anim="rule">
        <Rule length={240} thickness={1.2} vertical dash={6} />
      </Place>
      {/* “ quote, the signature under it (its dash level with the name), then the tags */}
      <Flex x={1326} y={524} w={283} ax="end" ay="start" z={6} dir="column">
        {/* the quote tilts a little, the signature more, like a hand-written note (tags stay level) */}
        <Stack dir="row" gap={12} style={{ rotate: "-3deg", transformOrigin: "0 0" }}>
          <div data-anim="text">
            <Text variant="mincho" size={40} leading={40} weight={700}>
              “
            </Text>
          </div>
          <div data-anim="note" style={{ marginTop: u(-4) }}>
            <HandNote lines={entry.quote} script={entry.quoteScript} size={english ? 24 : 17.5} leading={31} style={{ textIndent: 0 }} />
          </div>
        </Stack>
        <Stack dir="row" align="center" gap={10} style={{ alignSelf: "flex-end", marginTop: u(8), rotate: "-12deg" }}>
          <div data-anim="rule">
            <Rule length={32} thickness={1.2} />
          </div>
          <div data-anim="note">
            <HandNote lines={[COPY.signature]} script="en" size={24} leading={26} />
          </div>
        </Stack>
        <Stack dir="row" gap={10} style={{ flexWrap: "wrap", marginTop: u(20) }}>
          {entry.tags.map((tag) => (
            <div key={tag} data-anim="text" className={styles.tag}>
              <Text variant="gothic" size={12} tracking={0.08} weight={500} lang="ja">{`# ${tag}`}</Text>
            </div>
          ))}
        </Stack>
      </Flex>
    </>
  );
}

/**
 * One gospel entry: the right half of the page. Positioned in page design px, anchored to the right edge. The page
 * keys it by entry, so switching entries mounts a fresh one (and runs its entrance).
 */
export function GospelEntryView({ entry, index }: { entry: GospelEntry; index: number }) {
  return (
    <>
      <EntryPicture entry={entry} />
      <EntryCopy entry={entry} index={index} />
      <EntryQuote entry={entry} />
    </>
  );
}
