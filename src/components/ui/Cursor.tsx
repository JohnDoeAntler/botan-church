import gsap from "gsap";
import { useEffect, useRef } from "react";
import styles from "./Cursor.module.css";

/** Elements the cursor grows over. */
const CLICKABLE = 'a[href], button:not(:disabled), [role="button"], label, select, summary';
/** The dot's scale: at rest, and over something clickable (it is drawn at full size, so scaling down stays crisp). */
const SCALE = { rest: 0.2, link: 1 };
/** The preview's longest side, and its gap from the pointer (CSS px). */
const PREVIEW = 220;
const OFFSET = 24;

/** True while an intro / exit canvas covers the page `el` is on (the live page under it isn't what shows). */
const covered = (el: Element) => {
  const canvas = el.closest("main > div")?.querySelector("canvas");
  return !!canvas && canvas.style.visibility !== "hidden";
};

/**
 * The picture under the pointer (its source), if any: the first <img> or SVG <image> in the stack at (x, y), so a
 * link laid over a picture still counts. Pictures marked `data-cursor="plain"` (and their children) are skipped.
 */
function pictureAt(x: number, y: number): string | null {
  for (const el of document.elementsFromPoint(x, y)) {
    if (el.closest('[data-cursor="plain"]')) continue;
    const src = el instanceof HTMLImageElement ? el.currentSrc || el.src : el instanceof SVGImageElement ? el.href.baseVal : null;
    if (src) return covered(el) ? null : src;
  }
  return null;
}

/**
 * The site's pointer (mouse / trackpad only; the native one is hidden): a small filled dot that trails the pointer,
 * growing into a translucent ink disc over anything clickable. Over a picture, a small preview of the whole picture
 * (uncropped, in colour) follows beside it.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const preview = previewRef.current;
    const img = imgRef.current;
    if (!dot || !preview || !img || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.documentElement.classList.add(styles.active);

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.set(dot, { xPercent: -50, yPercent: -50, scale: SCALE.rest, autoAlpha: 0 });
    gsap.set(preview, { autoAlpha: 0, scale: 0.9 });
    const dotX = gsap.quickTo(dot, "x", { duration: still ? 0 : 0.12, ease: "power3.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: still ? 0 : 0.12, ease: "power3.out" });
    const previewX = gsap.quickTo(preview, "x", { duration: still ? 0 : 0.4, ease: "power3.out" });
    const previewY = gsap.quickTo(preview, "y", { duration: still ? 0 : 0.4, ease: "power3.out" });

    const pointer = { x: -200, y: -200, in: false };
    const size = { w: 0, h: 0 };
    let link = false;
    let shown: string | null = null;
    let dirty = false;

    /** Beside the pointer (below right), flipped to the other side near the window's edges. */
    const placePreview = () => {
      const x = pointer.x + OFFSET + size.w > window.innerWidth ? pointer.x - OFFSET - size.w : pointer.x + OFFSET;
      const y = pointer.y + OFFSET + size.h > window.innerHeight ? pointer.y - OFFSET - size.h : pointer.y + OFFSET;
      previewX(x);
      previewY(y);
    };
    const fit = () => {
      const k = PREVIEW / Math.max(img.naturalWidth, img.naturalHeight, 1);
      size.w = Math.round(img.naturalWidth * k);
      size.h = Math.round(img.naturalHeight * k);
      gsap.set(preview, { width: size.w, height: size.h });
      placePreview();
    };
    img.addEventListener("load", fit);

    const setLink = (on: boolean) => {
      if (on === link) return;
      link = on;
      dot.classList.toggle(styles.link, on);
      gsap.to(dot, { scale: on ? SCALE.link : SCALE.rest, duration: 0.35, ease: "power3.out", overwrite: "auto" });
    };
    const setPreview = (src: string | null) => {
      if (src === shown) return;
      shown = src;
      if (src) {
        if (img.getAttribute("src") !== src) img.src = src;
        if (img.complete && img.naturalWidth) fit();
        gsap.to(preview, { autoAlpha: 1, scale: 1, duration: 0.3, ease: "power3.out", overwrite: "auto" });
      } else gsap.to(preview, { autoAlpha: 0, scale: 0.9, duration: 0.2, ease: "power2.out", overwrite: "auto" });
    };

    // what's under the pointer, at most once a frame and only after something may have changed it
    const check = () => {
      if (!dirty || !pointer.in) return;
      dirty = false;
      const top = document.elementFromPoint(pointer.x, pointer.y);
      setLink(!!top?.closest(CLICKABLE));
      setPreview(pictureAt(pointer.x, pointer.y));
    };
    gsap.ticker.add(check);
    const changed = () => void (dirty = true);

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (!pointer.in) {
        pointer.in = true;
        gsap.set(dot, { x: pointer.x, y: pointer.y });
        gsap.to(dot, { autoAlpha: 1, duration: 0.2 });
      }
      dotX(pointer.x);
      dotY(pointer.y);
      if (shown) placePreview();
      dirty = true;
    };
    const leave = (e: PointerEvent) => {
      if (e.relatedTarget) return;
      pointer.in = false;
      gsap.to(dot, { autoAlpha: 0, duration: 0.2 });
      setLink(false);
      setPreview(null);
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerout", leave);
    // content can change under a still pointer: scrolling lists, switching entries, page transitions
    for (const type of ["wheel", "scroll", "pointerdown", "pointerup", "keyup"]) window.addEventListener(type, changed, { capture: true, passive: true });
    const timer = window.setInterval(changed, 250);

    return () => {
      document.documentElement.classList.remove(styles.active);
      gsap.ticker.remove(check);
      window.clearInterval(timer);
      img.removeEventListener("load", fit);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerout", leave);
      for (const type of ["wheel", "scroll", "pointerdown", "pointerup", "keyup"]) window.removeEventListener(type, changed, { capture: true });
      gsap.killTweensOf([dot, preview]);
    };
  }, []);

  return (
    <>
      <div ref={previewRef} className={styles.preview} aria-hidden>
        <img ref={imgRef} alt="" draggable={false} />
      </div>
      <div ref={dotRef} className={styles.dot} aria-hidden />
    </>
  );
}
