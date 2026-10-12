import gsap from "gsap";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { spawnIn } from "../../animation/spawnIn";
import { sPath } from "../../animation/starFlight";
import { SWEEP_EASE } from "../../animation/sweep";
import { usePageIntro } from "../../animation/usePageIntro";
import { useArrowKeySteps, useWheelSteps } from "../../animation/useWheelSteps";
import { DecayFilters, LoadingScreen, PaperTexture, Stage, TintFilters } from "../../components";
import { DESIGN_SIZE } from "../hero/heroContent";
import { bakeBucket, spareWidth } from "../shared/bakeBucket";
import { VOLUMES } from "./volumesContent";
import { VolumesCarousel } from "./VolumesCarousel";
import { VolumesFooter } from "./VolumesFooter";
import { VolumesHeader } from "./VolumesHeader";
import styles from "./VolumesPage.module.css";

/** Carousel slots: the first full one's x, the pitch. Slot -1 peeks in on the left, slots 4–5 on the right. */
const X0 = 142;
const PITCH = 348;
const SLOTS = [-1, 0, 1, 2, 3, 4, 5];
const N = VOLUMES.length;
const mod = (i: number) => ((i % N) + N) % N;

/** Manga volumes: a cyclic carousel of manga volumes (wheel, arrows, dots), shared frame / nav / transitions. */
export function VolumesPage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listBoxRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState(0);
  const active = mod(start);
  const step = useRef(0); // slots moved by the last change: +1 = next (items move left)
  // the intro baked closest to this width (fixed at mount: that's the one loaded); slots on the right show more of
  // themselves on wide screens
  const bake = useMemo(() => bakeBucket("volumes"), []);

  const intro = usePageIntro(stageRef, {
    bake,
    loader: loaderRef,
    boil: { frames: 6, duration: 12 },
    star: { duration: 0.5, path: sPath(0.35) },
    lead: '[data-anim="title"]',
    text: { glyphFrom: "O" },
    ambientClass: styles.ready,
  });

  const slots = useMemo(() => SLOTS.map((k) => ({ key: start + k, volume: VOLUMES[mod(start + k)], x: X0 + k * PITCH })), [start]);

  // one way in for wheel, arrows and dots. During the intro the first move hands the carousel (and the controls
  // that follow it) over to the live DOM (usePageIntro release); before the intro has started it does nothing.
  const goRef = useRef((delta: number) => void delta);
  useEffect(() => {
    goRef.current = (delta: number) => {
      const regions = [listBoxRef.current, controlsRef.current, paginationRef.current].filter((el): el is HTMLDivElement => !!el);
      if (!delta || !regions.length || !intro.release(regions)) return;
      step.current = delta;
      if (stageRef.current) stageRef.current.dataset.bakeStale = "1"; // the exit can't use the baked slots any more
      setStart((s) => s + delta);
    };
  }, [intro]);
  const go = (delta: number) => goRef.current(delta);

  // wheel (either direction) and ← → step through the volumes
  useWheelSteps(stageRef, (dir) => goRef.current(dir), { horizontal: true });
  useArrowKeySteps((dir) => goRef.current(dir));

  // slide the window over by the slots it moved, and run the entrance on items that just appeared
  const shownRef = useRef<number[]>(slots.map((s) => s.key));
  const spawned = useRef(new Map<number, () => void>());
  useLayoutEffect(() => {
    const list = listRef.current;
    const before = new Set(shownRef.current);
    shownRef.current = slots.map((s) => s.key);
    if (!list || !step.current) return;
    const unit = Number.parseFloat(getComputedStyle(list).getPropertyValue("--u")) || 1;
    gsap.fromTo(list, { x: step.current * PITCH * unit }, { x: 0, duration: 1, ease: SWEEP_EASE, overwrite: true, clearProps: "transform" });
    step.current = 0;
    for (const [key, dispose] of spawned.current) {
      if (!shownRef.current.includes(key)) {
        dispose();
        spawned.current.delete(key);
      }
    }
    for (const slot of slots) {
      if (before.has(slot.key)) continue;
      const el = list.querySelector(`[data-entry="${slot.key}"]`);
      if (el) spawned.current.set(slot.key, spawnIn(el));
    }
  }, [slots]);

  // keep layout in step with the window (the carousel itself is anchored left, so only the bake can go stale)
  useEffect(() => {
    const onResize = () => {
      if (bakeBucket("volumes", spareWidth()) !== bake && stageRef.current) stageRef.current.dataset.bakeStale = "1";
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [bake]);

  return (
    <>
      <LoadingScreen ref={loaderRef} />
      <Stage ref={stageRef} {...DESIGN_SIZE} className={styles.page} id="volumes">
        <DecayFilters />
        <TintFilters />
        <VolumesHeader active={active} count={N} onPrev={() => go(-1)} onNext={() => go(1)} controlsRef={controlsRef} />
        <VolumesCarousel slots={slots} boxRef={listBoxRef} listRef={listRef} />
        <VolumesFooter active={active} go={go} paginationRef={paginationRef} />
        <PaperTexture intensity={0.32} style={{ zIndex: 10 }} />
      </Stage>
    </>
  );
}
