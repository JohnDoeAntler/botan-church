import { Place } from "../../components";
import { RotatingMangaPanel } from "./RotatingMangaPanel";
import { useMangaRotation } from "./useMangaRotation";

/** The manga panels, by shape (see mangaCrops.ts): tall left, wide top, near-square bottom right. */
const SLOTS = ["panel1", "panel2", "panel3"] as const;

/**
 * The three manga panels: a crop of each panel's shape, re-picked every 10 s once `rotating()` (the intro has
 * handed over). `data-live-art`: the intro draws whichever crop is showing inside the baked frame (animation/liveArt).
 */
export function HeroPanels({ rotating }: { rotating: () => boolean }) {
  const manga = useMangaRotation(SLOTS, { active: rotating });
  return (
    <>
      <Place x={176} y={393} w={176} h={285} z={2} data-anim="panel" data-live-art>
        <RotatingMangaPanel src={manga.panel1.src} alt="Botan, from the manga" delay={0.25} />
      </Place>
      <Place x={795} y={97} w={455} h={179} z={2} data-anim="panel" data-live-art>
        <RotatingMangaPanel src={manga.panel2.src} alt="Botan, from the manga" />
      </Place>
      <Place x={1333} y={635} w={270} h={207} z={2} data-anim="panel" data-live-art>
        <RotatingMangaPanel src={manga.panel3.src} alt="Botan, from the manga" delay={0.5} />
      </Place>
    </>
  );
}
