export type Art = {
  src: string;
  /** Natural pixel size. */
  w: number;
  h: number;
  /** Point to keep in view when cropping (0..1 of the image), e.g. between the eyes. */
  focus: { x: number; y: number };
};

/**
 * Cover-fit `art` into `box` (same units as the box), keeping `focus` as close to the box centre as the crop
 * allows. `zoom` > 1 crops tighter (a detail shot). Returns the image rectangle to draw (clip it to the box).
 */
export function coverRect(box: { x: number; y: number; w: number; h: number }, art: Art, zoom = 1) {
  const s = Math.max(box.w / art.w, box.h / art.h) * zoom;
  const w = art.w * s;
  const h = art.h * s;
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return {
    x: box.x + clamp(box.w / 2 - art.focus.x * w, box.w - w, 0),
    y: box.y + clamp(box.h / 2 - art.focus.y * h, box.h - h, 0),
    w,
    h,
  };
}
