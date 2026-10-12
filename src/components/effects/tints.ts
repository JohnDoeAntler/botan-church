/** Default silhouette colours; keys become filter ids `bc-tint-<key>`. */
export const TINTS = { teal: "var(--c-teal)", ink: "var(--c-ink)" } as const;

export type TintName = keyof typeof TINTS;

export const tintFilterId = (name: string) => `bc-tint-${name}`;
