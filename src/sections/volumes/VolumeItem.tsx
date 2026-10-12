import { useMemo, useRef, type MouseEvent } from "react";
import { coverSweep, openInNewTab } from "../../animation/coverSweep";
import { Rule, Sparkle, Text, VerticalText } from "../../components";
import { useBlockKit } from "../../components/blocks/blockKit";
import { coverRect } from "../../lib/cover";
import { seeded } from "../../lib/random";
import { u } from "../../lib/units";
import { volumeDecor } from "./volumeDecor";
import type { Volume } from "./volumesContent";
import styles from "./VolumesPage.module.css";
import { faceStyle, project, type BookTilt } from "./bookTilt";

/**
 * Item geometry, design px. Every volume is the same size and turned the same way (only a slight seeded roll
 * differs), so all items read as one row: the cover keeps the real covers' 0.7 aspect.
 */
const VOLUME = {
  cover: { w: 294, h: 420 },
  /** The printed label strip on the face's right (author, number, star, vertical title). */
  label: 46,
  /** Top of the info block under the book. */
  info: 446,
  height: 580,
} as const;
const FACE = { w: VOLUME.cover.w + VOLUME.label, h: VOLUME.cover.h };
const TURN = { perspective: 1100, turn: -28, depth: 36, roll: 1.4 };
/** The author, printed on every label strip. */
const AUTHOR = "namo";
/** Room around the item the decoration may use. */
const DECOR_PAD = { x: 70, y: 50 };

/** Absolutely placed child in item-local design px. */
const at = (x: number, y: number, z?: number) => ({ position: "absolute", left: u(x), top: u(y), zIndex: z }) as const;

/** Long titles break after their first "、" so they keep to the column. */
const titleLines = (t: string) => (Array.from(t).length > 10 && t.includes("、") ? [t.slice(0, t.indexOf("、") + 1), t.slice(t.indexOf("、") + 1)] : [t]);

const pts = (list: Array<{ x: number; y: number }>) => list.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");

/**
 * One manga volume, a hardcover turned towards the right like the reference: seeded print decoration behind it
 * (volumeDecor) with its slashes crossing in front, the book's side (page block) past the face's right edge, the
 * tilted front face (cover art, monochrome until hovered and `[data-art]` so a spawned item sweeps it in; label
 * strip and its copy), and the flat info block under it (VOL. number, title, date, chapters).
 * Each face part is its own unit with the face's exact projection (bookTilt.faceStyle).
 */
export function VolumeItem({ volume, index, className }: { volume: Volume; index: number; className?: string }) {
  const kit = useBlockKit();
  const coverRef = useRef<HTMLDivElement>(null);
  const sweeping = useRef(false);
  // a plain click: the cover is swept over in teal, then the shop opens in a new tab (other clicks open it as usual)
  const buy = (e: MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (!coverRef.current || sweeping.current) return;
    sweeping.current = true;
    coverSweep(coverRef.current, {
      onCovered: () => {
        sweeping.current = false;
        openInNewTab(volume.href);
      },
    });
  };
  const decor = useMemo(() => volumeDecor(volume.seed, FACE.w, FACE.h), [volume.seed]);
  const tilt: BookTilt = useMemo(() => {
    const roll = (seeded(volume.seed * 7 + 5)() * 2 - 1) * TURN.roll;
    return { ...FACE, ...TURN, roll };
  }, [volume.seed]);
  const art = coverRect({ x: 0, y: 0, w: VOLUME.cover.w, h: VOLUME.cover.h }, volume.cover);
  const lines = titleLines(volume.title);
  const decorW = FACE.w + DECOR_PAD.x * 2;
  const decorH = FACE.h + DECOR_PAD.y * 2;
  const label = { x: VOLUME.cover.w, w: VOLUME.label };
  const onFace = (x: number, y: number, z: number) => ({ ...at(x, y, z), ...faceStyle(tilt, x, y) });

  // the book's right side: the face's right edge, and the same edge `depth` further back
  const side = useMemo(() => {
    const edge = (z: number) => [project(tilt, FACE.w, 0, z), project(tilt, FACE.w, FACE.h, z)];
    const [ft, fb] = edge(0);
    const [bt, bb] = edge(-tilt.depth);
    const pages = [0.22, 0.42, 0.6, 0.78].map((f) => edge(-tilt.depth * f));
    const cover = edge(-tilt.depth * 0.9); // the back board's inner edge
    return { outline: [ft, bt, bb, fb], pages, cover };
  }, [tilt]);

  return (
    <article
      data-entry={index}
      className={className}
      style={{ position: "relative", width: u(FACE.w), height: u(VOLUME.height) }}
      aria-label={`Vol. ${volume.number} ${volume.title}`}
    >
      <div data-anim="shape" style={at(-DECOR_PAD.x, -DECOR_PAD.y, 0)}>
        <svg
          aria-hidden
          viewBox={`${-DECOR_PAD.x} ${-DECOR_PAD.y} ${decorW} ${decorH}`}
          style={{ display: "block", width: u(decorW), height: u(decorH), overflow: "visible" }}
        >
          <defs>{kit.defs}</defs>
          {decor.discs.map(kit.disc)}
          {decor.blocks.map(kit.block)}
          {decor.sparks.map(kit.spark)}
        </svg>
      </div>

      {/* the book's side: page block between the boards */}
      <div data-anim="shape" style={at(0, 0, 1)}>
        <svg aria-hidden viewBox={`0 0 ${FACE.w} ${FACE.h}`} style={{ display: "block", width: u(FACE.w), height: u(FACE.h), overflow: "visible" }}>
          <polygon points={pts(side.outline)} style={{ fill: "#ecebe4", stroke: "var(--c-ink)" }} strokeWidth={1} strokeLinejoin="round" />
          {side.pages.map(([a, b], i) => (
            <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} style={{ stroke: "#8f8e88" }} strokeWidth={0.6} />
          ))}
          <polygon points={pts([side.cover[0], side.outline[1], side.outline[2], side.cover[1]])} style={{ fill: "#3a3a38" }} />
        </svg>
      </div>

      {/* front face: board with the label strip, then the art */}
      <div data-anim="shape" style={{ ...onFace(0, 0, 2), width: u(FACE.w), height: u(FACE.h) }}>
        <svg aria-hidden viewBox={`0 0 ${FACE.w} ${FACE.h}`} style={{ display: "block", width: "100%", height: "100%" }}>
          <rect x={0.5} y={0.5} width={FACE.w - 1} height={FACE.h - 1} style={{ fill: "#fbfaf5", stroke: "var(--c-ink)" }} strokeWidth={1} />
          <line x1={label.x + 5} y1={8} x2={label.x + 5} y2={FACE.h - 8} style={{ stroke: "var(--c-ink)" }} strokeWidth={0.6} opacity={0.45} />
        </svg>
      </div>
      <div ref={coverRef} data-anim="panel" style={{ ...onFace(0, 0, 3), width: u(VOLUME.cover.w), height: u(VOLUME.cover.h) }}>
        <svg aria-hidden viewBox={`0 0 ${VOLUME.cover.w} ${VOLUME.cover.h}`} style={{ display: "block", width: "100%", height: "100%" }}>
          <clipPath id={kit.id("cover")}>
            <rect x={0} y={0} width={VOLUME.cover.w} height={VOLUME.cover.h} />
          </clipPath>
          <g clipPath={kit.url("cover")}>
            <image data-art href={volume.cover.src} x={art.x} y={art.y} width={art.w} height={art.h} preserveAspectRatio="none" />
          </g>
          <rect x={0.5} y={0.5} width={VOLUME.cover.w - 1} height={VOLUME.cover.h - 1} style={{ fill: "none", stroke: "var(--c-ink)" }} strokeWidth={1} />
        </svg>
      </div>

      {/* label strip copy, on the face */}
      <div data-anim="text" style={{ ...onFace(label.x, 22, 4), width: u(label.w), textAlign: "center" }}>
        <Text size={7.6} leading={10} tracking={0.2}>
          {AUTHOR}
        </Text>
      </div>
      <div data-anim="number" style={{ ...onFace(label.x, 48, 4), width: u(label.w), textAlign: "center" }}>
        <Text variant="display" size={24} leading={26}>
          {volume.number}
        </Text>
      </div>
      <div data-anim="sparkle" style={onFace(label.x + label.w / 2 - 5, 86, 4)}>
        <Sparkle size={10} color="var(--c-teal)" />
      </div>
      <div data-anim="vtext" style={onFace(label.x + label.w / 2 - 7, 108, 4)}>
        <VerticalText lines={[volume.spine]} size={12} leading={16} weight={600} />
      </div>

      {/* the decoration's slashes cross in front of the book, as in the print */}
      {decor.hairs.length > 0 && (
        <div data-anim="slash" style={at(-DECOR_PAD.x, -DECOR_PAD.y, 5)}>
          <svg
            aria-hidden
            viewBox={`${-DECOR_PAD.x} ${-DECOR_PAD.y} ${decorW} ${decorH}`}
            style={{ display: "block", width: u(decorW), height: u(decorH), overflow: "visible", pointerEvents: "none" }}
          >
            {decor.hairs.map(kit.hair)}
          </svg>
        </div>
      )}

      {/* info */}
      <div data-anim="rule" style={at(14, VOLUME.info, 3)}>
        <Rule length={VOLUME.height - VOLUME.info} thickness={1} vertical />
      </div>
      <div data-anim="text" style={at(44, VOLUME.info + 18, 3)}>
        <Text variant="display" size={12} tracking={0.04} weight={500}>
          VOL.
        </Text>
      </div>
      <div data-anim="number" style={at(82, VOLUME.info + 2, 3)}>
        <Text variant="display" size={34} leading={36} weight={500}>
          {volume.number}
        </Text>
      </div>
      <div data-anim="text" style={at(44, VOLUME.info + 46, 3)}>
        <Text variant="mincho" size={19} leading={27} tracking={0.08} weight={600} lines={lines} lang="ja" />
      </div>
      <div data-anim="text" style={at(44, VOLUME.info + 54 + lines.length * 27, 3)}>
        <Text variant="mono" size={12.5} leading={24} lines={[volume.date, volume.issues]} />
      </div>
      <div data-anim="rule" style={at(172, VOLUME.info + 64 + lines.length * 27, 3)}>
        <Rule length={104} thickness={1} />
      </div>
      <div data-anim="sparkle" style={at(288, VOLUME.info + 52 + lines.length * 27, 3)}>
        <Sparkle size={24} color="var(--c-ink)" />
      </div>

      {/* the whole volume is the link to buy it */}
      <a className={styles.buy} href={volume.href} target="_blank" rel="noopener noreferrer" onClick={buy} aria-label={`Vol. ${volume.number}: buy on Amazon`} />
    </article>
  );
}
