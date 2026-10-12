import { useId, type CSSProperties, type ReactNode } from "react";
import { decayFilter } from "../effects/decayPresets";
import { sparklePath } from "../shapes/sparklePath";
import type { Block, Disc, Hair, Spark } from "./blocks";

const C = { teal: "var(--c-teal)", ink: "var(--c-ink)", paper: "var(--c-paper)" } as const;
const fill = (c: string): CSSProperties => ({ fill: c });
const stroke = (c: string): CSSProperties => ({ stroke: c });
const FADES = ["down", "up", "right", "left"] as const;

/**
 * The block vocabulary (see blocks.ts) as SVG, for any static SVG that draws blocks / hairlines / sparks:
 * `defs` (halftone patterns, fade masks) goes in its <defs>, then map the layout through `block`, `hair`, `spark`
 * (and `disc`). Ids are unique per component instance.
 */
export function useBlockKit() {
  const uid = useId().replace(/[^\w-]/g, "");
  const id = (n: string) => `${uid}-${n}`;
  const url = (n: string) => `url(#${id(n)})`;

  const block = (b: Block, i: number): ReactNode => {
    const r = { x: b.x, y: b.y, width: b.w, height: b.h };
    const mask = b.fade ? url(`fade-${b.fade}`) : undefined;
    switch (b.fill) {
      case "teal":
        return <rect key={i} {...r} style={fill(C.teal)} filter={decayFilter("heavy", "svg")} />;
      case "tealLight":
        return <rect key={i} {...r} style={fill("#7fd8d0")} filter={decayFilter("soft", "svg")} />;
      case "tealDots":
        return <rect key={i} {...r} style={fill(url("dots-teal"))} mask={mask} />;
      case "darkDots":
        return <rect key={i} {...r} style={fill(url("dots-dark"))} mask={mask} />;
      case "lightDots":
        return <rect key={i} {...r} style={fill(url("dots-light"))} mask={mask} />;
      case "grayDots":
        return <rect key={i} {...r} style={fill(url("dots-gray"))} mask={mask} />;
      case "whiteDots":
        return <rect key={i} {...r} style={fill(url("dots-white"))} />;
      case "ink":
        return <rect key={i} {...r} style={fill(C.ink)} filter={decayFilter("soft", "svg")} />;
      case "inkDots":
      case "inkTeal":
        return (
          <g key={i}>
            <rect {...r} style={fill(C.ink)} filter={decayFilter("edge", "svg")} />
            <rect {...r} style={fill(url(b.fill === "inkDots" ? "dots-plate" : "dots-teal"))} opacity={b.fill === "inkDots" ? 1 : 0.8} />
          </g>
        );
    }
  };

  // diagonals get the pencil decay like every slash on the site (straight rules stay clean: a filter on a zero-height
  // bounding box would drop the line)
  const hair = (l: Hair, i: number) => (
    <line
      key={i}
      x1={l.x1}
      y1={l.y1}
      x2={l.x2}
      y2={l.y2}
      style={stroke(C[l.tone])}
      strokeWidth={l.width}
      opacity={l.tone === "paper" ? 0.9 : 1}
      filter={l.x1 !== l.x2 && l.y1 !== l.y2 ? decayFilter("pencil", "svg") : undefined}
    />
  );

  const spark = (s: Spark, i: number) =>
    s.kind === "dot" ? (
      <circle key={i} cx={s.x} cy={s.y} r={s.size / 2} style={fill(C[s.tone])} />
    ) : s.kind === "plus" ? (
      <path key={i} d={`M${s.x - s.size} ${s.y}H${s.x + s.size}M${s.x} ${s.y - s.size}V${s.y + s.size}`} style={stroke(C[s.tone])} strokeWidth={1} />
    ) : (
      <path key={i} d={sparklePath(5)} transform={`translate(${s.x - s.size} ${s.y - s.size}) scale(${(s.size * 2) / 100})`} style={fill(C[s.tone])} />
    );

  /** A half disc as a path: from one end of its straight edge round to the other. */
  const halfPath = ({ cx, cy, r, half }: Disc) => {
    const [a, b] =
      half === "top" ? [[cx - r, cy], [cx + r, cy]] : half === "bottom" ? [[cx + r, cy], [cx - r, cy]] : half === "left" ? [[cx, cy + r], [cx, cy - r]] : [[cx, cy - r], [cx, cy + r]];
    return `M${a[0]} ${a[1]}A${r} ${r} 0 0 1 ${b[0]} ${b[1]}Z`;
  };
  const disc = (d: Disc, i: number) => {
    const props = {
      key: `disc-${i}`,
      style: d.fill === "outline" ? { fill: "none", stroke: C.teal } : fill(d.fill === "teal" ? C.teal : url("dots-teal")),
      strokeWidth: d.fill === "outline" ? 1 : undefined,
      filter: d.fill === "teal" ? decayFilter("heavy", "svg") : undefined,
    };
    return d.half ? <path {...props} d={halfPath(d)} /> : <circle {...props} cx={d.cx} cy={d.cy} r={d.r} />;
  };

  const defs = (
    <>
          {[
            { k: "teal", c: C.teal, r: 1.2, s: 5 },
            { k: "dark", c: "#2a2a28", r: 1.15, s: 4.5 },
            { k: "light", c: "#9a9a95", r: 0.9, s: 4.5 },
            { k: "gray", c: "#8a8984", r: 0.95, s: 4.5 },
            { k: "white", c: C.paper, r: 1.1, s: 5 },
            { k: "plate", c: "#3a3a38", r: 1, s: 4 },
          ].map((p) => (
            <pattern key={p.k} id={id(`dots-${p.k}`)} width={p.s} height={p.s} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <circle cx={p.s / 2} cy={p.s / 2} r={p.r} style={fill(p.c)} />
            </pattern>
          ))}
          {FADES.map((dir) => (
            <linearGradient key={dir} id={id(`grad-${dir}`)} x1={dir === "left" ? 1 : 0} y1={dir === "up" ? 1 : 0} x2={dir === "right" ? 1 : 0} y2={dir === "down" ? 1 : 0}>
              <stop offset="0.3" stopColor="#fff" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          ))}
          {FADES.map((dir) => (
            <mask key={dir} id={id(`fade-${dir}`)} maskContentUnits="objectBoundingBox">
              <rect width="1" height="1" style={fill(url(`grad-${dir}`))} />
            </mask>
          ))}
    </>
  );

  return { id, url, block, hair, spark, disc, defs };
}
