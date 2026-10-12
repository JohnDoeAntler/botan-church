import type { HTMLAttributes, Ref } from "react";
import { u } from "../../lib/units";
import { decayStyle, type DecayValue } from "../effects/decayPresets";

export type HandNoteProps = HTMLAttributes<HTMLParagraphElement> & {
  lines: string[];
  script?: "jp" | "en";
  size: number;
  leading?: number;
  color?: string;
  /** Pencil texture by default, so notes look hand-drawn. */
  decay?: DecayValue;
  ref?: Ref<HTMLParagraphElement>;
};

/** Handwritten margin note. Reveal with a left→right clip-path wipe for a "written on" feel. */
export function HandNote({
  lines,
  script = "jp",
  size,
  leading = size * 1.15,
  color = "var(--c-ink)",
  decay = "pencil",
  style,
  ref,
  ...rest
}: HandNoteProps) {
  return (
    <p
      ref={ref}
      lang={script === "jp" ? "ja" : "en"}
      style={{
        fontFamily: script === "jp" ? "var(--f-hand-jp)" : "var(--f-hand-en)",
        fontSize: u(size),
        lineHeight: u(leading),
        color,
        whiteSpace: "nowrap",
        ...decayStyle(decay),
        ...style,
      }}
      {...rest}
    >
      {lines.map((line, i) => (
        <span key={i} data-anim-item="line" style={{ display: "block" }}>
          {line}
        </span>
      ))}
    </p>
  );
}
