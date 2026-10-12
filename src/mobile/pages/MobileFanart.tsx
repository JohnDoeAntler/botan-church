import { useMemo, type MouseEvent } from "react";
import { coverSweep, openInNewTab } from "../../animation/coverSweep";
import { Barcode, BlockArt, BrandTitle, Flex, leftBlocks, Place, Rule, Sparkle, Text } from "../../components";
import { u } from "../../lib/units";
import titleSvg from "../../sections/hero/art/botan-church.svg?raw";
import { COPY, FANART, LIST_REGION, sourceSite } from "../../sections/fanart/fanartContent";
import { planEntries } from "../../sections/fanart/fanartLayout";
import { TAGLINE_LINES } from "../../sections/shared/siteCopy";
import { MobilePage } from "../MobilePage";
import { dots, pad2, slash, WAIST } from "../mobileKit";
import styles from "../mobile.module.css";

/** The list: first item's top, item height, gap; the art starts at ART_X, the card covers the bottom CARD_H. */
const LIST = { top: 378, h: 300, gap: 14 };
const ART_X = 205;
const CARD = { x: 222, h: 96 };
const RIGHT = 918;

/** Tapping an item: its artwork is swept over in teal, then the source page opens in a new tab. */
function openSource(e: MouseEvent<HTMLAnchorElement>, href: string) {
  e.preventDefault();
  const art = e.currentTarget.closest("article")?.querySelector<HTMLElement>("[data-sweep-target]");
  if (!art || art.dataset.sweeping) return;
  art.dataset.sweeping = "1";
  coverSweep(art, {
    onCovered: () => {
      delete art.dataset.sweeping;
      openInNewTab(href);
    },
  });
}

/** Fanart: the whole archive as a scrolling list (no paging on a phone). */
export function MobileFanart() {
  const plans = useMemo(() => planEntries(FANART, LIST_REGION), []);
  const footY = LIST.top + plans.length * (LIST.h + LIST.gap) + 20;
  const H = footY + 120;

  return (
    <MobilePage id="m-fanart" height={H} scroll>
      {/* header: a rule and the tagline after the brand; the title */}
      <Flex x={322} y={36} ax="start" ay="start" z={6} gap={22}>
        <div data-anim="rule">
          <Rule length={42} thickness={1.2} vertical />
        </div>
        <div data-anim="text" style={{ marginTop: u(4) }}>
          <Text size={11.5} leading={19} tracking={0.26} lines={TAGLINE_LINES} />
        </div>
      </Flex>
      <BrandTitle svg={titleSvg} label="BOTAN CHURCH" x={64} y={108} ax="start" ay="start" scale={0.63} starScale={0.55} z={6} />
      <Place x={70} y={330} ax="start" ay="start" z={6} data-anim="text">
        <Text size={24} tracking={0.46} weight={500}>
          Fanart Archive
        </Text>
      </Place>
      <Flex x={566} y={176} ax="start" ay="start" z={6} dir="column">
        <div data-anim="text">
          <Text variant="mincho" size={27} leading={42} weight={600} lines={COPY.lead} lang="ja" />
        </div>
        <div data-anim="rule" style={{ margin: `${u(6)} 0 0 ${u(2)}` }}>
          <Rule length={30} thickness={1.4} />
        </div>
        <div data-anim="text" style={{ margin: `${u(19)} 0 0 ${u(2)}` }}>
          <Text size={13} leading={25} tracking={0.18} lines={COPY.span} />
        </div>
      </Flex>
      <Place x={780} y={92} ax="start" ay="start" z={6} data-anim="sparkle">
        <Sparkle size={64} waist={3} color="var(--c-ink)" />
      </Place>
      <Place x={700} y={60} ax="start" ay="start" z={1} data-anim="shape">
        <BlockArt
          box={{ x: 700, y: 60, w: 241, h: 300 }}
          layout={{
            blocks: [
              { x: 836, y: 168, w: 82, h: 120, fill: "tealDots", fade: "down" },
              { x: 826, y: 300, w: 92, h: 42, fill: "teal" },
            ],
            discs: [{ cx: 860, cy: 330, r: 80, fill: "outline" }],
            hairs: [slash(700, 330, 80)],
            sparks: dots(712, 80, 3, 4, 16, 1.8, "ink"),
          }}
        />
      </Place>

      {plans.map((p, i) => {
        const y = LIST.top + i * (LIST.h + LIST.gap);
        const plate = p.variant === "plate";
        const numberBox = { x: plate ? 58 : 52, y: 26, w: 96, h: 64 };
        const left = leftBlocks({ seed: p.entry.seed, height: LIST.h, artLeft: ART_X, variant: p.variant, numberRight: numberBox.x + numberBox.w, numberBox });
        return (
          <article key={p.index} aria-label={`${pad2(i + 1)} ${p.entry.title}`}>
            <Place x={0} y={y} ax="start" ay="start" z={1} data-anim="shape">
              <BlockArt box={{ x: -20, y: -10, w: 260, h: LIST.h + 20 }} layout={left} />
            </Place>
            <Place x={numberBox.x} y={y + 18} ax="start" ay="start" z={5} data-anim="number">
              <Text variant="display" size={74} leading={80} weight={500} color={plate ? "var(--c-paper)" : "var(--c-ink)"}>
                {pad2(i + 1)}
              </Text>
            </Place>
            <Place x={ART_X} y={y} w={RIGHT - ART_X} h={LIST.h} ax="start" ay="start" z={2} data-anim="panel" data-sweep-target className={styles.art}>
              <img src={p.entry.art.src} alt={p.entry.title} loading="lazy" style={{ objectPosition: `${p.entry.art.focus.x * 100}% ${p.entry.art.focus.y * 100}%` }} />
            </Place>
            <Place x={CARD.x} y={y + LIST.h - CARD.h} w={RIGHT - CARD.x} h={CARD.h} ax="start" ay="start" z={4} data-anim="shape">
              <div className={styles.card}>
                <div className={styles.cardText}>
                  <span data-anim="text">
                    <Text variant="mincho" size={25} leading={32} weight={500} color="var(--c-white)" lang="ja" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.entry.title}
                    </Text>
                  </span>
                  <span data-anim="text">
                    <Text variant="display" size={16} leading={22} color="#cfcfca" lines={[`by ${p.entry.author}`, p.entry.date]} />
                  </span>
                </div>
                <div className={`${styles.art} ${styles.cardThumb}`}>
                  <img src={p.entry.art.src} alt="" loading="lazy" />
                </div>
                <div className={styles.cardTags}>
                  <Text size={11} tracking={0.26} color="#cfcfca">
                    Illustration
                  </Text>
                  <hr />
                  <Text size={10.5} leading={16} tracking={0.24} color="#cfcfca" lines={p.entry.tags} />
                </div>
              </div>
            </Place>
            <Place x={0} y={y} w={941} h={LIST.h} ax="start" ay="start" z={8}>
              <a className={styles.cover} href={p.entry.link} target="_blank" rel="noopener noreferrer" onClick={(e) => openSource(e, p.entry.link)} aria-label={`${p.entry.title} by ${p.entry.author} (${sourceSite(p.entry.link)})`} />
            </Place>
          </article>
        );
      })}

      {/* footer: barcode and colophon, a rule, the thank-you, a star */}
      <Flex x={68} y={footY} ax="start" ay="start" z={6} gap={38}>
        <div data-anim="barcode">
          <Barcode width={110} height={40} />
        </div>
        <div data-anim="text" style={{ marginTop: u(2) }}>
          <Text size={12.5} leading={22} tracking={0.22} lines={["botan.church", "Fanart archive"]} />
        </div>
        <div data-anim="rule">
          <Rule length={46} thickness={1.2} vertical />
        </div>
        <div data-anim="text" style={{ margin: `${u(2)} 0 0 ${u(-8)}` }}>
          <Text variant="gothic" size={13} leading={24} weight={500} lines={["描かれた牡丹は、全員かわいい。例外はない。", "奉納は、いつでも受け付けています。"]} lang="ja" />
        </div>
        <div data-anim="sparkle" style={{ marginTop: u(6) }}>
          <Sparkle size={30} waist={WAIST} color="var(--c-ink)" />
        </div>
      </Flex>
    </MobilePage>
  );
}
