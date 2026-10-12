#!/usr/bin/env node
/**
 * Bakes the intro: renders every animated unit of the hero on its own (transparent background) and saves it
 * as public/intro/<page>/uNNN.webp + manifest.json (one folder per page in PAGES). The loading screen downloads these, and the intro sweep is drawn
 * on a canvas from them instead of animating the live DOM.
 *
 *   npm run bake            (all pages; re-run whenever a page's look or structure changes)
 *   npm run bake -- fanart  (just one page; every width it is baked at)
 *
 * Needs a Chromium-based browser: set BROWSER=<path to chrome/msedge> if it isn't found automatically.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { build, preview } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DESIGN_WIDTH = 1672;
const DESIGN = { width: DESIGN_WIDTH, height: 941 };
/**
 * Pages with a baked intro: route → public/intro/<name>/ (must match each page's usePageIntro({ bake })).
 * `spare`: also bake at these extra viewport widths (design px), as <name>-<spare>, for pages whose layout grows
 * into the room wide screens leave (fanart's list, volumes carousel; see src/sections/shared/bakeBucket.ts, same steps).
 */
const range = (step, max) => Array.from({ length: max / step + 1 }, (_, k) => k * step);
const PAGES = [
  { name: "hero", route: "/" },
  { name: "fanart", route: "/fanart", spare: range(60, 600) },
  { name: "gospel", route: "/gospel" },
  { name: "about", route: "/about" },
  { name: "volumes", route: "/volumes", spare: range(60, 600) },
].flatMap((p) => (p.spare ? p.spare.map((s) => ({ name: `${p.name}-${s}`, base: p.name, route: p.route, width: DESIGN_WIDTH + s })) : [{ ...p, base: p.name, width: DESIGN_WIDTH }]));
const only = process.argv.slice(2);
const SCALE = 2; // device px per design px: sharp up to ~4K
const MARGIN = 16; // design px around each unit for wobble / overflow

const CANDIDATES = [
  process.env.BROWSER,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const executablePath = CANDIDATES.find((p) => fs.existsSync(p));
if (!executablePath) {
  console.error("No Chromium browser found. Set BROWSER=/path/to/chrome");
  process.exit(1);
}

console.log("building…");
await build({ root, logLevel: "warn" });
const server = await preview({ root, preview: { port: 4190, strictPort: false }, logLevel: "warn" });
const url = server.resolvedUrls.local[0];

// (CI runners such as GitHub's Ubuntu 24.04 don't allow Chrome's sandbox)
const browser = await puppeteer.launch({ executablePath, headless: true, args: process.env.CI ? ["--no-sandbox"] : [] });
try {
  for (const { name, route, width } of PAGES.filter((p) => !only.length || only.includes(p.name) || only.includes(p.base))) {
    const outDir = path.join(root, "public", "intro", name);
    const page = await browser.newPage();
    await page.setViewport({ width, height: DESIGN.height, deviceScaleFactor: SCALE });
    await page.goto(`${url.replace(/\/$/, "")}${route}?bake`, { waitUntil: "networkidle0" });
    await page.waitForFunction(() => typeof window.__bakeUnits === "function");
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((img) => img.decode().catch(() => undefined)));
    });

    const rects = await page.evaluate(() =>
      window.__bakeUnits().map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left, y: r.top, w: r.width, h: r.height };
      }),
    );
    console.log(`${name}: baking ${rects.length} units at ${SCALE}×…`);

    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });

    const units = [];
    for (let i = 0; i < rects.length; i++) {
      await page.evaluate((index) => {
        window.__bakeUnits().forEach((el, j) => (el.style.visibility = j === index ? "visible" : "hidden"));
      }, i);
      const r = rects[i];
      // pad by MARGIN but stay inside the viewport; record the pad actually used per side
      const x0 = Math.max(0, Math.floor(r.x - MARGIN));
      const y0 = Math.max(0, Math.floor(r.y - MARGIN));
      const x1 = Math.min(width, Math.ceil(r.x + r.w + MARGIN));
      const y1 = Math.min(DESIGN.height, Math.ceil(r.y + r.h + MARGIN));
      const file = `u${String(i).padStart(3, "0")}.webp`;
      const target = path.join(outDir, file);
      await page.screenshot({
        path: target,
        type: "webp",
        quality: 92,
        omitBackground: true,
        clip: { x: x0, y: y0, width: Math.max(1, x1 - x0), height: Math.max(1, y1 - y0) },
      });
      units.push({
        file,
        bytes: fs.statSync(target).size,
        pad: [r.x - x0, r.y - y0, x1 - (r.x + r.w), y1 - (r.y + r.h)].map((n) => Math.round(n * 100) / 100),
      });
      process.stdout.write(`\r  ${i + 1}/${rects.length}`);
    }

    const manifest = { version: 2, scale: SCALE, units };
    fs.writeFileSync(path.join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    const total = units.reduce((s, u) => s + u.bytes, 0);
    console.log(`\nwrote ${units.length} images (${(total / 1024 / 1024).toFixed(2)} MB) to public/intro/${name}/`);
    console.log("run `npm run build` again to ship them.");
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
