import type { HTMLAttributes, Ref } from "react";
import { cx, u } from "../../lib/units";
import { decayStyle, type DecayValue } from "../effects/decayPresets";
import styles from "./NavBar.module.css";

export type NavItem = { label: string; href: string };

export type NavBarProps = HTMLAttributes<HTMLElement> & {
  items: NavItem[];
  activeHref?: string;
  /** Gap between items, design px. */
  spacing?: number;
  size?: number;
  onMenuClick?: () => void;
  decay?: DecayValue;
  ref?: Ref<HTMLElement>;
};

export function NavBar({
  items,
  activeHref,
  spacing = 60,
  size = 13,
  onMenuClick,
  decay = "print",
  className,
  style,
  ref,
  ...rest
}: NavBarProps) {
  return (
    <nav
      ref={ref}
      className={cx(styles.nav, className)}
      style={{ fontSize: u(size), ...style }}
      {...rest}
    >
      <ul className={styles.list} style={{ gap: u(spacing) }}>
        {items.map((item) => {
          const active = item.href === activeHref;
          return (
            <li key={item.href} data-anim-item="nav-item">
              <a
                href={item.href}
                className={cx(styles.link, active && styles.active)}
                aria-current={active ? "page" : undefined}
                style={decayStyle(decay)}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className={styles.menu}
        aria-label="Open menu"
        data-anim-item="nav-menu"
        style={decayStyle(decay)}
        onClick={onMenuClick}
      >
        <span />
        <span />
      </button>
    </nav>
  );
}
