import { useId, useMemo, type CSSProperties, type HTMLAttributes, type Ref } from "react";
import { coverRect, type Art } from "../../lib/cover";
import { u } from "../../lib/units";
import { decayFilter } from "../effects/decayPresets";
import { sparklePath } from "../shapes/sparklePath";
import { cardLayout } from "./infoCardSpec";

export type InfoCardProps = HTMLAttributes<HTMLDivElement> & {
  width: number;
  height: number;
  /** Detail crop shown top-right. */
  thumb?: Art;
  /** Arched-window glyph left of the title. */
  icon?: boolean;
  /** Seeds the layout (thumb size, teal blocks, halftone, dot column); see cardLayout(). */
  seed?: number;
  ref?: Ref<HTMLDivElement>;
};

const C = { teal: "var(--c-teal)", ink: "var(--c-ink)", paper: "var(--c-paper)", line: "#d9d9d4" } as const;
const fill = (c: string): CSSProperties => ({ fill: c });
const stroke = (c: string): CSSProperties => ({ stroke: c });

/**
 * Art of a list item's info panel, rectangles only (copy goes on top separately so it can animate live):
 * black card, a grey halftone patch, a detail crop top-right with a teal halftone corner, teal blocks on the
 * edges, a teal dot row and column, small teal stars, an optional icon, and the "view" arrow.
 */
export function InfoCard({ width: w, height: h, thumb, icon, seed = 1, style, ref, ...rest }: InfoCardProps) {
  const uid = useId().replace(/[^\w-]/g, "");
  const L = useMemo(() => cardLayout(seed, w, h), [seed, w, h]);
  const id = (n: string) => `${uid}-${n}`;
  const t = L.thumb;
  const pad = 24;
  const star = (x: number, y: number, s: number) => (
    <path d={sparklePath(6)} transform={`translate(${x - s} ${y - s}) scale(${(s * 2) / 100})`} style={fill(C.teal)} />
  );

  return (
    <div ref={ref} style={{ position: "relative", width: u(w), height: u(h), ...style }} {...rest}>
      <svg
        aria-hidden
        viewBox={`${-pad} ${-pad} ${w + pad * 2} ${h + pad * 2}`}
        style={{ position: "absolute", left: u(-pad), top: u(-pad), width: u(w + pad * 2), height: u(h + pad * 2), overflow: "visible" }}
      >
        <defs>
          <pattern id={id("ht")} width={4.5} height={4.5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <circle cx={2.25} cy={2.25} r={0.9} style={fill("#5a5a57")} />
          </pattern>
          <pattern id={id("dots")} width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={5} height={5} style={fill(C.ink)} />
            <circle cx={2.5} cy={2.5} r={1.4} style={fill(C.teal)} />
          </pattern>
        </defs>

        <rect width={w} height={h} style={fill(C.ink)} filter={decayFilter("edge", "svg")} />
        <rect x={L.halftone.x} y={L.halftone.y} width={L.halftone.w} height={L.halftone.h} style={fill(`url(#${id("ht")})`)} opacity={0.6} />

        {thumb && (
          <g>
            <rect x={t.x - 3} y={t.y} width={t.w + 3} height={t.h + 3} style={fill(C.paper)} />
            <clipPath id={id("thumb")}>
              <rect x={t.x} y={t.y} width={t.w} height={t.h} />
            </clipPath>
            <g clipPath={`url(#${id("thumb")})`}>
              {(() => {
                const r = coverRect({ x: t.x, y: t.y, w: t.w, h: t.h }, thumb, 2.2);
                return <image data-art href={thumb.src} x={r.x} y={r.y} width={r.w} height={r.h} preserveAspectRatio="none" />;
              })()}
            </g>
            <rect x={t.x + t.w - 26} y={t.y + t.h - 22} width={26} height={22} style={fill(`url(#${id("dots")})`)} />
          </g>
        )}

        {L.accents.map((a, i) => (
          <rect key={i} x={a.x} y={a.y} width={a.w} height={a.h} style={fill(a.dots ? `url(#${id("dots")})` : C.teal)} filter={decayFilter("heavy", "svg")} />
        ))}

        {Array.from({ length: 5 }, (_, i) => (
          <circle key={`d${i}`} cx={L.title.x + 4 + i * 16} cy={L.title.y - 18} r={1.8} style={fill(C.teal)} />
        ))}
        {L.dotColumn && Array.from({ length: 6 }, (_, i) => <circle key={`v${i}`} cx={14} cy={h * 0.3 + i * 14} r={1.6} style={fill(C.teal)} />)}
        {star(L.title.x + 180, L.title.y - 22, 7)}
        {star(t.x - 26, h * 0.62, 5)}

        {icon && <path d="M30 86V54c0-9 5-14 11-14s11 5 11 14v32ZM41 40v46M30 62h22" fill="none" style={stroke(C.paper)} strokeWidth={1.2} />}

        <g style={stroke(C.line)} strokeWidth={1.1} fill="none">
          <line x1={w - 250} y1={h - 22} x2={w - 54} y2={h - 22} />
          <path d={`M${w - 36} ${h - 22}h12M${w - 30} ${h - 28}l6 6-6 6`} />
        </g>
      </svg>
    </div>
  );
}
