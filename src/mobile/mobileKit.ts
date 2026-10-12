/** Mobile layouts are drawn on a 941-wide canvas (the mockups' size). */
export const MOBILE_W = 941;
/** Pointy stars (Sparkle's waist: 0 needle, 14 classic). */
export const WAIST = 4;
export const pad2 = (n: number) => String(n).padStart(2, "0");
/** A slash at 45°, from (x, y) up to the right: the only diagonal the print uses. */
export const slash = (x: number, y: number, len: number, width = 1.2, tone: "teal" | "ink" = "teal") => ({ x1: x, y1: y, x2: x + len, y2: y - len, tone, width });
/** A dot field: `cols` × `rows` dots `pitch` apart from (x, y). */
export const dots = (x: number, y: number, cols: number, rows: number, pitch = 14, size = 2.2, tone: "teal" | "ink" = "teal") =>
  Array.from({ length: cols * rows }, (_, k) => ({ x: x + (k % cols) * pitch, y: y + Math.floor(k / cols) * pitch, size, kind: "dot" as const, tone }));
