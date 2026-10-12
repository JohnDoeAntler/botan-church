const hexToRgb = (hex: string) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16) / 255);
};

/**
 * feColorMatrix `values` (20 numbers, row-major 4×5) for a duotone: luminance 0 → `shadow`, 1 → `highlight`.
 * The same string drives an SVG filter and the intro shader, so both render identically.
 */
export function duotoneMatrix(shadow: string, highlight: string) {
  const s = hexToRgb(shadow);
  const h = hexToRgb(highlight);
  const luma = [0.2126, 0.7152, 0.0722];
  const rows = s.map((sk, k) => [...luma.map((l) => l * (h[k] - sk)), 0, sk]);
  return [...rows.flat(), 0, 0, 0, 1, 0].map((n) => Number(n.toFixed(5))).join(" ");
}

/** Parses feColorMatrix `values` into a column-major mat4 + offset vec4 (for WebGL uniforms). */
export function parseColorMatrix(values: string) {
  const v = values.trim().split(/[\s,]+/).map(Number);
  if (v.length !== 20 || v.some(Number.isNaN)) return null;
  const mat = new Float32Array(16);
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) mat[col * 4 + row] = v[row * 5 + col];
  const offset = new Float32Array([v[4], v[9], v[14], v[19]]);
  return { mat, offset };
}
