/** Converts a design-pixel value into a CSS length that scales with the nearest Stage. */
export const u = (px: number) => `calc(${px} * var(--u, 1px))`;

export const cx = (...names: Array<string | false | null | undefined>) =>
  names.filter(Boolean).join(" ");
