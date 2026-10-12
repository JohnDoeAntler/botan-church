import { decodeImage } from "./preloadImages";

/**
 * Resolves once web fonts, every <img> and every SVG <image> (artwork, covers, thumbnails) inside `root` are
 * decoded (or after `timeout` ms).
 */
export async function waitForAssets(root: HTMLElement, timeout = 5000) {
  const images = Array.from(root.querySelectorAll("img"));
  const svgImages = Array.from(root.querySelectorAll("image"))
    .map((el) => el.getAttribute("href") ?? el.getAttribute("xlink:href"))
    .filter((url): url is string => !!url);
  const ready = Promise.all([
    document.fonts?.ready,
    ...images.map((img) => img.decode().catch(() => undefined)),
    ...svgImages.map((url) => decodeImage(url)),
  ]);
  await Promise.race([ready, new Promise((resolve) => setTimeout(resolve, timeout))]);
}

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
  new URLSearchParams(window.location.search).has("static");
