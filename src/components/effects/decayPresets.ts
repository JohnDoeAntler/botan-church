import type { CSSProperties } from "react";
import { u } from "../../lib/units";

/**
 * Parameters of a Perlin-noise (feTurbulence) "worn print" filter. All lengths are design px,
 * so a preset looks the same at 1080p and 4K (DecayFilters rescales them to the Stage).
 */
export type DecayPreset = {
  /** Edge wobble amplitude, design px. */
  rough: number;
  /** Frequency of the wobble / blotch noise (per design px). Lower = longer, lazier waves. */
  grain: number;
  /** 0..1, how much of the ink is punched out by fine noise. */
  specks: number;
  /** Frequency of the speck noise. Higher = finer, paper-tooth-like grain. */
  tooth: number;
  /** 0..1, strength of pale worn blotches. */
  blotch: number;
  /** 0..1, uneven opacity along the mark, like varying pencil pressure. */
  pressure: number;
  seed: number;
  /** Optional blur radius in design px — softens edges like ink bleeding into paper. */
  soften?: number;
};

/** Add a preset here and <DecayFilters /> renders it automatically. */
export const DECAY_PRESETS = {
  /** Flat screen-print blocks. */
  soft: { rough: 2.5, grain: 0.035, specks: 0.25, tooth: 0.75, blotch: 0.35, pressure: 0, seed: 3 },
  /** Heavily worn blocks. */
  heavy: { rough: 5, grain: 0.03, specks: 0.3, tooth: 0.75, blotch: 0.6, pressure: 0, seed: 11 },
  /** Only roughens the outline. */
  edge: { rough: 2, grain: 0.06, specks: 0, tooth: 0.75, blotch: 0, pressure: 0, seed: 7 },
  /** Printed ink on paper: barely-there wobble, a few specks. */
  ink: { rough: 1.2, grain: 0.08, specks: 0, tooth: 0.9, blotch: 0.15, pressure: 0.06, seed: 19 },
  /** Printed text: near-invisible wobble, soft bled edges, faint grain. Keeps small type legible. */
  print: { rough: 0.5, grain: 0.12, specks: 0, tooth: 1.4, blotch: 0, pressure: 0.1, seed: 23, soften: 0.3 },
  /** Graphite line: wobble, grainy tooth, uneven pressure. */
  pencil: { rough: 1.4, grain: 0.06, specks: 0.4, tooth: 1.1, blotch: 0, pressure: 0.3, seed: 5 },
} satisfies Record<string, DecayPreset>;

export type DecayLevel = keyof typeof DECAY_PRESETS;
export type DecayValue = DecayLevel | "none";

/**
 * "screen": for CSS `filter` on HTML elements (noise measured in CSS px, rescaled per Stage size).
 * "svg": for `filter` on elements inside an <svg> whose viewBox is in design px.
 */
export type DecaySpace = "screen" | "svg";

export const decayFilterId = (level: DecayLevel, space: DecaySpace = "screen") =>
  `bc-decay-${level}${space === "svg" ? "-svg" : ""}`;

/** CSS / SVG `filter` value for a preset. Requires <DecayFilters /> mounted (Stage-level). */
export const decayFilter = (level: DecayValue = "soft", space: DecaySpace = "screen") =>
  level === "none" ? undefined : `url(#${decayFilterId(level, space)})`;

/**
 * Style for thin marks (hairlines, dashes, borders): pads the element so the filter has room to
 * wobble outside it, while negative margins keep layout unchanged. Background stays in the content box.
 */
export const decayBleed = (bleed = 3): CSSProperties => ({
  boxSizing: "content-box",
  padding: u(bleed),
  margin: `calc(-1 * ${u(bleed)})`,
  backgroundClip: "content-box",
});

/** One-call style for any element: `<div style={decayStyle("pencil", 3)} />`. */
export const decayStyle = (level: DecayValue = "soft", bleed?: number): CSSProperties =>
  level === "none" ? {} : { filter: decayFilter(level), ...(bleed ? decayBleed(bleed) : null) };
