import type { HTMLAttributes, Ref } from "react";
import { u } from "../../lib/units";
import { decayStyle, type DecayValue } from "../effects/decayPresets";

export type MangaPanelProps = HTMLAttributes<HTMLElement> & {
  src: string;
  alt: string;
  /** CSS object-position for cropping. */
  focus?: string;
  border?: number;
  /** Texture of the frame line (the artwork itself is untouched). */
  decay?: DecayValue;
  /** What shows behind the artwork inside the frame (e.g. while it shrinks away). */
  background?: string;
  ref?: Ref<HTMLElement>;
};

/**
 * Comic frame: cover-fit artwork + a hand-drawn ink border on its own layer. Fills its parent.
 * Reveal the frame with clip-path and the art with `[data-anim-item="panel-img"]` scale.
 */
export function MangaPanel({
  src,
  alt,
  focus = "center",
  border = 2,
  decay = "pencil",
  background = "var(--c-white)",
  style,
  children,
  ref,
  ...rest
}: MangaPanelProps) {
  return (
    <figure ref={ref} style={{ position: "relative", width: "100%", height: "100%", ...style }} {...rest}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", background }}>
        <img
          data-anim-item="panel-img"
          src={src}
          alt={alt}
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: focus }}
        />
      </div>
      <span
        aria-hidden
        data-anim-item="panel-border"
        style={{
          position: "absolute",
          inset: 0,
          border: `${u(border)} solid var(--c-ink)`,
          pointerEvents: "none",
          ...decayStyle(decay),
        }}
      />
      {children}
    </figure>
  );
}
