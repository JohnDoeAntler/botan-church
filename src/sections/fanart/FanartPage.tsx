import gsap from "gsap";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { spawnIn } from "../../animation/spawnIn";
import { loopPath } from "../../animation/starFlight";
import { SWEEP_EASE } from "../../animation/sweep";
import { usePageIntro } from "../../animation/usePageIntro";
import { useWheelSteps } from "../../animation/useWheelSteps";
import { DecayFilters, LoadingScreen, PaperTexture, Stage, TintFilters } from "../../components";
import { DESIGN_SIZE } from "../hero/heroContent";
import { fanartBake, spareWidth } from "./fanartBake";
import { FanartBrand } from "./FanartBrand";
import { FANART, LIST_REGION } from "./fanartContent";
import { FanartDecor } from "./FanartDecor";
import { placeWindow, planEntries } from "./fanartLayout";
import { FanartList } from "./FanartList";
import styles from "./FanartPage.module.css";

/**
 * Fanart archive: the brand column on the left, a vertical list of fanart items on the right (procedurally laid
 * out, see fanartLayout), scrolled one item per wheel step.
 */
export function FanartPage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const plans = useMemo(() => planEntries(FANART, LIST_REGION), []);
  const [start, setStart] = useState(0);
  // wide screens: the list reaches the right edge (its artwork takes the spare width) instead of floating centred
  const [spare, setSpare] = useState(() => spareWidth());
  const region = useMemo(() => ({ ...LIST_REGION, right: LIST_REGION.right + spare }), [spare]);
  const items = useMemo(() => placeWindow(plans, start, region), [plans, start, region]);
  const listRef = useRef<HTMLDivElement>(null);
  const listBoxRef = useRef<HTMLDivElement>(null);
  const step = useRef(0); // +1 = scrolled down, -1 = up
  // the intro baked closest to this width (fixed at mount: that's the one loaded)
  const bake = useMemo(() => fanartBake(), []);

  const intro = usePageIntro(stageRef, {
    bake,
    loader: loaderRef,
    boil: { frames: 6, duration: 12 },
    star: { duration: 0.5, path: loopPath() },
    lead: '[data-anim="title"]',
    text: { glyphFrom: "O" },
    ambientClass: styles.ready,
  });

  useEffect(() => {
    const onResize = () => {
      const next = spareWidth();
      setSpare(next);
      // the list no longer matches the loaded bake: the exit falls back to the flicker
      if (fanartBake(next) !== bake && stageRef.current) stageRef.current.dataset.bakeStale = "1";
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [bake]);

  // wheel: one item per step. Works during the intro too: the first scroll hands the list over to the live DOM
  // (usePageIntro release)
  useWheelSteps(stageRef, (dir) => {
    if (!listBoxRef.current || !intro.release(listBoxRef.current)) return;
    step.current = dir;
    if (stageRef.current) stageRef.current.dataset.bakeStale = "1"; // the visible items no longer match the baked ones
    setStart((s) => s + dir);
  });

  // slide the new window in (from -50 / +50 design px to 0) and run the page-load entrance on items that just appeared
  const shownRef = useRef<number[]>([]);
  const spawned = useRef(new Map<number, () => void>());
  useLayoutEffect(() => {
    const list = listRef.current;
    const before = new Set(shownRef.current);
    shownRef.current = items.map((i) => i.index);
    if (!list || !step.current) return;
    const unit = Number.parseFloat(getComputedStyle(list).getPropertyValue("--u")) || 1;
    gsap.fromTo(list, { y: -50 * step.current * unit }, { y: 0, duration: 1, ease: SWEEP_EASE, overwrite: true, clearProps: "transform" });
    step.current = 0; // consumed: a re-layout (resize) is not a scroll

    for (const [index, dispose] of spawned.current) {
      if (!shownRef.current.includes(index)) {
        dispose();
        spawned.current.delete(index);
      }
    }
    for (const item of items) {
      if (before.has(item.index)) continue;
      const el = list.querySelector(`[data-entry="${item.index}"]`);
      if (el) spawned.current.set(item.index, spawnIn(el));
    }
  }, [items]);

  return (
    <>
      <LoadingScreen ref={loaderRef} />
      <Stage ref={stageRef} {...DESIGN_SIZE} className={styles.page} id="fanart">
        <DecayFilters />
        <TintFilters />
        <FanartDecor />
        <FanartBrand />
        <FanartList items={items} boxRef={listBoxRef} listRef={listRef} />
        <PaperTexture intensity={0.32} style={{ zIndex: 10 }} />
      </Stage>
    </>
  );
}
