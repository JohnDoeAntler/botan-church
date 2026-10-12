import { useRef } from "react";
import { straightPath } from "../../animation/starFlight";
import { usePageIntro } from "../../animation/usePageIntro";
import { DecayFilters, LoadingScreen, PaperTexture, Stage, TintFilters } from "../../components";
import { DESIGN_SIZE } from "./heroContent";
import { HeroCopy } from "./HeroCopy";
import { HeroPanels } from "./HeroPanels";
import { HeroArtwork } from "./HeroArtwork";
import styles from "./Hero.module.css";

/**
 * The front page, composed on the 1672 × 941 design canvas (coordinates in design px, read off
 * the original design mock-up); the Stage scales the whole poster to the viewport. Artwork (HeroArtwork, HeroPanels) is
 * placed piece by piece; the copy (HeroCopy) is laid out in anchored stacks.
 */
export function Hero() {
  const stageRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  usePageIntro(stageRef, {
    bake: "hero",
    loader: loaderRef,
    // idle line boil: `frames` noise seeds cycled every `duration` seconds
    boil: { frames: 6, duration: 12 },
    // loader star → the O of the title: 0.5 s straight line on STAR_EASE; the intro starts on landing
    star: { duration: 0.5, path: straightPath },
    // the title leads the page-wide stagger, and its letters radiate out from the "O" (where the star lands)
    lead: '[data-anim="title"]',
    text: { glyphFrom: "O" },
    // the home page's panels zoom past their frames on purpose
    imageClip: false,
    ambientClass: styles.ready,
  });

  return (
    <>
      <LoadingScreen ref={loaderRef} />
      <Stage ref={stageRef} {...DESIGN_SIZE} className={styles.hero} id="home">
        <DecayFilters />
        <TintFilters />
        <HeroArtwork />
        <HeroPanels rotating={() => !!stageRef.current?.classList.contains(styles.ready)} />
        <HeroCopy />
        <PaperTexture intensity={0.32} style={{ zIndex: 10 }} />
      </Stage>
    </>
  );
}
