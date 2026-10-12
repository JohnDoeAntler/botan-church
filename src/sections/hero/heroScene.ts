import type { SceneLayer } from "../../components";

const PAPER = "var(--c-paper)";

/**
 * Background shapes of the hero, back → front, transcribed from annotations of the original design
 * mock-up (#n = annotation number). Coordinates are design px.
 */
export const HERO_SCENE: SceneLayer[] = [
  // #15 teal circle, decays toward the bottom
  {
    id: "circle-bottom-left",
    shape: { type: "circle", cx: 340, cy: 829, r: 58 },
    dissolve: { toward: "bottom", from: 0.55 },
    halftone: { cell: 5, noise: 0.3, seed: 15 },
    decay: "heavy",
  },
  // #13 halftone teal circle (mostly hidden by #5 and #8)
  {
    id: "halftone-circle",
    shape: { type: "circle", cx: 1068, cy: 746, r: 120 },
    tone: 0.6,
    dissolve: { toward: "bottom-right", from: 0.15 },
    halftone: { cell: 5, noise: 0.4, seed: 13 },
    decay: "edge",
  },
  // #5 teal blob, decays toward the right
  {
    id: "bottom-blob",
    shape: { type: "rect", x: 675, y: 620, w: 349, h: 191 },
    dissolve: { toward: "right", from: 0.8 },
    halftone: { cell: 5, noise: 0.3, seed: 5 },
    decay: "heavy",
    origin: "left",
  },
  // #2 plain teal blob behind the character
  { id: "back-blob", shape: { type: "rect", x: 574, y: 74, w: 293, h: 650 }, decay: "heavy", origin: "top" },
  // #1 background teal blob, gradient-like decay toward the bottom-left
  {
    id: "main-blob",
    shape: { type: "rect", x: 250, y: 39, w: 360, h: 710 },
    dissolve: { toward: "bottom-left", from: 0.62 },
    halftone: { cell: 5, noise: 0.35, seed: 1 },
    decay: "heavy",
    origin: "top",
  },
  // #3 white blob blocking the teal
  { id: "white-body", shape: { type: "rect", x: 366, y: 181, w: 182, h: 383 }, color: PAPER, decay: "edge" },
  // #7 white blob
  { id: "white-bag", shape: { type: "rect", x: 761, y: 341, w: 134, h: 97 }, color: PAPER, decay: "edge" },
  // #4 halftone block: teal dots on white, blocking the teal beneath
  { id: "dot-panel-bg", shape: { type: "rect", x: 690, y: 261, w: 84, h: 303 }, color: PAPER, decay: "edge" },
  {
    id: "dot-panel",
    shape: { type: "rect", x: 690, y: 261, w: 84, h: 303 },
    tone: 0.45,
    halftone: { cell: 5, noise: 0.3, seed: 4 },
    decay: "none",
  },
  // #12 teal circle (its notch is #6 painted over it)
  { id: "circle-top-right", shape: { type: "circle", cx: 1438, cy: 261, r: 100 }, decay: "heavy" },
  // #8 white blob behind the ENTER row
  { id: "white-enter", shape: { type: "rect", x: 801, y: 603, w: 532, h: 143 }, color: PAPER, decay: "edge" },
  // #6 white blob behind the title
  { id: "white-title", shape: { type: "rect", x: 802, y: 292, w: 673, h: 342 }, color: PAPER, decay: "edge" },
  // #11 teal blob (shows up as halftone because #10 screens it)
  { id: "small-blob", shape: { type: "rect", x: 1270, y: 77, w: 56, h: 98 } },
  // #10 transparent screen: halftones everything beneath, uneven (Perlin), black border
  {
    id: "screen",
    shape: { type: "rect", x: 1002, y: 79, w: 383, h: 215 },
    screenBelow: { tone: 0.62, cell: 4.5, noise: 0.45, noiseScale: 0.025, seed: 10 },
    stroke: { width: 1.4 },
    origin: "top right",
  },
  // #9 teal blob on top of the screen
  { id: "top-bar", shape: { type: "rect", x: 1001, y: 81, w: 150, h: 119 }, origin: "left" },
  // #14 halftone blob (sparse square dot field)
  {
    id: "dot-field",
    shape: { type: "rect", x: 178, y: 202, w: 147, h: 177 },
    tone: 0.22,
    halftone: { cell: 14.5, grid: "square" },
    decay: "none",
  },
];
