import { useRef, useState } from "react";
import { coverSweep, openInNewTab } from "../../animation/coverSweep";
import { BlockArt, BrandTitle, Flex, Place, Rule, Sparkle, Stack, Text, VerticalText } from "../../components";
import { u } from "../../lib/units";
import { PagerCounter } from "../../sections/shared/Pager";
import { VOLUMES, type Volume } from "../../sections/volumes/volumesContent";
import titleSvg from "../art/manga-volumes-stacked.svg?raw";
import { MobileFooter } from "../MobileFooter";
import { MobileBrand, MobilePage } from "../MobilePage";
import { dots, slash, WAIST } from "../mobileKit";
import styles from "../mobile.module.css";

/** Volume rows: first top, height. */
const ROWS = { top: 432, h: 222 };
const COVER = { x: 108, w: 146, h: 208, label: 44 };
const INFO_X = 340;
const N = VOLUMES.length;

/** One volume: its cover (tap to pick it) with the label strip, its details, an arrow; a rule under it. */
function VolumeRow({ volume, y, picked, last, onPick }: { volume: Volume; y: number; picked: boolean; last: boolean; onPick: () => void }) {
  const label = COVER.x + COVER.w + COVER.label / 2;
  const coverRef = useRef<HTMLDivElement>(null);
  const sweeping = useRef(false);
  // tapping a cover picks it, sweeps it over in teal, then opens the shop in a new tab
  const buy = () => {
    onPick();
    if (!coverRef.current || sweeping.current) return;
    sweeping.current = true;
    coverSweep(coverRef.current, {
      onCovered: () => {
        sweeping.current = false;
        openInNewTab(volume.href);
      },
    });
  };
  return (
    <article aria-label={`Vol. ${volume.number} ${volume.title}`}>
      {picked && <Place x={92} y={y + 8} w={6} h={COVER.h} ax="start" ay="start" z={4} className={styles.mark} />}
      <Place x={60} y={y} ax="start" ay="start" z={1} data-anim="shape">
        <BlockArt
          box={{ x: 60, y, w: 860, h: ROWS.h }}
          layout={{
            hairs: [slash(70, y + 190, 60, 2), slash(84, y + 196, 46, 1), slash(842, y + 150, 70, 1.6), slash(800, y + 210, 90, 1)],
            blocks: [{ x: 300, y: y + 120, w: 18, h: 80, fill: "teal" }],
            sparks: dots(820, y + 170, 3, 3, 14, 1.8),
          }}
        />
      </Place>

      <Flex x={COVER.x} y={y + 8} ax="start" ay="start" z={3}>
        <div ref={coverRef} data-anim="panel" className={`${styles.art} ${styles.framed} ${picked ? styles.colour : ""}`} style={{ position: "relative", width: u(COVER.w), height: u(COVER.h) }}>
          <button type="button" className={styles.pick} aria-label={`Vol. ${volume.number}: buy on Amazon`} onClick={buy}>
            <img src={volume.cover.src} alt={`Vol. ${volume.number} cover`} />
          </button>
        </div>
        <div data-anim="shape" className={`${styles.framed} ${styles.spine}`} style={{ width: u(COVER.label), height: u(COVER.h) }}>
          <Text size={8.5} tracking={0.18}>
            namo
          </Text>
          <Text variant="display" size={26} leading={34}>
            {volume.number}
          </Text>
        </div>
      </Flex>
      <Place x={label - 8} y={y + 96} ax="start" ay="start" z={4} data-anim="sparkle">
        <Sparkle size={16} waist={WAIST} color="var(--c-teal)" />
      </Place>
      <Place x={label - 9} y={y + 120} ax="start" ay="start" z={4} data-anim="vtext">
        <VerticalText lines={[volume.spine.slice(0, 6)]} size={13} leading={18} weight={600} />
      </Place>

      <Flex x={INFO_X} y={y + 8} ax="start" ay="start" z={5} dir="column">
        <Stack dir="row" align="baseline" gap={10}>
          <div data-anim="text">
            <Text variant="display" size={18} weight={500}>
              VOL.
            </Text>
          </div>
          <div data-anim="number">
            <Text variant="display" size={54} leading={56} weight={500}>
              {volume.number}
            </Text>
          </div>
        </Stack>
        <div data-anim="text" style={{ marginTop: u(12) }}>
          <Text variant="mincho" size={27} leading={34} weight={600} tracking={0.04} lang="ja">
            {volume.title}
          </Text>
        </div>
        <div data-anim="text" style={{ marginTop: u(14) }}>
          <Text variant="mono" size={18} tracking={0.16}>
            {volume.date}
          </Text>
        </div>
        <div data-anim="rule" style={{ marginTop: u(12) }}>
          <Rule length={240} thickness={1} />
        </div>
        <div data-anim="text" style={{ marginTop: u(11) }}>
          <Text variant="mono" size={18} tracking={0.16}>
            {volume.issues}
          </Text>
        </div>
      </Flex>
      <Place x={772} y={y + 60} w={56} h={56} ax="start" ay="start" z={5} data-anim="shape">
        <span className={styles.arrowCircle}>
          <svg viewBox="0 0 10 16" aria-hidden>
            <path d="M3 2l5 6-5 6" />
          </svg>
        </span>
      </Place>
      <Place x={742} y={y + 130} ax="start" ay="start" z={5} data-anim="sparkle">
        <Sparkle size={40} waist={WAIST} color="var(--c-ink)" />
      </Place>
      {!last && (
        <Place x={INFO_X - 10} y={y + ROWS.h - 4} ax="start" ay="start" z={5} data-anim="rule">
          <Rule length={540} thickness={1} />
        </Place>
      )}
    </article>
  );
}

/**
 * Volumes: the five books on one screen. The arrows (or tapping a book) pick one: it shows in colour with a teal
 * mark, and the counter follows.
 */
export function MobileVolumes() {
  const [active, setActive] = useState(0);
  const footY = ROWS.top + N * ROWS.h + 30;
  const go = (to: number) => setActive(((to % N) + N) % N);

  return (
    <MobilePage id="m-volumes" height={footY + 150}>
      <MobileBrand />
      <BrandTitle svg={titleSvg} label="MANGA VOLUMES" x={112} y={96} ax="start" ay="start" scale={0.98} starScale={0.8} z={6} />
      <Flex x={628} y={94} ax="start" ay="start" z={6} gap={21}>
        <div data-anim="rule">
          <Rule length={92} thickness={1.4} vertical />
        </div>
        <div data-anim="text" style={{ marginTop: u(4) }}>
          <Text variant="mono" size={17} leading={28} tracking={0.14} lines={["botan.church", "manga volume", "archive."]} />
        </div>
      </Flex>
      <Place x={800} y={170} ax="start" ay="start" z={6} data-anim="sparkle">
        <Sparkle size={52} waist={WAIST} color="var(--c-ink)" />
      </Place>
      <Place x={740} y={230} ax="start" ay="start" z={1} data-anim="shape">
        <BlockArt box={{ x: 740, y: 230, w: 170, h: 90 }} layout={{ sparks: dots(750, 240, 7, 5, 16, 1.8) }} />
      </Place>

      <PagerCounter
        x={112}
        y={330}
        ay="start"
        width={742}
        layout="inline"
        scale={1.6}
        sizes={{ number: 78, total: 34 }}
        index={active}
        count={N}
        onPrev={() => go(active - 1)}
        onNext={() => go(active + 1)}
        prevLabel="Previous volume"
        nextLabel="Next volume"
      />

      {VOLUMES.map((v, i) => (
        <VolumeRow key={v.number} volume={v} y={ROWS.top + i * ROWS.h} picked={i === active} last={i === N - 1} onPick={() => go(i)} />
      ))}

      <MobileFooter label={["Manga volumes", "archive"]} labelWidth={160} y={footY + 8} />
    </MobilePage>
  );
}
