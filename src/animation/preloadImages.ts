import type { LoadProgress } from "./bakedIntro";

/** url → its decode. Decoded images are kept for the session so the browser keeps them ready to paint. */
const decoded = new Map<string, Promise<HTMLImageElement | null>>();

/** Downloads and decodes one image (once per session); resolves null if it fails. */
export function decodeImage(url: string) {
  let job = decoded.get(url);
  if (!job) {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    job = img.decode().then(
      () => img,
      () => null,
    );
    decoded.set(url, job);
  }
  return job;
}

/**
 * Downloads and decodes `urls` up front (the first loading screen does this for every page's artwork), so pages
 * and newly scrolled-in items never show an empty frame while their images arrive. Progress 0..1.
 */
export async function preloadImages(urls: string[], onProgress: LoadProgress = () => {}) {
  const unique = [...new Set(urls)];
  let done = 0;
  await Promise.all(
    unique.map((url) =>
      decodeImage(url).then(() => {
        done++;
        onProgress(done / unique.length, `images ${String(done).padStart(2, "0")} / ${unique.length}`);
      }),
    ),
  );
}
