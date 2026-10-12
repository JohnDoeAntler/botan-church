import type { CSSProperties } from "react";
import { u } from "../../lib/units";

/**
 * A hardcover seen at an angle: its front face (`w` × `h`, design px, top-left at 0,0) turned about the vertical
 * axis so the right edge comes towards the viewer (`turn` < 0), rolled a little in its own plane (`roll`), seen
 * through `perspective`. The right side of the book (`depth` thick) shows past the face's right edge.
 */
export type BookTilt = { w: number; h: number; depth: number; perspective: number; turn: number; roll: number };

const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * CSS for an element at (x, y) on the front face (item-local design px) so it gets exactly the face's projection:
 * the same transform, about the face's centre. Every part of the face uses this, so each can stay its own animated
 * unit (with its own z-index) and still read as one tilted cover.
 */
export function faceStyle(t: BookTilt, x: number, y: number): CSSProperties {
  return {
    transform: `perspective(${u(t.perspective)}) rotateY(${t.turn}deg) rotateZ(${t.roll}deg)`,
    transformOrigin: `${u(t.w / 2 - x)} ${u(t.h / 2 - y)}`,
  };
}

/**
 * Where a point of the book (face coordinates; z < 0 goes back into the book) lands on screen, in item-local
 * design px. Same maths as faceStyle's CSS: rotateZ, then rotateY, then perspective (w = 1 - z / perspective).
 */
export function project(t: BookTilt, px: number, py: number, pz = 0) {
  const X = px - t.w / 2;
  const Y = py - t.h / 2;
  const [cz, sz] = [Math.cos(rad(t.roll)), Math.sin(rad(t.roll))];
  const X1 = X * cz - Y * sz;
  const Y1 = X * sz + Y * cz;
  const [cy, sy] = [Math.cos(rad(t.turn)), Math.sin(rad(t.turn))];
  const X2 = X1 * cy + pz * sy;
  const Z2 = -X1 * sy + pz * cy;
  const w = 1 - Z2 / t.perspective;
  return { x: X2 / w + t.w / 2, y: Y1 / w + t.h / 2 };
}
