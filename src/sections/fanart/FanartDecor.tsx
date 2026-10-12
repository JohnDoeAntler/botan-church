import { Place, Rule, Sparkle } from "../../components";

/** Small stars down the brand column (design px, size). */
const STARS = [
  { x: 42, y: 762, s: 18 },
  { x: 236, y: 462, s: 22 },
  { x: 244, y: 778, s: 14 },
  { x: 250, y: 832, s: 14 },
  { x: 256, y: 884, s: 16 },
];

/** The brand column's print artwork: the big star and its rule, small stars, the halftone arcs behind the list's end. */
export function FanartDecor() {
  return (
    <>
      <Place x={48} y={74} ax="start" z={4} data-anim="sparkle">
        <Sparkle size={78} height={82} waist={3} color="var(--c-ink)" />
      </Place>
      <Place x={130} y={110} ax="start" z={4} data-anim="rule">
        <Rule length={150} thickness={1} />
      </Place>
      {STARS.map((p, i) => (
        <Place key={i} x={p.x} y={p.y} ax="start" z={6} data-anim="sparkle">
          <Sparkle size={p.s} waist={4} color="var(--c-ink)" />
        </Place>
      ))}

      <Place x={150} y={350} ax="start" z={1} data-anim="shape">
        <svg viewBox="0 0 260 400" style={{ display: "block", width: "calc(260 * var(--u))", height: "calc(400 * var(--u))", overflow: "visible" }} aria-hidden>
          <defs>
            <pattern id="fanart-col-dots" width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <circle cx={2.5} cy={2.5} r={1.1} style={{ fill: "var(--c-teal)" }} />
            </pattern>
          </defs>
          <path d="M180 10a90 100 0 0 0 0 200Z" style={{ fill: "url(#fanart-col-dots)" }} opacity={0.55} />
          <path d="M175 160a95 120 0 0 0 0 240Z" style={{ fill: "url(#fanart-col-dots)" }} opacity={0.4} />
          <circle cx={120} cy={250} r={98} fill="none" style={{ stroke: "var(--c-teal)" }} strokeWidth={1} opacity={0.8} />
          <rect x={175} y={82} width={60} height={64} style={{ fill: "var(--c-teal)" }} />
          <rect x={235} y={82} width={20} height={64} style={{ fill: "url(#fanart-col-dots)" }} />
          <g style={{ stroke: "var(--c-ink)" }} strokeWidth={0.9}>
            <line x1={90} y1={40} x2={90} y2={400} />
            <line x1={235} y1={0} x2={235} y2={160} />
            <line x1={0} y1={150} x2={160} y2={150} />
            <line x1={74} y1={58} x2={106} y2={58} />
            <line x1={60} y1={370} x2={200} y2={370} />
          </g>
        </svg>
      </Place>
    </>
  );
}
