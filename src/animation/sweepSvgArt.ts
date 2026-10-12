import gsap from "gsap";
import { SWEEP_EASE } from "./sweep";

const NS = "http://www.w3.org/2000/svg";
const OFFSETS = { underIn: 0, topIn: 1 / 24, originalIn: 3 / 24, topOut: 6 / 24, underOut: 7 / 24 };
let uid = 0;

type Box = { x: number; y: number; w: number; h: number };

/** The rectangle an SVG image is shown in: its parent group's clip rect, else its own bbox. */
function shownBox(img: SVGGraphicsElement): Box {
  const ref = img.parentElement?.getAttribute("clip-path")?.match(/#([^)"']+)/)?.[1];
  const rect = ref ? img.ownerSVGElement?.querySelector(`[id="${ref}"] rect`) : null;
  if (rect) {
    const n = (a: string) => Number.parseFloat(rect.getAttribute(a) ?? "0");
    return { x: n("x"), y: n("y"), w: n("width"), h: n("height") };
  }
  const b = img.getBBox();
  return { x: b.x, y: b.y, w: b.width, h: b.height };
}

/**
 * The print sweep for one image inside an SVG (in user units, so it scales with the SVG): an ink rectangle and a
 * teal rectangle over the image's box, each clipped to a "/" band whose edges travel top-left → bottom-right,
 * revealing the image under them. Returns a paused timeline plus a disposer that removes everything it added.
 */
export function sweepSvgArt(img: SVGGraphicsElement, { duration = 1, ease = SWEEP_EASE } = {}) {
  const svg = img.ownerSVGElement!;
  const box = shownBox(img);
  const far = box.w + box.h + 100;
  const end = box.w + box.h + 40;
  const defs = svg.querySelector("defs") ?? svg.insertBefore(document.createElementNS(NS, "defs"), svg.firstChild);
  const added: Element[] = [];

  const layer = () => {
    const id = `sweep-art-${++uid}`;
    const clip = document.createElementNS(NS, "clipPath");
    clip.setAttribute("id", id);
    clip.setAttribute("clipPathUnits", "userSpaceOnUse");
    const poly = document.createElementNS(NS, "polygon");
    clip.appendChild(poly);
    defs.appendChild(clip);
    added.push(clip);
    const band = { hide: -40, reveal: -40 };
    const draw = () => {
      const { x, y } = box;
      poly.setAttribute(
        "points",
        `${x + band.hide + far},${y - far} ${x + band.reveal + far},${y - far} ${x - far},${y + band.reveal + far} ${x - far},${y + band.hide + far}`,
      );
    };
    draw();
    return { id, band, draw };
  };

  const original = layer();
  const prevClip = img.getAttribute("clip-path");
  img.setAttribute("clip-path", `url(#${original.id})`);

  /** A flat rectangle over the image's box, in its own band, placed right after `prev` in paint order. */
  const copy = (color: string, prev: Element) => {
    const l = layer();
    const r = document.createElementNS(NS, "rect");
    r.setAttribute("x", String(box.x));
    r.setAttribute("y", String(box.y));
    r.setAttribute("width", String(box.w));
    r.setAttribute("height", String(box.h));
    r.setAttribute("clip-path", `url(#${l.id})`);
    r.style.fill = color;
    prev.after(r);
    added.push(r);
    return { ...l, rect: r };
  };
  const under = copy("var(--c-ink)", img);
  const top = copy("var(--c-teal)", under.rect);

  const tl = gsap.timeline({ paused: true });
  const tween = (l: { band: { hide: number; reveal: number }; draw: () => void }, edge: "hide" | "reveal", at: number) =>
    tl.to(l.band, { [edge]: end, duration, ease, onUpdate: l.draw }, at);
  tween(under, "reveal", OFFSETS.underIn);
  tween(top, "reveal", OFFSETS.topIn);
  tween(original, "reveal", OFFSETS.originalIn);
  tween(top, "hide", OFFSETS.topOut);
  tween(under, "hide", OFFSETS.underOut);

  const dispose = () => {
    added.forEach((el) => el.remove());
    if (prevClip) img.setAttribute("clip-path", prevClip);
    else img.removeAttribute("clip-path");
  };
  tl.add(dispose);
  return { timeline: tl, dispose };
}
