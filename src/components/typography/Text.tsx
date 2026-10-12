import type { CSSProperties, ElementType, HTMLAttributes, ReactNode, Ref } from "react";
import { u } from "../../lib/units";
import { decayStyle, type DecayValue } from "../effects/decayPresets";

export type TextVariant = "caps" | "gothic" | "mincho" | "display" | "mono";

const VARIANTS: Record<TextVariant, CSSProperties> = {
  caps: { fontFamily: "var(--f-sans)", fontWeight: 550, textTransform: "uppercase", letterSpacing: "0.28em" },
  gothic: { fontFamily: "var(--f-gothic)", fontWeight: 500, letterSpacing: "0.16em" },
  mincho: { fontFamily: "var(--f-mincho)", fontWeight: 600, letterSpacing: "0.06em" },
  display: { fontFamily: "var(--f-display)", fontWeight: 400, letterSpacing: "-0.01em", fontOpticalSizing: "auto" },
  mono: { fontFamily: "var(--f-mono)", fontWeight: 400, letterSpacing: "0.08em" },
};

export type TextProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  variant?: TextVariant;
  /** Font size, design px. */
  size: number;
  /** Line height, design px. */
  leading?: number;
  /** Letter spacing in em; overrides the variant default. */
  tracking?: number;
  weight?: number;
  color?: string;
  /** Each entry renders as its own block line (`[data-anim-item="line"]`) for staggered reveals. */
  lines?: ReactNode[];
  /** Print texture; "print" by default so type sits in the paper instead of on the screen. */
  decay?: DecayValue;
  ref?: Ref<HTMLElement>;
};

export function Text({
  as: Tag = "p",
  variant = "caps",
  size,
  leading,
  tracking,
  weight,
  color,
  lines,
  decay = "print",
  style,
  children,
  ref,
  ...rest
}: TextProps) {
  return (
    <Tag
      ref={ref}
      style={{
        ...VARIANTS[variant],
        fontSize: u(size),
        lineHeight: leading ? u(leading) : 1.2,
        letterSpacing: tracking === undefined ? VARIANTS[variant].letterSpacing : `${tracking}em`,
        fontWeight: weight ?? VARIANTS[variant].fontWeight,
        color: color ?? "var(--c-ink-text)",
        whiteSpace: "nowrap",
        ...(lines ? null : decayStyle(decay, 2)),
        ...style,
      }}
      {...rest}
    >
      {lines
        ? lines.map((line, i) => (
            <span key={i} data-anim-item="line" style={{ display: "block", ...decayStyle(decay, 2) }}>
              {line}
            </span>
          ))
        : children}
    </Tag>
  );
}
