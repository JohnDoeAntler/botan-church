export type HalftoneGrid = "diagonal" | "square";

export type Box = { x: number; y: number; w: number; h: number };

export type HalftoneFilterDefProps = {
  id: string;
  /** Area the filter covers, in user units (the screened shape's bounding box). */
  region: Box;
  /** Dot pitch in user units (design px when used inside a design-space SVG). */
  cell?: number;
  /** 0..1, Perlin-noise jitter of the tone, so the screen isn't applied uniformly. */
  noise?: number;
  /** Frequency of that noise; lower = bigger blotches. */
  noiseScale?: number;
  /** Multiplies the source alpha before screening (use < 1 to turn solid ink into dots). */
  gain?: number;
  grid?: HalftoneGrid;
  seed?: number;
};

/** One tile of the dot screen. Alpha encodes "dot-ness": high at dot centres, low between dots. */
function screenTile(grid: HalftoneGrid) {
  const centres = grid === "diagonal" ? ["0.5 0.5", "0 0", "1 0", "0 1", "1 1"] : ["0.5 0.5"];
  const circles = centres
    .map((c) => {
      const [cx, cy] = c.split(" ");
      return `<circle cx='${cx}' cy='${cy}' r='0.5' fill='url(#d)'/>`;
    })
    .join("");
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 1 1' preserveAspectRatio='none'>` +
    `<defs><radialGradient id='d'><stop offset='0' stop-opacity='0.96'/><stop offset='1' stop-opacity='0'/></radialGradient></defs>` +
    `<rect width='1' height='1' fill-opacity='0.05'/>${circles}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Amplitude-modulated halftone: the source's alpha decides dot size (alpha 1 → solid, 0.5 → mid dots,
 * 0 → nothing), so alpha gradients become "dissolve into dots" and fill-opacity becomes a flat tint.
 * Colour comes from the source; anything outside the source shape is discarded.
 */
export function HalftoneFilterDef({
  id,
  region,
  cell = 6,
  noise = 0,
  noiseScale = 0.02,
  gain = 1,
  grid = "diagonal",
  seed = 1,
}: HalftoneFilterDefProps) {
  // feTile needs its tile inside the filter region; snap it to the global lattice so screens line up.
  const pad = 2;
  const tileX = Math.ceil(region.x / cell) * cell;
  const tileY = Math.ceil(region.y / cell) * cell;
  return (
    <filter
      id={id}
      filterUnits="userSpaceOnUse"
      x={region.x - pad}
      y={region.y - pad}
      width={region.w + pad * 2}
      height={region.h + pad * 2}
      colorInterpolationFilters="sRGB"
    >
      <feImage href={screenTile(grid)} x={tileX} y={tileY} width={cell} height={cell} preserveAspectRatio="none" result="cell" />
      <feTile in="cell" result="screen" />
      <feTurbulence type="fractalNoise" baseFrequency={noiseScale} numOctaves={3} seed={seed} result="noise" />
      {/* tone = g·A + noise·(N − ½)·(1 − g·A): jitter fades out as tone → 1, so solid ink stays solid */}
      <feComposite
        in="SourceGraphic"
        in2="noise"
        operator="arithmetic"
        k1={-noise * gain}
        k2={gain * (1 + noise / 2)}
        k3={noise}
        k4={-noise / 2}
        result="toned"
      />
      {/* hard threshold: ink where tone + dot-ness > 1 */}
      <feComposite in="toned" in2="screen" operator="arithmetic" k2={20} k3={20} k4={-20} result="dots" />
      <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0 1" result="opaque" />
      <feComposite in="opaque" in2="dots" operator="in" result="inked" />
      <feComponentTransfer in="SourceAlpha" result="inside">
        <feFuncA type="linear" slope={1000} />
      </feComponentTransfer>
      <feComposite in="inked" in2="inside" operator="in" />
    </filter>
  );
}
