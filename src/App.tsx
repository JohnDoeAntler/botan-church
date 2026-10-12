import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes, useLocation, type Location } from "react-router-dom";
import { PageTransitionProvider } from "./animation/PageTransition";
import { IS_MOBILE } from "./mobile/device";
import { BASENAME } from "./lib/base";
import { useLeavingLocation } from "./animation/pageTransitionContext";
import { AboutPage } from "./sections/about/AboutPage";
import { GospelPage } from "./sections/gospel/GospelPage";
import { VolumesPage } from "./sections/volumes/VolumesPage";
import { FanartPage } from "./sections/fanart/FanartPage";
import { Hero } from "./sections/hero/Hero";
import { SiteChrome } from "./sections/shared/SiteChrome";
import { Cursor } from "./components";
import { fanartBake } from "./sections/fanart/fanartBake";
import { bakeBucket } from "./sections/shared/bakeBucket";
import { VOLUMES } from "./sections/volumes/volumesContent";
import { FANART } from "./sections/fanart/fanartContent";
import { ART } from "./sections/hero/heroContent";
import { ENTRIES } from "./sections/gospel/gospelContent";
import { mangaCropsUpNext } from "./sections/hero/useMangaRotation";
import { AVATAR } from "./sections/about/aboutLayout";

/** The site's pages. Add a route to add a page. */
function PageRoutes({ location }: { location: Location }) {
  return (
    <Routes location={location}>
      <Route path="/" element={<Hero />} />
      <Route path="/fanart" element={<FanartPage />} />
      <Route path="/gospel" element={<GospelPage />} />
      <Route path="/volumes" element={<VolumesPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="*" element={<Hero />} />
    </Routes>
  );
}

/** Every page's baked intro, decoded behind the first loading screen. */
const PRELOAD = ["hero", fanartBake, "gospel", () => bakeBucket("volumes"), "about"];
/** …and every page's artwork, so no page or scrolled-in item waits on an image. */
const IMAGES = [AVATAR.src, ART.character, ...mangaCropsUpNext(), ...new Set(ENTRIES.map((e) => e.art.src)), ...FANART.map((e) => e.art.src), ...VOLUMES.map((v) => v.cover.src)];

const layer = (z: number) => ({ position: "absolute", inset: 0, zIndex: z }) as const;

/**
 * Current page, plus the leaving page on top while a transition overlaps them. Keyed by path, so a page keeps its
 * DOM while it leaves and every navigation mounts a fresh page (and its intro).
 */
function Pages() {
  const location = useLocation();
  const leaving = useLeavingLocation();
  const pages = leaving && leaving.pathname !== location.pathname ? [location, leaving] : [location];
  return (
    <>
      {pages.map((loc, i) => (
        <div key={loc.pathname} style={layer(i + 1)}>
          <PageRoutes location={loc} />
        </div>
      ))}
    </>
  );
}

/** The desktop site (the 1672 × 941 composition). */
function DesktopApp() {
  return (
    <BrowserRouter basename={BASENAME}>
      <PageTransitionProvider preload={PRELOAD} images={IMAGES}>
        <main style={{ position: "relative", height: "100svh" }}>
          <Pages />
          <SiteChrome />
        </main>
        <Cursor />
      </PageTransitionProvider>
    </BrowserRouter>
  );
}

/** Phones get their own, lighter UI (its own bundle); everything else gets the desktop site unchanged. */
const MobileApp = lazy(() => import("./mobile/MobileApp"));

export default function App() {
  return IS_MOBILE ? (
    <Suspense fallback={null}>
      <MobileApp />
    </Suspense>
  ) : (
    <DesktopApp />
  );
}
