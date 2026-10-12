import { useId, type HTMLAttributes, type ReactNode, type Ref, type SVGAttributes } from "react";
import { u } from "../../lib/units";
import { decayFilter, type DecayValue } from "../effects/decayPresets";
import { HalftoneFilterDef, type Box, type HalftoneGrid } from "./HalftoneFilterDef";

export type Direction = "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type SceneShape =
  | { type: "rect"; x: number; y: number; w: number; h: number }
  | { type: "circle"; cx: number; cy: number; r: number };

export type HalftoneOptions = {
  /** Dot pitch, design px. */
  cell?: number;
  /** 0..1 Perlin jitter of the tone (uneven screen). */
  noise?: number;
  noiseScale?: number;
  grid?: HalftoneGrid;
  seed?: number;
};

export type SceneLayer = {
  id: string;
  shape: SceneShape;
  /** Any CSS colour (CSS variables allowed). Default teal. */
  color?: string;
  /** 0..1 ink coverage. 1 = solid; below 1 the fill is rendered as halftone dots. */
  tone?: number;
  /** Fade into halftone dots toward a side. `from` = where the fade starts (0..1 across the shape). */
  dissolve?: { toward: Direction; from?: number };
  halftone?: HalftoneOptions;
  /** Surface wear (worn print). Default "soft". */
  decay?: DecayValue;
  /**
   * Makes this layer a transparent "screen": everything beneath it, inside its shape, is re-rendered
   * as halftone at `tone` coverage. The layer itself paints nothing but its optional stroke.
   */
  screenBelow?: { tone: number } & HalftoneOptions;
  stroke?: { color?: string; width?: number; decay?: DecayValue };
  /** GSAP transformOrigin hint for the intro (exposed as data-origin). */
  origin?: string;
};

export type ShapeSceneProps = HTMLAttributes<HTMLDivElement> & {
  /** Design canvas size; layers use these coordinates. */
  width: number;
  height: number;
  /** Back → front. */
  layers: SceneLayer[];
  ref?: Ref<HTMLDivElement>;
};

const VECTORS: Record<Direction, [number, number]> = {
  left: [-1, 0],
  right: [1, 0],
  top: [0, -1],
  bottom: [0, 1],
  "top-left": [-1, -1],
  "top-right": [1, -1],
  "bottom-left": [-1, 1],
  "bottom-right": [1, 1],
};

/** Gradient endpoints in objectBoundingBox units for a fade toward `dir`. */
function gradientVector(dir: Direction) {
  const [dx, dy] = VECTORS[dir];
  const from = (d: number) => (d > 0 ? 0 : d < 0 ? 1 : 0);
  const to = (d: number) => (d > 0 ? 1 : d < 0 ? 0 : 0);
  return { x1: from(dx), y1: from(dy), x2: to(dx), y2: to(dy) };
}

const boundsOf = (s: SceneShape): Box =>
  s.type === "rect" ? { x: s.x, y: s.y, w: s.w, h: s.h } : { x: s.cx - s.r, y: s.cy - s.r, w: s.r * 2, h: s.r * 2 };

function ShapeEl({ shape, ...paint }: { shape: SceneShape } & SVGAttributes<SVGElement>) {
  if (shape.type === "rect") return <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} {...paint} />;
  return <circle cx={shape.cx} cy={shape.cy} r={shape.r} {...paint} />;
}

/** Room around each layer for edge wobble and strokes, design px. */
const PAD = 8;

/**
 * Layered flat-shape artwork in design coordinates. Every layer is its own absolutely positioned <div><svg>
 * (`[data-anim="shape"]` on the div, `data-origin`), so the browser rasterizes each one once and entrance tweens
 * only move GPU layers instead of repainting every filter on every frame.
 * Shared gradients / filters / clips live in one hidden <svg>; a screen layer re-draws the layers
 * beneath it inside its own clip.
 */
export function ShapeScene({ width, height, layers, style, ref, ...rest }: ShapeSceneProps) {
  const uid = useId().replace(/[^\w-]/g, "");
  const defs: ReactNode[] = [];
  const arts: ReactNode[] = [];

  layers.forEach((layer, i) => {
    const key = `${uid}-${i}`;
    const color = layer.color ?? "var(--c-teal)";
    const stroke = layer.stroke && (
      <g filter={decayFilter(layer.stroke.decay ?? "pencil", "svg")}>
        <ShapeEl
          shape={layer.shape}
          fill="none"
          style={{ stroke: layer.stroke.color ?? "var(--c-ink)" }}
          strokeWidth={layer.stroke.width ?? 1.5}
        />
      </g>
    );

    if (layer.screenBelow) {
      const { tone, ...opts } = layer.screenBelow;
      defs.push(
        <clipPath key={`${key}-clip`} id={`${key}-clip`}>
          <ShapeEl shape={layer.shape} />
        </clipPath>,
        <HalftoneFilterDef key={`${key}-ht`} id={`${key}-ht`} region={boundsOf(layer.shape)} gain={tone} {...opts} />,
      );
      const below = arts.slice(0, i);
      arts.push(
        <g key={key}>
          <g clipPath={`url(#${key}-clip)`}>
            <ShapeEl shape={layer.shape} style={{ fill: "var(--c-paper)" }} />
            <g filter={`url(#${key}-ht)`}>{below}</g>
          </g>
          {stroke}
        </g>,
      );
      return;
    }

    const tone = layer.tone ?? 1;
    const screened = tone < 1 || !!layer.dissolve;
    let fill: string = color;
    if (layer.dissolve) {
      const from = layer.dissolve.from ?? 0.5;
      defs.push(
        <linearGradient key={`${key}-grad`} id={`${key}-grad`} {...gradientVector(layer.dissolve.toward)}>
          <stop offset={0} style={{ stopColor: color, stopOpacity: tone }} />
          <stop offset={from} style={{ stopColor: color, stopOpacity: tone }} />
          <stop offset={1} style={{ stopColor: color, stopOpacity: 0 }} />
        </linearGradient>,
      );
      fill = `url(#${key}-grad)`;
    }
    if (screened)
      defs.push(<HalftoneFilterDef key={`${key}-ht`} id={`${key}-ht`} region={boundsOf(layer.shape)} {...layer.halftone} />);

    arts.push(
      <g key={key}>
        <g filter={decayFilter(layer.decay ?? "soft", "svg")}>
          <g filter={screened ? `url(#${key}-ht)` : undefined}>
            <ShapeEl shape={layer.shape} style={{ fill, fillOpacity: layer.dissolve ? 1 : tone }} />
          </g>
        </g>
        {stroke}
      </g>,
    );
  });

  return (
    <div
      ref={ref}
      aria-hidden
      style={{ position: "relative", width: u(width), height: u(height), ...style }}
      {...rest}
    >
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>{defs}</defs>
      </svg>
      {layers.map((layer, i) => {
        const b = boundsOf(layer.shape);
        const box = { x: b.x - PAD, y: b.y - PAD, w: b.w + PAD * 2, h: b.h + PAD * 2 };
        return (
          <div
            key={layer.id}
            data-anim="shape"
            data-origin={layer.origin ?? "center"}
            data-layer={layer.id}
            data-sweep-base={(layer.color ?? "var(--c-teal)") === "var(--c-teal)" && !layer.screenBelow ? "teal" : undefined}
            style={{ position: "absolute", left: u(box.x), top: u(box.y), width: u(box.w), height: u(box.h) }}
          >
            <svg
              viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
              style={{ display: "block", width: "100%", height: "100%", overflow: "visible" }}
            >
              {arts[i]}
            </svg>
          </div>
        );
      })}
    </div>
  );
}
