import type { AnchorHTMLAttributes, Ref } from "react";
import { cx, u } from "../../lib/units";
import { decayStyle, type DecayValue } from "../effects/decayPresets";
import styles from "./EnterButton.module.css";

export type EnterButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  label?: string;
  width?: number;
  height?: number;
  size?: number;
  decay?: DecayValue;
  ref?: Ref<HTMLAnchorElement>;
};

/** Solid ink call-to-action with a long arrow. `[data-anim-item="label" | "arrow"]` inside. */
export function EnterButton({
  label = "Enter",
  width = 242,
  height = 66,
  size = 22,
  decay = "print",
  className,
  style,
  ref,
  ...rest
}: EnterButtonProps) {
  return (
    <a
      ref={ref}
      className={cx(styles.button, className)}
      style={{ width: u(width), height: u(height), fontSize: u(size), ...style }}
      {...rest}
    >
      <span className={styles.label} data-anim-item="label" style={decayStyle(decay, 2)}>
        {label}
      </span>
      <svg className={styles.arrow} data-anim-item="arrow" viewBox="0 0 46 12" aria-hidden style={decayStyle(decay, 2)}>
        <path d="M0 6H44M38 1l6 5-6 5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    </a>
  );
}
