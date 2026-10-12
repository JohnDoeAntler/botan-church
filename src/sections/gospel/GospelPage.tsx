import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { spawnIn } from "../../animation/spawnIn";
import { swingPath } from "../../animation/starFlight";
import { usePageIntro } from "../../animation/usePageIntro";
import { useArrowKeySteps, useWheelSteps } from "../../animation/useWheelSteps";
import { DecayFilters, LoadingScreen, PaperTexture, Stage, TintFilters } from "../../components";
import { DESIGN_SIZE } from "../hero/heroContent";
import { ENTRIES, TIMELINE_WINDOW } from "./gospelContent";
import { GospelCollage } from "./GospelCollage";
import { GospelEntryView } from "./GospelEntryView";
import { GospelLeft } from "./GospelLeft";
import { GospelTimeline } from "./GospelTimeline";
import styles from "./GospelPage.module.css";

const N = ENTRIES.length;
const mod = (i: number) => ((i % N) + N) % N;

/** First entry of the timeline window once `to` is current: unchanged while `to` stays inside it. */
const windowStart = (start: number, to: number) =>
  Math.max(0, Math.min(to < start ? to : to >= start + TIMELINE_WINDOW ? to - TIMELINE_WINDOW + 1 : start, N - TIMELINE_WINDOW));

/**
 * Gospel: small everyday miracles, one entry at a time. Left half: the print collage, the GOSPEL title and the
 * counter; middle: a timeline of the entries; right half: the current entry (GospelEntryView). Wheel, arrows,
 * timeline nodes and ← → keys move between entries; the left half and timeline stay put.
 */
export function GospelPage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const entryRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [start, setStart] = useState(0); // first entry in the timeline window

  const intro = usePageIntro(stageRef, {
    bake: "gospel",
    loader: loaderRef,
    boil: { frames: 6, duration: 12 },
    star: { duration: 0.5, path: swingPath() },
    lead: '[data-anim="title"]',
    text: { glyphFrom: "O" },
    ambientClass: styles.ready,
  });

  // wheel, arrows, nodes and keys all go through here. Mid-intro the first move hands the entry, timeline and
  // counter over to the live DOM (usePageIntro release); before the intro has started it does nothing.
  const goRef = useRef((to: number) => void to);
  useEffect(() => {
    goRef.current = (to: number) => {
      const regions = [entryRef.current, timelineRef.current, counterRef.current].filter((el): el is HTMLDivElement => !!el);
      if (to === active || !regions.length || !intro.release(regions)) return;
      if (stageRef.current) stageRef.current.dataset.bakeStale = "1"; // the exit can't use the baked entry any more
      setStart(windowStart(start, to));
      setActive(to);
    };
  }, [intro, active, start]);
  const go = (to: number) => goRef.current(to);
  const step = (dir: number) => goRef.current(mod(active + dir));
  useWheelSteps(stageRef, step, { horizontal: true });
  useArrowKeySteps(step, { vertical: true });

  // a newly shown entry runs the entrance: its art sweeps in, its copy rises. Compared with the entry shown before
  // (not a "first run" flag), so StrictMode's double mount doesn't play it over the page intro
  const shownRef = useRef(active);
  useLayoutEffect(() => {
    if (shownRef.current === active) return;
    shownRef.current = active;
    const el = entryRef.current;
    return el ? spawnIn(el, { spread: 0.3 }) : undefined;
  }, [active]);

  return (
    <>
      <LoadingScreen ref={loaderRef} />
      <Stage ref={stageRef} {...DESIGN_SIZE} className={styles.page} id="gospel">
        <DecayFilters />
        <TintFilters />
        <GospelCollage />
        <GospelLeft active={active} count={N} onPrev={() => step(-1)} onNext={() => step(1)} counterRef={counterRef} />
        <GospelTimeline start={start} active={active} go={go} ref={timelineRef} />
        <div ref={entryRef} key={active} className={styles.entry}>
          <GospelEntryView entry={ENTRIES[active]} index={active} />
        </div>
        <PaperTexture intensity={0.32} style={{ zIndex: 10 }} />
      </Stage>
    </>
  );
}
