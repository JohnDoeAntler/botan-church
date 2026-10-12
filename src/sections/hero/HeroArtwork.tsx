import { DotGrid, Halftone, Place, Plus, Rule, ShapeScene, SlashLines, Sparkle } from "../../components";
import { ART, CHARACTER_TINT, DESIGN_SIZE } from "./heroContent";
import { HERO_SCENE } from "./heroScene";
import styles from "./Hero.module.css";

/** Teal speed lines (all 45°, see SlashLines): x, y, box, spacing / count. */
const SLASHES = [
  { x: 735, y: 155, w: 75, h: 77, count: 1 },
  { x: 955, y: 38, w: 70, h: 58, spacing: 9 },
  { x: 1530, y: 545, w: 92, h: 90, spacing: 12 },
  { x: 1597, y: 710, w: 32, h: 42, spacing: 8 },
  { x: 1100, y: 740, w: 86, h: 85, spacing: 11 },
  { x: 1188, y: 805, w: 88, h: 86, spacing: 11 },
  { x: 805, y: 785, w: 96, h: 100, spacing: 12 },
  { x: 175, y: 750, w: 86, h: 86, count: 1 },
];

/**
 * The front page's artwork, placed where the reference has it: the annotated shape scene (heroScene.ts),
 * halftones, dot fields, speed lines, stars, and the character over them.
 */
export function HeroArtwork() {
  return (
    <>
      <Place x={0} y={0} z={1}>
        <ShapeScene {...DESIGN_SIZE} layers={HERO_SCENE} />
      </Place>
      <Place x={205} y={692} w={50} h={50} z={1} data-sweep-base="teal" data-anim="halftone">
        <Halftone cell={4} dot={0.45} fade="left" />
      </Place>
      <Place x={1587} y={600} w={52} h={50} z={1} data-sweep-base="teal" data-anim="halftone">
        <Halftone cell={4} dot={0.7} clip="polygon(0 0, 100% 0, 100% 100%, 30% 100%, 30% 58%, 0 58%)" />
      </Place>
      <Place x={1382} y={80} z={1} data-sweep-base="teal" data-anim="dots">
        <DotGrid rows={5} cols={9} pitch={15} dot={2.4} />
      </Place>
      <Place x={1578} y={346} ax="end" ay="start" z={6} data-sweep-base="teal" data-anim="dots">
        <DotGrid rows={3} cols={4} pitch={17} dot={3.6} />
      </Place>

      {SLASHES.map((s, i) => (
        <Place key={i} x={s.x} y={s.y} z={3} data-sweep-base="teal" data-anim="slash">
          <SlashLines width={s.w} height={s.h} count={s.count} spacing={s.spacing} />
        </Place>
      ))}
      <Place x={1196} y={226} z={6} data-anim="slash">
        <SlashLines width={50} height={50} count={1} color="var(--c-ink)" thickness={1.2} />
      </Place>
      <Place x={1194} y={755} z={3} data-sweep-base="teal" data-anim="rule">
        <Rule length={96} vertical dash={3} color="var(--c-teal)" />
      </Place>
      <Place x={1160} y={798} z={3} data-sweep-base="teal" data-anim="rule">
        <Rule length={70} dash={3} color="var(--c-teal)" />
      </Place>
      <Place x={1187} y={760} z={3} data-sweep-base="teal" data-anim="sparkle">
        <Sparkle size={15} color="var(--c-teal)" />
      </Place>
      <Place x={1187} y={791} z={3} data-sweep-base="teal" data-anim="sparkle">
        <Sparkle size={15} color="var(--c-teal)" />
      </Place>

      <Place x={188} y={92} z={3} data-anim="sparkle">
        <Sparkle size={84} height={80} waist={1.6} color="var(--c-ink)" />
      </Place>
      <Place x={290} y={76} z={3} data-anim="sparkle">
        <Sparkle size={24} color="var(--c-white)" />
      </Place>
      <Place x={768} y={224} z={3} data-anim="sparkle">
        <Sparkle size={20} color="var(--c-white)" />
      </Place>
      <Place x={768} y={88} z={3} data-anim="sparkle">
        <Sparkle size={14} color="var(--c-white)" />
      </Place>
      <Place x={336} y={346} z={3} data-sweep-base="teal" data-anim="sparkle">
        <Sparkle size={16} color="var(--c-teal)" />
      </Place>
      <Place x={56} y={570} ax="start" z={3} data-sweep-base="teal" data-anim="sparkle">
        <Sparkle size={30} color="var(--c-teal)" />
      </Place>
      <Place x={235} y={814} z={3} data-sweep-base="teal" data-anim="sparkle">
        <Sparkle size={27} color="var(--c-teal)" />
      </Place>
      <Place x={793} y={269} z={3} data-sweep-base="teal" data-anim="sparkle">
        <Plus size={14} color="var(--c-teal)" />
      </Place>
      <Place x={1561} y={311} ax="end" ay="start" z={6} data-anim="sparkle">
        <Plus size={16} color="var(--c-ink)" />
      </Place>

      {/* the character (no cursor preview: she's the page itself). TEMP monochrome: the filter styles the live image, data-intro-matrix makes the intro match */}
      <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
        <filter id="hero-character-tint" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={CHARACTER_TINT} />
        </filter>
      </svg>
      <Place x={143} y={0} ay="end" w={849} h={941} z={4} data-anim="character" data-intro-matrix={CHARACTER_TINT} data-cursor="plain" className={styles.character}>
        <img src={ART.character} alt="Botan, a blonde girl in a red scarf and navy coat" draggable={false} style={{ filter: "url(#hero-character-tint)" }} />
      </Place>
    </>
  );
}
