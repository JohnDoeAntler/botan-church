import type { HTMLAttributes, Ref } from "react";
import { u } from "../../lib/units";
import { decayStyle, type DecayValue } from "../effects/decayPresets";

export type VerticalTextProps = HTMLAttributes<HTMLParagraphElement> & {
  /** Columns, read right → left (first entry is the rightmost column). */
  lines: string[];
  size: number;
  /** Column pitch, design px. */
  leading?: number;
  tracking?: number;
  font?: "mincho" | "gothic";
  weight?: number;
  /** Wrap every character in `[data-anim-item="char"]` for typewriter-style reveals. */
  split?: boolean;
  decay?: DecayValue;
  ref?: Ref<HTMLParagraphElement>;
};

/** Japanese tategaki (vertical-rl) text block. */
export function VerticalText({
  lines,
  size,
  leading = size * 1.5,
  tracking = 0.08,
  font = "mincho",
  weight = 700,
  split = true,
  decay = "print",
  style,
  ref,
  ...rest
}: VerticalTextProps) {
  return (
    <p
      ref={ref}
      lang="ja"
      style={{
        writingMode: "vertical-rl",
        fontFamily: font === "mincho" ? "var(--f-mincho)" : "var(--f-gothic)",
        fontWeight: weight,
        fontSize: u(size),
        lineHeight: u(leading),
        letterSpacing: `${tracking}em`,
        whiteSpace: "nowrap",
        color: "var(--c-ink-text)",
        ...style,
      }}
      {...rest}
    >
      {lines.map((line, i) => (
        <span key={i} data-anim-item="line" style={{ display: "block" }}>
          {split
            ? Array.from(line).map((ch, j) => (
                <span key={j} data-anim-item="char" style={{ display: "inline-block", ...decayStyle(decay, 2) }}>
                  {ch}
                </span>
              ))
            : <span style={{ display: "inline-block", ...decayStyle(decay, 2) }}>{line}</span>}
        </span>
      ))}
    </p>
  );
}
