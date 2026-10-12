# source-art

The original artwork. The site serves WebP copies in `public/`, which `npm run art` (`scripts/build-art.mjs`)
generates from these files; it runs automatically before `npm run dev`, `build` and `bake`. The copies are
git-ignored: only this folder is committed. Add, replace or remove a file here and the next run updates `public/`
(and deletes outputs whose source is gone).

| Here | Becomes | Notes |
|---|---|---|
| `fanart/<n>.png` / `.jpg` | `public/fanart/<n>.webp` | At most 1600px wide. `<n>` matches the entry's `art(n, …)` in `src/sections/fanart/fanartContent.ts`. |
| `manga-crops/<name>.png` | `public/manga/panel1-3/<name>.webp` | Each crop goes to the home page panel closest to its shape; the list is written to `src/sections/hero/mangaCrops.ts`. |
| `gospel/<name>.png` / `.jpg` | `public/gospel/<name>.webp` | Referenced by `image` in `content/gospel.json` (e.g. `school-festival.webp`). |
| `volume-covers/<n>.png` | `public/volumes/<n>.webp` | One per volume (`src/sections/volumes/volumesContent.ts`). |
| `botan-character.png` | `public/assets/botan-character.webp` | The home page character (Illustration 9), padded to her slot's shape. |

After changing anything that shows in a page's intro, re-bake it: `npm run bake` (or `npm run bake -- <page>`).
