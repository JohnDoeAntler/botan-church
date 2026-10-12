import gsap from "gsap";
import { staggerTime } from "./sweep";
import { sweepSvgArt } from "./sweepSvgArt";
import { textRise } from "./textRise";
import { textUnits } from "./units";

/**
 * Entrance for a single element that has just mounted (e.g. a list item scrolled into view), in the live DOM:
 * the print sweep on its images (`[data-art]`, SVG <image>s) and the per-character rise on its text, each spread
 * over `spread` seconds. Everything else appears as is. Call right after mount, before paint. Returns a disposer.
 */
export function spawnIn(root: Element, { spread = 0.2 } = {}) {
  const images = Array.from(root.querySelectorAll<SVGGraphicsElement>("image[data-art]"));
  const words = textUnits(root);
  const sweeps = images.map((img) => sweepSvgArt(img));
  const rise = textRise(words, words.map((_, k) => staggerTime(k, words.length, { amount: spread, ease: "none" })));
  const tl = gsap.timeline({ onComplete: () => rise.lower() });
  sweeps.forEach((s, k) => tl.add(s.timeline.play(), staggerTime(k, sweeps.length, { amount: spread, ease: "none" })));
  tl.add(rise.timeline.play(), 0);
  return () => {
    tl.kill();
    sweeps.forEach((s) => s.dispose());
    rise.dispose();
  };
}
