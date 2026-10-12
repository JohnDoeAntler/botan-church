/**
 * Converts the original artwork in source-art/ into the WebP files the site serves from public/.
 *
 *   npm run art            (also runs before `npm run dev`, `npm run build` and `npm run bake`)
 *   npm run art -- --force (re-encode everything, even files that are up to date)
 *
 * The outputs are generated, so they are git-ignored (see .gitignore); only source-art/ is committed. A file is
 * re-encoded when its output is missing or older than its source; outputs whose source is gone are deleted.
 *
 *   source-art/fanart/<n>.png|jpg      → public/fanart/<n>.webp           (≤ 1600 px wide)
 *   source-art/manga-crops/<name>.png  → public/manga/<panel>/<name>.webp (+ src/sections/hero/mangaCrops.ts)
 *   source-art/gospel/<name>.png|jpg   → public/gospel/<name>.webp
 *   source-art/volume-covers/<n>.png   → public/volumes/<n>.webp
 *   source-art/botan-character.png     → public/assets/botan-character.webp (padded to the home page's slot)
 *
 * Manga crops are filed under the home page panel whose aspect ratio is closest to theirs (compared on a log scale,
 * so "twice as wide" and "half as wide" are equally far); mangaCrops.ts is the list the page picks from.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "source-art");
const PUBLIC = path.join(ROOT, "public");
const FORCE = process.argv.includes("--force");
const IMAGE = /\.(png|jpe?g|webp)$/i;

/** The home page panels (design px, see HeroPanels.tsx): width / height. */
const PANELS = { panel1: 176 / 285, panel2: 455 / 179, panel3: 270 / 207 };
/** The home page character's slot (design px, HeroArtwork.tsx): the picture is padded to its shape. */
const CHARACTER_SLOT = { w: 849, h: 941 };

const list = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => IMAGE.test(f)) : []);
const stem = (file) => path.parse(file).name;
/** Numbers first, in order (1, 2, …, 10), then names. */
const byName = (a, b) => {
  const [x, y] = [stem(a), stem(b)];
  const [nx, ny] = [/^\d+$/.test(x), /^\d+$/.test(y)];
  return nx && ny ? Number(x) - Number(y) : nx ? -1 : ny ? 1 : x < y ? -1 : x > y ? 1 : 0;
};
const stale = (src, out) => FORCE || !fs.existsSync(out) || fs.statSync(out).mtimeMs < fs.statSync(src).mtimeMs;

let written = 0;
/** Encodes `src` to `out` with `pipeline` (sharp → sharp) when out of date. */
async function convert(src, out, pipeline) {
  if (!stale(src, out)) return;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await pipeline(sharp(src)).toFile(out);
  written++;
}

/** Deletes the .webp files in `dir` that aren't in `keep` (their source was removed). */
function prune(dir, keep) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (f.endsWith(".webp") && !keep.has(full)) fs.rmSync(full);
  }
}

/** A folder of pictures → the same names as WebP in `outDir`. */
async function folder(srcDir, outDir, pipeline) {
  const keep = new Set();
  for (const f of list(srcDir).sort(byName)) {
    const out = path.join(outDir, `${stem(f)}.webp`);
    keep.add(out);
    await convert(path.join(srcDir, f), out, pipeline);
  }
  prune(outDir, keep);
}

const opaque = (s) => s.flatten({ background: "#ffffff" });

// fanart: flattened on white, at most 1600 px wide
await folder(path.join(SRC, "fanart"), path.join(PUBLIC, "fanart"), (s) =>
  opaque(s).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82, effort: 6 }),
);

// gospel pictures and volume covers: as they are
await folder(path.join(SRC, "gospel"), path.join(PUBLIC, "gospel"), (s) => opaque(s).webp({ quality: 86, effort: 6 }));
await folder(path.join(SRC, "volume-covers"), path.join(PUBLIC, "volumes"), (s) => opaque(s).webp({ quality: 86, effort: 6 }));

// manga crops: filed by shape under the panel they fit best, plus the list for the page
{
  const dir = path.join(SRC, "manga-crops");
  const crops = Object.fromEntries(Object.keys(PANELS).map((k) => [k, []]));
  const keep = new Set();
  for (const f of list(dir).sort(byName)) {
    const src = path.join(dir, f);
    const { width: w, height: h } = await sharp(src).metadata();
    const panel = Object.keys(PANELS).reduce((best, k) =>
      Math.abs(Math.log(w / h / PANELS[k])) < Math.abs(Math.log(w / h / PANELS[best])) ? k : best,
    );
    const out = path.join(PUBLIC, "manga", panel, `${stem(f)}.webp`);
    keep.add(out);
    await convert(src, out, (s) => opaque(s).webp({ quality: 86, effort: 6 }));
    crops[panel].push({ src: `/manga/${panel}/${stem(f)}.webp`, w, h });
  }
  for (const panel of Object.keys(PANELS)) prune(path.join(PUBLIC, "manga", panel), keep);

  const body = Object.entries(crops)
    .map(([panel, items]) => `  ${panel}: [\n${items.map((c) => `    { src: asset(${JSON.stringify(c.src)}), w: ${c.w}, h: ${c.h} },\n`).join("")}  ],`)
    .join("\n");
  const ts =
    "// generated by scripts/build-art.mjs from source-art/manga-crops/ (run `npm run art` after changing the crops)\n\n" +
    'import { asset } from "../../lib/base";\n\n' +
    "export type MangaCrop = { src: string; w: number; h: number };\n\n" +
    "/** Manga crops of Botan, sorted by which home page panel's shape each is closest to. */\n" +
    `export const MANGA_CROPS: Record<"panel1" | "panel2" | "panel3", MangaCrop[]> = {\n${body}\n};\n`;
  const tsPath = path.join(ROOT, "src", "sections", "hero", "mangaCrops.ts");
  if (!fs.existsSync(tsPath) || fs.readFileSync(tsPath, "utf8") !== ts) fs.writeFileSync(tsPath, ts);
}

// the home page character: centred on a transparent canvas of its slot's shape, 1600 px wide
{
  const src = path.join(SRC, "botan-character.png");
  if (fs.existsSync(src)) {
    const { width: w, height: h } = await sharp(src).metadata();
    // fit inside a 1600 px wide canvas of the slot's shape, centred, feet on the bottom edge (sharp always resizes
    // before it extends, so the padding is worked out at the final size)
    const W = 1600;
    const H = Math.round((W * CHARACTER_SLOT.h) / CHARACTER_SLOT.w);
    const k = Math.min(W / w, H / h);
    const [rw, rh] = [Math.round(w * k), Math.round(h * k)];
    const left = Math.floor((W - rw) / 2);
    const clear = { r: 0, g: 0, b: 0, alpha: 0 };
    await convert(src, path.join(PUBLIC, "assets", "botan-character.webp"), (s) =>
      s
        .resize(rw, rh)
        .extend({ left, right: W - rw - left, top: H - rh, background: clear })
        .webp({ quality: 86, alphaQuality: 100, effort: 6 }),
    );
  }
}

console.log(written ? `art: wrote ${written} file(s) to public/` : "art: up to date");
