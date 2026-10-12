import { useEffect, useRef, useState } from "react";
import { decodeImage } from "../../animation/preloadImages";
import { MANGA_CROPS, type MangaCrop } from "./mangaCrops";

type Slot = keyof typeof MANGA_CROPS;

const pick = (slot: Slot, not?: MangaCrop) => {
  const pool = MANGA_CROPS[slot].filter((c) => c !== not);
  return pool[Math.floor(Math.random() * pool.length)] ?? MANGA_CROPS[slot][0];
};

/**
 * The crops the next mount of the page will open with, chosen and decoded in the background while it's away, so a
 * page coming back never waits on them (its intro waits for its images: a fresh random pick would hold it up).
 */
const upNext: Partial<Record<Slot, MangaCrop>> = {};
/**
 * The crops the front page will open with, for the loading screen to decode up front (whichever page the visit
 * starts on, the first trip to the front page then never waits on its panels).
 */
export function mangaCropsUpNext() {
  return (Object.keys(MANGA_CROPS) as Slot[]).map((s) => (upNext[s] ??= pick(s)).src);
}

const queueNext = (slots: readonly Slot[], showing: Partial<Record<Slot, MangaCrop>>) => {
  for (const s of slots) {
    upNext[s] = pick(s, showing[s]);
    void decodeImage(upNext[s].src);
  }
};

/**
 * One manga crop per panel slot (from the crops of that panel's shape, see mangaCrops.ts), picked at random when
 * the page mounts and re-picked every `every` seconds (never the one already showing). The next set is decoded
 * before it is swapped in, so a panel never shows an empty frame. `active()` gates the swaps (e.g. not mid-intro).
 * The next mount opens with crops already decoded in the background (see upNext).
 */
export function useMangaRotation<S extends Slot>(slots: readonly S[], { every = 10, active }: { every?: number; active?: () => boolean } = {}) {
  const [shown, setShown] = useState(() => Object.fromEntries(slots.map((s) => [s, upNext[s] ?? pick(s)])) as Record<S, MangaCrop>);
  const shownRef = useRef(shown);
  const activeRef = useRef(active);
  useEffect(() => {
    shownRef.current = shown;
    activeRef.current = active;
  });
  const key = slots.join(",");

  useEffect(() => {
    const keys = key.split(",") as S[];
    let alive = true;
    // the next visit's crops, decoded once this page has settled
    const idle = window.setTimeout(() => queueNext(keys, shownRef.current), 4000);
    const id = window.setInterval(() => {
      if (activeRef.current && !activeRef.current()) return;
      const next = Object.fromEntries(keys.map((s) => [s, pick(s, shownRef.current[s])])) as Record<S, MangaCrop>;
      void Promise.all(keys.map((s) => decodeImage(next[s].src))).then(() => alive && setShown(next));
    }, every * 1000);
    return () => {
      alive = false;
      window.clearInterval(id);
      window.clearTimeout(idle);
    };
  }, [key, every]);

  return shown;
}
