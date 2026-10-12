import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { preloadImages } from "../animation/preloadImages";
import { DecayFilters, PageFrame, TintFilters } from "../components";
import { VOLUMES } from "../sections/volumes/volumesContent";
import { FANART } from "../sections/fanart/fanartContent";
import { ENTRIES } from "../sections/gospel/gospelContent";
import { ART } from "../sections/hero/heroContent";
import { mangaCropsUpNext } from "../sections/hero/useMangaRotation";
import { AVATAR } from "../sections/about/aboutLayout";
import { NAV_ITEMS } from "../sections/shared/nav";
import { TAGLINE } from "../sections/shared/siteCopy";
import { MobileAbout } from "./pages/MobileAbout";
import { MobileFanart } from "./pages/MobileFanart";
import { MobileGospel } from "./pages/MobileGospel";
import { MobileHome } from "./pages/MobileHome";
import { MobileVolumes } from "./pages/MobileVolumes";
import styles from "./mobile.module.css";

/** Every page's artwork, decoded behind the loading screen so no page waits on an image. */
const IMAGES = [
  AVATAR.src,
  ART.character,
  ...mangaCropsUpNext(),
  ...FANART.map((e) => e.art.src),
  ...VOLUMES.map((v) => v.cover.src),
  ...new Set(ENTRIES.map((e) => e.art.src)),
];

/** First load: fonts + artwork with a progress count, then the page fades in under it. */
function Loader({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let alive = true;
    const fonts = document.fonts?.ready ?? Promise.resolve();
    void Promise.all([fonts, preloadImages(IMAGES, (f) => alive && setPct(Math.round(f * 100)))]).then(() => {
      if (!alive) return;
      setPct(100);
      onDone();
      gsap.to(ref.current, { autoAlpha: 0, duration: 0.45, delay: 0.1, ease: "power2.out" });
    });
    return () => void (alive = false);
  }, [onDone]);
  return (
    <div ref={ref} className={styles.loader} role="status" aria-live="polite">
      <p className={styles.loaderBrand}>botan.church</p>
      <p className={styles.loaderCount}>{String(pct).padStart(3, "0")}</p>
      <div className={styles.loaderBar}>
        <span style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
    </div>
  );
}

/**
 * The mobile shell: "botan.church" (the same on every page, never re-mounted), a fixed print frame and MENU
 * button over the pages, the menu overlay, and page changes as a
 * quick cross-fade (the current page fades out, the next scrolls to the top and runs its light entrance).
 */
function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const [menu, setMenu] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    const go = (href: string) => {
      setMenu(false);
      if (busy.current || href === window.location.pathname) return;
      busy.current = true;
      gsap.to(mainRef.current, {
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          navigate(href);
          window.scrollTo(0, 0);
          gsap.set(mainRef.current, { opacity: 1 });
          busy.current = false;
        },
      });
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      const href = a?.getAttribute("href") ?? "";
      if (!a || !href.startsWith("/") || href.startsWith("//") || a.target) return;
      e.preventDefault();
      go(href);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [navigate]);

  return (
    <>
      <main ref={mainRef}>
        <Routes location={location}>
          <Route path="/fanart" element={<MobileFanart />} />
          <Route path="/gospel" element={<MobileGospel />} />
          <Route path="/volumes" element={<MobileVolumes />} />
          <Route path="/about" element={<MobileAbout />} />
          <Route path="*" element={<MobileHome />} />
        </Routes>
      </main>

      <p className={styles.brand}>botan.church</p>
      <div className={styles.frame} aria-hidden>
        <PageFrame />
      </div>
      <button type="button" className={styles.menuButton} aria-expanded={menu} aria-label="Menu" onClick={() => setMenu((m) => !m)}>
        <span className={styles.menuLabel}>{menu ? "Close" : "Menu"}</span>
        <span className={styles.menuLines} data-open={menu || undefined}>
          <i />
          <i />
          <i />
        </span>
      </button>
      <nav className={styles.menu} data-open={menu || undefined} aria-hidden={!menu}>
        <p className={styles.menuBrand}>botan.church</p>
        <ul>
          {NAV_ITEMS.map((item, i) => (
            <li key={item.href}>
              <a href={item.href} className={styles.menuLink} aria-current={location.pathname === item.href ? "page" : undefined} tabIndex={menu ? 0 : -1}>
                <span className={styles.menuIndex}>{String(i + 1).padStart(2, "0")}</span>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <p className={styles.menuFoot}>{TAGLINE}</p>
      </nav>
    </>
  );
}

/** The mobile UI: its own lighter pages for the same routes (see device.ts for when it is used). */
export default function MobileApp() {
  const [ready, setReady] = useState(false);
  const onLoaded = useCallback(() => setReady(true), []);
  return (
    <BrowserRouter>
      <DecayFilters />
      <TintFilters />
      {ready && <Shell />}
      <Loader onDone={onLoaded} />
    </BrowserRouter>
  );
}
