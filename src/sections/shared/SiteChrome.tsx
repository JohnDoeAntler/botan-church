import { useLocation } from "react-router-dom";
import { NavBar, PageFrame, Place, Stage, Text } from "../../components";
import { DESIGN_SIZE } from "../hero/heroContent";
import { NAV_ITEMS } from "./nav";
import styles from "./SiteChrome.module.css";

/**
 * The frame, brand ("botan.church", top left) and nav every page shares. Lives outside the pages (above them, below the travel star), so it stays
 * put through page transitions; only the first loading screen's intro animates it, as part of that page's wave
 * (usePageIntro looks it up by `data-site-chrome` and reveals it by setting `data-shown`).
 */
export function SiteChrome() {
  const location = useLocation();
  if (new URLSearchParams(location.search).has("bake")) return null; // never part of a page's baked bitmaps
  return (
    <div className={styles.chrome} data-site-chrome>
      <Stage {...DESIGN_SIZE} style={{ background: "transparent" }}>
        <Place x={1040} y={28} ax="end" ay="start" w={574} z={8} data-anim="nav" style={{ pointerEvents: "auto" }}>
          <NavBar items={NAV_ITEMS} activeHref={location.pathname} spacing={34} />
        </Place>
        <Place x={58} y={36} ax="start" ay="start" z={8} data-anim="text">
          <Text variant="caps" size={14} tracking={0.16} weight={400} style={{ textTransform: "none" }}>
            botan.church
          </Text>
        </Place>
        <PageFrame data-anim="frame" style={{ zIndex: 8 }} />
      </Stage>
    </div>
  );
}
