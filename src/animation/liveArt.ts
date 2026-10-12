import type { BakedIntroAssets } from "./bakedIntro";

/**
 * Units marked `data-live-art` show artwork that changes at runtime (e.g. the home page's rotating manga panels),
 * so their baked bitmap only holds the frame. Indices into `units`.
 */
export const liveArtUnits = (units: Element[]) => units.flatMap((el, i) => (el.matches("[data-live-art]") ? [i] : []));

/** Design px of a panel's frame line that stays on top of the artwork (MangaPanel's border, plus a hair). */
const FRAME = 2.5;

/**
 * The baked intro with each live-art unit's bitmap redrawn around what the page shows right now: the baked
 * bitmap (frame, pads), with the unit's current <img> cover-fitted inside the frame line. Returns new bitmaps
 * for those units (the cached ones are left alone); everything else is shared.
 */
export async function withLiveArt(assets: BakedIntroAssets, units: Element[], root: HTMLElement): Promise<BakedIntroAssets> {
  const live = liveArtUnits(units);
  if (!live.length) return assets;
  const unit = Number.parseFloat(getComputedStyle(root).getPropertyValue("--u")) || 1; // CSS px per design px
  const bitmaps = assets.bitmaps.slice();
  await Promise.all(
    live.map(async (i) => {
      const el = units[i];
      const img = el.querySelector("img");
      const base = assets.bitmaps[i];
      if (!img || !base) return;
      await img.decode().catch(() => undefined);
      if (!img.naturalWidth) return;
      const r = el.getBoundingClientRect();
      const ir = img.getBoundingClientRect();
      const [pl, pt, pr, pb] = assets.manifest.units[i].pad.map((p) => p * unit);
      const sx = base.width / (r.width + pl + pr);
      const sy = base.height / (r.height + pt + pb);
      const inset = FRAME * unit;
      const box = { x: (ir.left - r.left + pl + inset) * sx, y: (ir.top - r.top + pt + inset) * sy, w: (ir.width - 2 * inset) * sx, h: (ir.height - 2 * inset) * sy };
      // cover-fit, centred (as object-fit: cover)
      const k = Math.max(box.w / img.naturalWidth, box.h / img.naturalHeight);
      const dw = img.naturalWidth * k;
      const dh = img.naturalHeight * k;
      const c = new OffscreenCanvas(base.width, base.height);
      const g = c.getContext("2d")!;
      g.drawImage(base, 0, 0);
      g.save();
      g.beginPath();
      g.rect(box.x, box.y, box.w, box.h);
      g.clip();
      g.fillStyle = "#fff";
      g.fillRect(box.x, box.y, box.w, box.h);
      g.drawImage(img, box.x + (box.w - dw) / 2, box.y + (box.h - dh) / 2, dw, dh);
      g.restore();
      bitmaps[i] = await createImageBitmap(c, { premultiplyAlpha: "premultiply" });
    }),
  );
  return { ...assets, bitmaps };
}
