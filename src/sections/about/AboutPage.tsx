import { useRef } from "react";
import { sPath } from "../../animation/starFlight";
import { usePageIntro } from "../../animation/usePageIntro";
import { DecayFilters, LoadingScreen, PaperTexture, Stage, TintFilters } from "../../components";
import { DESIGN_SIZE } from "../hero/heroContent";
import { AboutBackdrop } from "./AboutBackdrop";
import { AboutCentre } from "./AboutCentre";
import { AboutMargins } from "./AboutMargins";
import styles from "./AboutPage.module.css";

/**
 * About: what this site is, with links to the people and places behind it. Centre column: the portrait, the
 * ABOUT title, the catch line, the introduction and a row of link cards; margins: the print artwork and the
 * small captions.
 */
export function AboutPage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  usePageIntro(stageRef, {
    bake: "about",
    loader: loaderRef,
    boil: { frames: 6, duration: 12 },
    star: { duration: 0.5, path: sPath(-0.3) },
    lead: '[data-anim="title"]',
    text: { glyphFrom: "O" },
    ambientClass: styles.ready,
  });

  return (
    <>
      <LoadingScreen ref={loaderRef} />
      <Stage ref={stageRef} {...DESIGN_SIZE} className={styles.page} id="about">
        <DecayFilters />
        <TintFilters />
        <AboutBackdrop />
        <AboutMargins />
        <AboutCentre />
        <PaperTexture intensity={0.32} style={{ zIndex: 10 }} />
      </Stage>
    </>
  );
}
