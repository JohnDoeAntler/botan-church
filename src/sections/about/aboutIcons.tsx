import type { ReactNode } from "react";
import type { AboutLink } from "./aboutContent";

/** The link cards' marks (manga, X, GitHub, Reddit), drawn in ink on the paper. */
export const ICONS: Record<AboutLink["icon"], ReactNode> = {
  manga: (
    <svg viewBox="0 0 36 36" aria-hidden>
      <circle cx={18} cy={18} r={18} style={{ fill: "var(--c-ink)" }} />
      <path d="M8 11.6c3.1-1 6.4-.7 9.2 1.2v13c-2.8-1.9-6.1-2.2-9.2-1.2Z" style={{ fill: "var(--c-paper)" }} />
      <path d="M28 11.6c-3.1-1-6.4-.7-9.2 1.2v13c2.8-1.9 6.1-2.2 9.2-1.2Z" style={{ fill: "var(--c-paper)" }} />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 36 36" aria-hidden>
      <circle cx={18} cy={18} r={18} style={{ fill: "var(--c-ink)" }} />
      <path
        transform="translate(9.5 9.5) scale(0.71)"
        d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
        style={{ fill: "var(--c-paper)" }}
      />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
        style={{ fill: "var(--c-ink)" }}
      />
    </svg>
  ),
  reddit: (
    <svg viewBox="0 0 36 36" aria-hidden>
      <circle cx={18} cy={18} r={18} style={{ fill: "var(--c-ink)" }} />
      <ellipse cx={18} cy={21} rx={10} ry={6.6} style={{ fill: "var(--c-paper)" }} />
      <circle cx={8.6} cy={16.4} r={2.4} style={{ fill: "var(--c-paper)" }} />
      <circle cx={27.4} cy={16.4} r={2.4} style={{ fill: "var(--c-paper)" }} />
      <circle cx={14.2} cy={20.2} r={1.6} style={{ fill: "var(--c-ink)" }} />
      <circle cx={21.8} cy={20.2} r={1.6} style={{ fill: "var(--c-ink)" }} />
      <path d="M14 24.2c2.4 1.6 5.6 1.6 8 0" style={{ fill: "none", stroke: "var(--c-ink)" }} strokeWidth={1.1} strokeLinecap="round" />
      <path d="M18 14.4 19.6 7.8l4.8 1.2" style={{ fill: "none", stroke: "var(--c-paper)" }} strokeWidth={1.2} strokeLinecap="round" />
      <circle cx={25.4} cy={9.2} r={1.9} style={{ fill: "var(--c-paper)" }} />
    </svg>
  ),
};
