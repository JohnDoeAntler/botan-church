import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { panelIn, panelOut } from "../animation/panelSwap";

/**
 * An <img> whose picture changes when `src` does, with the page exit / start presets (see panelSwap): put it in
 * a frame with overflow hidden (its parent is the frame).
 */
export function RotatingImg({ src, alt, delay = 0 }: { src: string; alt: string; delay?: number }) {
  const ref = useRef<HTMLImageElement>(null);
  const [shown, setShown] = useState(src);
  const shownRef = useRef(src);
  const arriving = useRef(false);

  // a new src: the current picture leaves; once it's under the sweep, the new one is swapped in beneath the
  // copies, which then wipe away to uncover it. Runs to its end (only a newer src or unmounting stops it).
  useEffect(() => {
    const img = ref.current;
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
    if (!arriving.current || !ref.current) return;
    arriving.current = false;
    const tl = panelIn(ref.current);
    return () => void tl.kill();
  }, [shown]);

  return <img ref={ref} src={shown} alt={alt} draggable={false} />;
}
