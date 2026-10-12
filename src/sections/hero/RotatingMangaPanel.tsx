import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { panelIn, panelOut } from "../../animation/panelSwap";
import { MangaPanel } from "../../components";

/**
 * A manga panel whose picture changes when `src` does: the current one leaves like a page exit (flicker, shrink,
 * the print sweep covers it), the new one is swapped in under the sweep's ink + teal copies and arrives like a page
 * start (flicker while zooming in) as they wipe away. All inside the frame; `delay` staggers the panels.
 */
export function RotatingMangaPanel({ src, alt, delay = 0 }: { src: string; alt: string; delay?: number }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(src);
  const shownRef = useRef(src);
  const arriving = useRef(false);

  // a new src: the current picture leaves; once it's under the sweep, the new one is swapped in beneath the
  // copies, which then wipe away to uncover it. Runs to its end (only a newer src or unmounting stops it).
  useEffect(() => {
    const frame = ref.current;
    const img = frame?.querySelector("img");
    const area = img?.parentElement;
    if (src === shownRef.current || !img || !area) return;
    const out = panelOut(area, img, {
      delay,
      onCleared: () => {
        arriving.current = true;
        shownRef.current = src;
        setShown(src);
      },
    });
    return out.cleanup;
  }, [src, delay]);

  useLayoutEffect(() => {
    const img = ref.current?.querySelector("img");
    if (!arriving.current || !img) return;
    arriving.current = false;
    const tl = panelIn(img);
    return () => void tl.kill();
  }, [shown]);

  // black behind the picture: what shows while it shrinks away and through the flicker cuts
  return <MangaPanel ref={ref} src={shown} alt={alt} background="var(--c-ink)" />;
}
