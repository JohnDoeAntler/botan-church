# botan.church

An unofficial fan site for Kurashiki Botan (倉敷牡丹) from namo's 狼少年は今日も噓を重ねる. React 19 + TypeScript + Vite.

## Setup

```sh
npm install
npm run bake   # once: bakes every page's intro animation (needs Edge or Chrome installed)
npm run dev
```

The site's images are generated, not committed:

- **`npm run art`** converts the original artwork in `source-art/` into the WebP files under `public/` (see
  [source-art/README.md](source-art/README.md)). It runs automatically before `dev`, `build` and `bake`, and only
  re-encodes what changed.
- **`npm run bake`** renders each page's intro into `public/intro/` with a headless browser. Re-run it after changing
  anything that appears in an intro (layout, shapes, artwork): `npm run bake -- <page>` for one page. Without a bake,
  pages still work but fall back to a slower live intro.

Both outputs are git-ignored.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (generates the art first) |
| `npm run build` | Type-check and production build into `dist/` |
| `npm run preview` | Serve `dist/` |
| `npm run art` | Convert `source-art/` → `public/` (`-- --force` to re-encode everything) |
| `npm run bake` | Bake the intro animations into `public/intro/` |
| `npm run lint` | Oxlint |
| `npm run title:build` | Rebuild the home page title SVG from `scripts/titles/botan-church.json` |

## Content

- Gospel entries: `content/gospel.json` (pictures in `source-art/gospel/`).
- Fanart list: `src/sections/fanart/fanartContent.ts` (pictures in `source-art/fanart/`).
- Manga volumes: `src/sections/volumes/volumesContent.ts` (covers in `source-art/volume-covers/`).
