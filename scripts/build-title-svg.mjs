#!/usr/bin/env node
/**
 * Builds a "glyph SVG" logotype from a font + JSON config.
 *
 *   node scripts/build-title-svg.mjs scripts/titles/botan-church.json
 *
 * Every letter becomes <g id="glyph-N"> with an "-ink" path (the outline) and optional "-shard" paths
 * (accent regions). The output is a normal SVG: open it in Figma / Illustrator, reshape letters or
 * shards, keep the ids, save — SvgTitle renders whatever is in the file.
 *
 * Config:
 *   font       path to a static .ttf/.otf
 *   out        output .svg path
 *   capHeight  cap height in design px (font size is derived from it)
 *   leading    baseline-to-baseline distance in design px
 *   lines[]    { text, x, width, shards[] }
 *              x      left edge of the first letter's ink (design px, relative to the SVG)
 *              width  ink width the line is fitted to (letter spacing is solved for it)
 *              shards per-letter CSS-style polygons in % of that letter's ink box,
 *                     e.g. "polygon(0% 100%, 0% 60%, 40% 20%, 40% 100%)", or null
 *   shardsTraced  optional: polygons as SVG path data in the title's own coordinates (e.g. edited in a
 *                 vector editor and brought back by scripts/import-title-shards.py). When present they replace `shards`. Either one
 *                 list per letter (index = letter order), or a flat list where each polygon goes to the letter
 *                 whose ink box it overlaps most.
 */
import fs from "node:fs";
import path from "node:path";
import opentype from "opentype.js";

const configPath = process.argv[2];
if (!configPath) {
  console.error("usage: node scripts/build-title-svg.mjs <config.json>");
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const font = opentype.parse(fs.readFileSync(config.font).buffer);
const capRatio = font.tables.os2.sCapHeight / font.unitsPerEm;
const size = config.capHeight / capRatio;
const round = (n) => Math.round(n * 100) / 100;

function layoutLine(text, tracking) {
  let cursor = 0;
  return Array.from(text).map((char) => {
    const glyph = font.charToGlyph(char);
    const x = cursor;
    cursor += (glyph.advanceWidth / font.unitsPerEm) * size + tracking;
    return { char, glyph, x };
  });
}

/**
 * SVG path data for an opentype path, 2 decimals. (opentype's own toPathData occasionally writes "NaN" for a
 * coordinate when it compacts the output: seen on a repeated "A".)
 */
function pathData(p) {
  const n = (v) => round(v);
  return p.commands
    .map((c) => {
      switch (c.type) {
        case "M":
        case "L":
          return `${c.type}${n(c.x)} ${n(c.y)}`;
        case "Q":
          return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
        case "C":
          return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
        default:
          return "Z";
      }
    })
    .join("");
}

const inkPath = (glyph, x, baseline) => glyph.getPath(x, baseline, size);
const inkBounds = (glyph, x, baseline) => inkPath(glyph, x, baseline).getBoundingBox();

function lineInk(placed, baseline) {
  const first = inkBounds(placed[0].glyph, placed[0].x, baseline);
  const lastP = placed[placed.length - 1];
  const last = inkBounds(lastP.glyph, lastP.x, baseline);
  return { left: first.x1, width: last.x2 - first.x1 };
}

/** Solve letter spacing so the line's ink spans exactly `width`. */
function fitTracking(text, width) {
  const n = Array.from(text).length;
  const natural = lineInk(layoutLine(text, 0), 0).width;
  return n > 1 ? (width - natural) / (n - 1) : 0;
}

function polygonToPath(polygon, box) {
  const pairs = polygon
    .replace(/^polygon\(|\)$/g, "")
    .split(",")
    .map((pair) => pair.trim().split(/\s+/).map((v) => parseFloat(v) / 100));
  const pts = pairs.map(([px, py]) => `${round(box.x1 + px * (box.x2 - box.x1))} ${round(box.y1 + py * (box.y2 - box.y1))}`);
  return `M${pts.join("L")}Z`;
}

const glyphs = [];
const inkBoxes = [];
let maxX = 0;
config.lines.forEach((line, li) => {
  const baseline = config.capHeight + li * config.leading;
  const tracking = line.width ? fitTracking(line.text, line.width) : (line.tracking ?? 0);
  const placed = layoutLine(line.text, tracking);
  const shift = (line.x ?? 0) - lineInk(placed, baseline).left;

  placed.forEach(({ char, glyph, x }, ci) => {
    const gx = x + shift;
    const ink = inkPath(glyph, gx, baseline);
    const box = ink.getBoundingBox();
    // shards are relative to the cap box so round letters (O, C) share the same vertical scale
    const capBox = { x1: box.x1, x2: box.x2, y1: baseline - config.capHeight, y2: baseline };
    const shard = line.shards?.[ci];
    glyphs.push({ char, d: pathData(ink), shards: !config.shardsTraced && shard ? [polygonToPath(shard, capBox)] : [] });
    inkBoxes.push(box);
    maxX = Math.max(maxX, box.x2);
  });
});

// traced shards: per-letter lists go straight to their letter…
const traced = config.shardsTraced ?? [];
if (traced.length && Array.isArray(traced[0])) traced.forEach((list, i) => glyphs[i] && glyphs[i].shards.push(...list));
// …a flat list is handed out by overlap with each letter's ink box
for (const d of traced.length && Array.isArray(traced[0]) ? [] : traced) {
  const nums = d.match(/-?\d*\.?\d+/g).map(Number);
  const xs = nums.filter((_, i) => i % 2 === 0);
  const ys = nums.filter((_, i) => i % 2 === 1);
  const pb = { x1: Math.min(...xs), x2: Math.max(...xs), y1: Math.min(...ys), y2: Math.max(...ys) };
  const overlap = (b) =>
    Math.max(0, Math.min(b.x2, pb.x2) - Math.max(b.x1, pb.x1)) * Math.max(0, Math.min(b.y2, pb.y2) - Math.max(b.y1, pb.y1));
  let best = -1;
  let bestArea = 0;
  inkBoxes.forEach((b, i) => {
    const a = overlap(b);
    if (a > bestArea) [best, bestArea] = [i, a];
  });
  if (best >= 0) glyphs[best].shards.push(d);
}

const width = Math.ceil(maxX);
const height = Math.ceil(config.capHeight + (config.lines.length - 1) * config.leading);
const body = glyphs
  .map(
    (g, i) =>
      `  <g id="glyph-${i}" data-char="${g.char}">\n` +
      `    <path id="glyph-${i}-ink" fill="#171717" d="${g.d}"/>\n` +
      g.shards.map((d, k) => `    <path id="glyph-${i}-shard-${k}" fill="#23a9a3" fill-opacity="0.55" d="${d}"/>\n`).join("") +
      `  </g>`,
  )
  .join("\n");

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n` +
  `  <!-- generated by scripts/build-title-svg.mjs from ${path.basename(configPath)}; safe to hand-edit (keep ids) -->\n` +
  `${body}\n</svg>\n`;

fs.mkdirSync(path.dirname(config.out), { recursive: true });
fs.writeFileSync(config.out, svg);
console.log(`wrote ${config.out} (${width}×${height}, font size ${round(size)}px, ${glyphs.length} glyphs)`);
