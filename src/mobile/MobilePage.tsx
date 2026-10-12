import { useRef, type ReactNode } from "react";
import { PaperTexture, Place, Sparkle, Stage, Text } from "../components";
import { useMobileIntro } from "./useMobileIntro";
import { TAGLINE_LINES } from "../sections/shared/siteCopy";
import { MOBILE_W, WAIST } from "./mobileKit";
import styles from "./mobile.module.css";

/**
 * One mobile page: a Stage `height` design px tall, with the paper grain and the light mobile entrance.
 * `scroll`: the page is taller than the screen and scrolls (the Stage spans the width); otherwise it fills one
 * screen (Places anchor to its top / bottom with `ay`).
 */
export function MobilePage({ id, height, scroll, children }: { id: string; height: number; scroll?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useMobileIntro(ref);
  return (
    <div className={scroll ? styles.scroll : styles.screen}>
      <Stage ref={ref} width={MOBILE_W} height={height} fit={scroll ? "width" : "fill"} id={id}>
        {children}
        <PaperTexture intensity={0.26} style={{ zIndex: 10 }} />
      </Stage>
    </div>
  );
}

/** What sits beside the shell's "botan.church" on each page: a tagline under it (`true`: the default one), or a star after it. */
export function MobileBrand({ tagline }: { tagline?: boolean | string[] }) {
  return (
    <>
      {tagline ? (
        <Place x={76} y={86} ax="start" ay="start" z={6} data-anim="text">
          <Text size={12} leading={20} tracking={0.26} lines={tagline === true ? TAGLINE_LINES : tagline} />
        </Place>
      ) : (
        <Place x={300} y={34} ax="start" ay="start" z={6} data-anim="sparkle">
          <Sparkle size={34} waist={WAIST} color="var(--c-ink)" />
        </Place>
      )}
    </>
  );
}
