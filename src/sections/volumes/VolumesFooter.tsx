import type { Ref } from "react";
import { Barcode, DotGrid, Flex, Place, Rule, SlashLines, Sparkle, Stack, Text } from "../../components";
import { COPY, VOLUMES } from "./volumesContent";
import styles from "./VolumesPage.module.css";

const pad2 = (n: number) => String(n).padStart(2, "0");
const N = VOLUMES.length;

/** Left: the colophon (barcode, est.), a star, and the two small captions with their dot rows. */
function FooterColophon() {
  return (
    <Flex x={50} y={826} ax="start" ay="end" z={6} align="center" gap={20}>
      <Stack gap={8}>
        <div data-anim="barcode">
          <Barcode width={120} height={40} />
        </div>
        <div data-anim="text">
          <Text variant="mono" size={9.5} leading={17} tracking={0.18} lines={COPY.footer.est} />
        </div>
      </Stack>
      <div data-anim="sparkle" style={{ marginLeft: "calc(20 * var(--u))" }}>
        <Sparkle size={26} color="var(--c-ink)" />
      </div>
      <div data-anim="rule">
        <Rule length={56} thickness={1.2} vertical />
      </div>
      <Stack gap={18}>
        <div data-anim="text">
          <Text variant="mincho" size={16} tracking={0.08} weight={500} lang="ja">
            {COPY.footer.line}
          </Text>
        </div>
        <div data-anim="dots">
          <DotGrid rows={1} cols={8} pitch={18} dot={2.6} color="var(--c-ink)" />
        </div>
      </Stack>
      <Stack gap={14}>
        <div data-anim="text">
          <Text size={7.6} leading={13} tracking={0.22} lines={COPY.footer.story} />
        </div>
        <div data-anim="dots">
          <DotGrid rows={1} cols={5} pitch={14} dot={2.6} color="var(--c-teal)" />
        </div>
      </Stack>
    </Flex>
  );
}

/**
 * Centre: slashes, then ← one dot per volume → ; the dots spread evenly over a rule (CSS), the current one teal.
 * `ref`: the pagination follows the carousel, so it is handed over with it mid-intro.
 */
function FooterPagination({ active, go, ref }: { active: number; go: (delta: number) => void; ref: Ref<HTMLDivElement> }) {
  return (
    <Flex ref={ref} x={667} y={849} ax="center" ay="end" z={6} align="center" gap={14}>
      <div data-anim="slash" style={{ marginRight: "calc(5 * var(--u))" }}>
        <SlashLines width={30} height={14} count={4} spacing={6} color="var(--c-ink)" thickness={1} />
      </div>
      <div data-anim="shape">
        <button type="button" className={styles.footArrow} aria-label="Previous volume" onClick={() => go(-1)}>
          ←
        </button>
      </div>
      <div className={styles.dots}>
        <span data-anim="rule" className={styles.dotsLine} />
        {VOLUMES.map((v, i) => (
          <div key={v.number} data-anim="shape" className={styles.dotBox}>
            <button
              type="button"
              className={styles.dot}
              data-active={i === active || undefined}
              aria-label={`Volume ${v.number}`}
              aria-current={i === active || undefined}
              onClick={() => go(i - active)}
            />
          </div>
        ))}
      </div>
      <div data-anim="shape">
        <button type="button" className={styles.footArrow} aria-label="Next volume" onClick={() => go(1)}>
          →
        </button>
      </div>
    </Flex>
  );
}

/** Right: the archive label, a star, a ringed star, "01 — 05 / scroll for more", and the closing line. */
function FooterArchive() {
  return (
    <Flex x={1068} y={834} ax="end" ay="end" z={6} align="center" gap={30}>
      <Stack gap={6}>
        <div data-anim="shape" className={styles.box}>
          <Text size={7.2} leading={12} tracking={0.2} lines={COPY.footer.box} />
        </div>
        <div data-anim="shape">
          <svg viewBox="0 0 40 14" className={styles.rings} aria-hidden>
            {[7, 20, 33].map((cx) => (
              <circle key={cx} cx={cx} cy={7} r={6} />
            ))}
          </svg>
        </div>
      </Stack>
      <div data-anim="sparkle">
        <Sparkle size={22} color="var(--c-ink)" />
      </div>
      <div data-anim="shape" className={styles.ringStar}>
        <svg viewBox="0 0 36 36" aria-hidden>
          <circle cx={18} cy={18} r={17} />
        </svg>
        <Sparkle size={20} color="var(--c-ink)" />
      </div>
      <div data-anim="rule">
        <Rule length={58} thickness={1.2} vertical />
      </div>
      <Stack gap={10}>
        <Stack dir="row" align="center" gap={8}>
          <div data-anim="text">
            <Text variant="display" size={17} weight={500}>
              {pad2(1)}
            </Text>
          </div>
          <div data-anim="rule">
            <Rule length={34} thickness={1} />
          </div>
          <div data-anim="text">
            <Text variant="display" size={17} weight={500}>
              {pad2(N)}
            </Text>
          </div>
        </Stack>
        <div data-anim="text">
          <Text size={7.6} leading={13} tracking={0.22} lines={COPY.footer.scroll} />
        </div>
      </Stack>
      <div data-anim="rule">
        <Rule length={58} thickness={1.2} vertical />
      </div>
      <div data-anim="text">
        <Text variant="gothic" size={11.5} leading={21} tracking={0.12} lines={COPY.footer.end} lang="ja" />
      </div>
    </Flex>
  );
}

/** The bottom band of the page. */
export function VolumesFooter({ active, go, paginationRef }: { active: number; go: (delta: number) => void; paginationRef: Ref<HTMLDivElement> }) {
  return (
    <>
      <FooterColophon />
      <FooterPagination active={active} go={go} ref={paginationRef} />
      <FooterArchive />
      <Place x={1612} y={830} ax="end" ay="end" z={1} data-anim="dots">
        <DotGrid rows={4} cols={3} pitch={10} dot={2} />
      </Place>
    </>
  );
}
