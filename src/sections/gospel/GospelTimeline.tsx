import gsap from "gsap";
import { useLayoutEffect, useRef, type Ref } from "react";
import { SWEEP_EASE } from "../../animation/sweep";
import { Flex, Place, Rule, Sparkle, Stack, Text } from "../../components";
import { COPY, TIMELINE_WINDOW } from "./gospelContent";
import styles from "./GospelPage.module.css";

const pad2 = (n: number) => String(n).padStart(2, "0");
const WAIST = 4;
/** The line down the middle (design px), and the band its nodes are spread over, evenly. */
const LINE = { x: 737, top: 55, bottom: 890 };
const NODES = { top: 152, bottom: 810 };

/**
 * The timeline: a window of TIMELINE_WINDOW entries from `start`, one node + number each, the current one a teal
 * target. When the window moves, its numbers slide in from the side it moved towards. `ref`: handed over with
 * the entry mid-intro.
 */
export function GospelTimeline({ start, active, go, ref }: { start: number; active: number; go: (to: number) => void; ref: Ref<HTMLDivElement> }) {
  const list = useRef<HTMLDivElement>(null);
  const prev = useRef(start);
  useLayoutEffect(() => {
    const dir = Math.sign(start - prev.current);
    prev.current = start;
    const labels = list.current?.querySelectorAll("[data-node-label]");
    if (!dir || !labels?.length) return;
    gsap.fromTo(labels, { yPercent: 70 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: SWEEP_EASE, stagger: 0.04, clearProps: "transform,opacity" });
  }, [start]);

  return (
    <div ref={ref} className={styles.controls}>
      <Place x={LINE.x} y={LINE.top} ax="end" ay="start" z={4} data-anim="rule">
        <Rule length={LINE.bottom - LINE.top} thickness={1.2} vertical />
      </Place>
      {[
        { x: 729, y: 69, s: 16 },
        { x: 759, y: 201, s: 18 },
        { x: 729, y: 880, s: 16 },
      ].map((s, i) => (
        <Place key={i} x={s.x} y={s.y} ax="end" ay="start" z={5} data-anim="sparkle">
          <Sparkle size={s.s} waist={WAIST} color="var(--c-ink)" />
        </Place>
      ))}
      <Place x={773} y={730} ax="end" ay="start" z={5} data-anim="sparkle">
        <Sparkle size={18} waist={WAIST} color="var(--c-teal)" />
      </Place>

      <Flex ref={list} x={LINE.x - 15} y={NODES.top} h={NODES.bottom - NODES.top} ax="end" ay="start" z={6} dir="column" justify="between">
        {Array.from({ length: TIMELINE_WINDOW }, (_, k) => {
          const i = start + k;
          const current = i === active;
          return (
            <Stack key={k} dir="row" align="center" gap={5}>
              <div data-anim="shape" className={styles.nodeBox}>
                <button
                  type="button"
                  className={styles.node}
                  data-active={current || undefined}
                  aria-label={`${COPY.label} ${pad2(i + 1)}`}
                  aria-current={current || undefined}
                  onClick={() => go(i)}
                />
              </div>
              <div data-anim="text" data-node-label>
                <Text key={`${i}-${current}`} size={14} tracking={0.06} weight={400} color={current ? "var(--c-teal)" : undefined}>
                  {pad2(i + 1)}
                </Text>
              </div>
            </Stack>
          );
        })}
      </Flex>
    </div>
  );
}
