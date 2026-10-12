/**
 * Where the site is served from: "/" locally, "/<repo>/" on GitHub Pages (Vite's `base`, set from BASE_PATH at
 * build time; always ends with "/").
 */
export const BASE = import.meta.env.BASE_URL;

/** The router's basename: BASE without its trailing slash ("/" stays "/"). */
export const BASENAME = BASE.replace(/\/$/, "") || "/";

/** A file in public/ ("/fanart/1.webp") → its URL under BASE. */
export const asset = (path: string) => BASE + path.replace(/^\//, "");

/** An app route ("/gospel") → the href that points to it under BASE (for `<a href>`). */
export const link = (route: string) => asset(route);

/** A link's href or a URL path (under BASE) → the app route the router navigates to ("/botan-church" is "/" too). */
export const routeOf = (href: string) => (href === BASENAME ? "/" : href.startsWith(BASE) ? `/${href.slice(BASE.length)}` : href);
