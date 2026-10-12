export type GlyphArt = {
  id: string;
  char?: string;
  /** Path data of the letterform. */
  ink: string;
  /** Path data of accent regions; the letterform is clipped by these and painted in the accent colour. */
  shards: string[];
  /** Bounding box of the ink, in viewBox units. */
  box: { x: number; y: number; w: number; h: number };
};

export type GlyphSvgArt = {
  viewBox: string;
  width: number;
  height: number;
  glyphs: GlyphArt[];
};

const cache = new Map<string, GlyphSvgArt>();

/** Measures path bounds with a throwaway hidden <svg> (works for absolute and relative path commands). */
function measure(paths: string[]) {
  const ns = "http://www.w3.org/2000/svg";
  const host = document.createElementNS(ns, "svg");
  host.setAttribute("style", "position:absolute;width:0;height:0;visibility:hidden");
  document.body.appendChild(host);
  const boxes = paths.map((d) => {
    const p = document.createElementNS(ns, "path");
    p.setAttribute("d", d);
    host.appendChild(p);
    const b = p.getBBox();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  });
  host.remove();
  return boxes;
}

const pointsToPath = (points: string) => {
  const nums = points.trim().split(/[\s,]+/).map(Number);
  const pairs: string[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pairs.push(`${nums[i]} ${nums[i + 1]}`);
  return `M${pairs.join("L")}Z`;
};

const shapeToPath = (el: Element) =>
  el.tagName.toLowerCase() === "polygon" ? pointsToPath(el.getAttribute("points") ?? "") : (el.getAttribute("d") ?? "");

/**
 * Reads a "glyph SVG" — the format written by scripts/build-title-svg.mjs and editable in any vector tool:
 *
 *   <svg viewBox="0 0 W H">
 *     <g id="glyph-0" data-char="B">
 *       <path id="glyph-0-ink" d="…"/>          one or more, id ends with "-ink"
 *       <path id="glyph-0-shard" d="…"/>        optional, id contains "-shard" (path or polygon)
 *     </g>
 *   </svg>
 *
 * Keep the ids when editing (Figma / Illustrator export layer names as ids).
 */
export function parseGlyphSvg(raw: string): GlyphSvgArt {
  const hit = cache.get(raw);
  if (hit) return hit;

  const doc = new DOMParser().parseFromString(raw, "image/svg+xml");
  const svg = doc.documentElement;
  const viewBox = svg.getAttribute("viewBox") ?? "0 0 100 100";
  const [, , width, height] = viewBox.split(/[\s,]+/).map(Number);

  const parsed = Array.from(svg.querySelectorAll('g[id^="glyph"]')).map((g) => ({
    id: g.id,
    char: g.getAttribute("data-char") ?? undefined,
    ink: Array.from(g.querySelectorAll('[id$="-ink"]')).map(shapeToPath).join(" "),
    shards: Array.from(g.querySelectorAll('[id*="-shard"]')).map(shapeToPath),
  }));
  const boxes = measure(parsed.map((p) => p.ink));
  const glyphs = parsed.map((g, i) => ({ ...g, box: boxes[i] }));

  const art = { viewBox, width, height, glyphs };
  cache.set(raw, art);
  return art;
}

/** Centre of the first glyph drawn for `char` (viewBox units), e.g. to place an ornament inside the "O". */
export function glyphCenter(raw: string, char: string) {
  const g = parseGlyphSvg(raw).glyphs.find((x) => x.char === char);
  return g ? { x: g.box.x + g.box.w / 2, y: g.box.y + g.box.h / 2 } : null;
}
