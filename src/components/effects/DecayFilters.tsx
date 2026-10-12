/**
 * SVG filters that "age" flat marks like worn screen-print ink or graphite.
 * feTurbulence is Perlin noise:
 *   - a low-frequency layer displaces edges (wobble) and paints pale blotches,
 *   - a high-frequency layer punches tiny specks out of the ink (paper tooth),
 *   - the low-frequency layer also modulates opacity (pencil pressure).
 *
 * Mount <DecayFilters /> once inside the Stage, then use `decayFilter()`, `decayStyle()` or <Decay>.
 */
import { DECAY_PRESETS, decayFilterId, type DecayLevel, type DecayPreset } from "./decayPresets";
import { useStageUnit } from "../layout/stageContext";

export type DecayFilterDefProps = {
  id: string;
  preset: DecayPreset;
  /** CSS px per design px. Noise is rescaled so the texture keeps its look at any resolution. */
  scale?: number;
};

/** A single <filter> element. Must be rendered inside an <svg>. */
export function DecayFilterDef({ id, preset, scale = 1 }: DecayFilterDefProps) {
  const { rough, grain, specks, tooth, blotch, pressure, seed, soften = 0 } = preset;
  // Alpha = 11 * (threshold - noise): pixels whose noise exceeds the threshold drop out.
  // specks = 0 pushes the threshold out of the noise range, so nothing is punched out.
  const speckOffset = 11 * (specks > 0 ? 0.8 - specks * 0.16 : 2);
  // Alpha multiplier ≈ 1 - pressure … 1 - 0.2·pressure across the low-frequency noise range (0.3 … 0.7).
  const pressureRow = `0 0 ${2 * pressure} 0 ${1 - 1.6 * pressure}`;
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency={grain / scale} numOctaves={4} seed={seed} data-boil-seed={seed} result="coarse" />
      <feDisplacementMap
        in="SourceGraphic"
        in2="coarse"
        scale={rough * scale}
        xChannelSelector="R"
        yChannelSelector="G"
        result="rough"
      />
      <feTurbulence type="fractalNoise" baseFrequency={tooth / scale} numOctaves={2} seed={seed + 1} data-boil-seed={seed + 1} result="fine" />
      <feColorMatrix
        in="fine"
        type="matrix"
        values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -11 0 0 0 ${speckOffset}`}
        result="specks"
      />
      <feComposite in="rough" in2="specks" operator="in" result="eroded" />
      <feColorMatrix
        in="coarse"
        type="matrix"
        values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${pressureRow}`}
        result="pressure"
      />
      <feComposite in="eroded" in2="pressure" operator="in" result="pressed" />
      <feColorMatrix
        in="coarse"
        type="matrix"
        values={`0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  ${2.6 * blotch} 0 0 0 ${-1.5 * blotch}`}
        result="blotch"
      />
      <feComposite in="blotch" in2="pressed" operator="in" result="blotchInk" />
      <feMerge result="worn">
        <feMergeNode in="pressed" />
        <feMergeNode in="blotchInk" />
      </feMerge>
      {soften > 0 && <feGaussianBlur in="worn" stdDeviation={soften * scale} />}
    </filter>
  );
}

/** Renders every preset twice: screen-space (scaled to the Stage) and svg-space (design units). */
export function DecayFilters() {
  const unit = useStageUnit();
  const levels = Object.keys(DECAY_PRESETS) as DecayLevel[];
  return (
    <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        {levels.map((level) => (
          <DecayFilterDef key={level} id={decayFilterId(level)} preset={DECAY_PRESETS[level]} scale={unit} />
        ))}
        {levels.map((level) => (
          <DecayFilterDef key={`${level}-svg`} id={decayFilterId(level, "svg")} preset={DECAY_PRESETS[level]} />
        ))}
      </defs>
    </svg>
  );
}
