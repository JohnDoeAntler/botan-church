import type { BandVariant } from "../../components/blocks/blocks";
import { asset } from "../../lib/base";
import type { Art } from "../../lib/cover";
import type { ListRegion } from "./fanartLayout";
import { TAGLINE_LINES } from "../shared/siteCopy";

/**
 * One fanart, content only. Layout (position, height, variant, art start, number and note placement) is
 * generated from `seed` and the item's index by layoutFanart(); the decorations by the block / card generators.
 */
export type FanartEntry = {
  /** Change it for a new layout with the same vibe. */
  seed: number;
  title: string;
  /** The artist, as credited on the source page. */
  author: string;
  /** The source page (pixiv, X, DeviantArt, Reddit post). */
  link: string;
  /** Posted on, YYYY.MM.DD. */
  date: string;
  tags: string[];
  /** The artwork, with its natural size and the point to keep in view when cropped. */
  art: Art;
  /** Optional vertical subtitle under the number (shown on paper items). */
  subtitle?: string;
  /** Optional handwritten lines, placed automatically. */
  note?: string[];
  icon?: boolean;
  /** Pin the variant instead of letting the seed pick. */
  variant?: BandVariant;
};

const art = (n: number, w: number, h: number, fx: number, fy: number): Art => ({ src: asset(`/fanart/${n}.webp`), w, h, focus: { x: fx, y: fy } });

/** The archive, in display order. Add entries freely: the list re-flows and scrolls through all of them. */
export const FANART: FanartEntry[] = [
  {
    seed: 11,
    title: "狼少年は今日も嘘を重ねる",
    author: "まづゆき",
    link: "https://www.pixiv.net/artworks/68093034",
    date: "2018.04.05",
    tags: ["Trio", "Uniform", "Peace"],
    art: art(1, 1600, 1116, 0.48, 0.33),
    icon: true,
  },
  {
    seed: 215,
    title: "Best Girl",
    author: "seuor1",
    link: "https://www.reddit.com/r/manga/comments/1uqmh7s/art_oc_recently_read_a_manga_and_had_to_draw_best/",
    date: "2026.07.08",
    tags: ["Expressions", "Uniform", "Energy"],
    art: art(20, 1600, 1600, 0.5, 0.4),
    icon: true,
  },
  {
    seed: 183,
    title: "Kurashiki Botan",
    author: "S3Link",
    link: "https://www.deviantart.com/s3link/art/Kurashiki-Botan-11.25.2023-997053984",
    date: "2023.11.25",
    tags: ["Chibi", "Monochrome", "Crowd"],
    art: art(17, 600, 734, 0.5, 0.35),
    icon: true,
  },
  {
    seed: 133,
    title: "Kurashiki, Botan",
    author: "tired",
    link: "https://x.com/darealtired/status/1696056412278043086",
    date: "2023.08.28",
    tags: ["Uniform", "Hand out", "Smile"],
    art: art(12, 1600, 2182, 0.45, 0.27),
  },
  {
    seed: 126,
    title: "牡丹ちゃん",
    author: "wonoko",
    link: "https://www.pixiv.net/artworks/97698032",
    date: "2022.04.17",
    tags: ["Winter", "Snow", "Scarf"],
    art: art(11, 1600, 2302, 0.5, 0.32),
    icon: true,
  },
  {
    seed: 208,
    title: "Kurashiki Botan",
    author: "Folash",
    link: "https://www.deviantart.com/folash/art/Kurashiki-Botan--by-Folash-895546393",
    date: "2021.10.21",
    tags: ["Book", "Uniform", "Smile"],
    art: art(19, 874, 914, 0.42, 0.25),
  },
  {
    seed: 162,
    title: "倉敷牡丹",
    author: "ぽすか",
    link: "https://x.com/posca00571/status/1350829881634955265",
    date: "2021.01.17",
    tags: ["Peace", "Uniform", "Sunny"],
    art: art(15, 729, 1032, 0.62, 0.22),
    icon: true,
  },
  {
    seed: 27,
    title: "Botan Kurashiki",
    author: "DrawerSaBahay",
    link: "https://www.pixiv.net/artworks/76141457",
    date: "2019.08.08",
    tags: ["Uniform", "Smile", "Portrait"],
    art: art(2, 1114, 1337, 0.45, 0.37),
  },
  {
    seed: 42,
    title: "botan",
    author: "rikichii",
    link: "https://www.pixiv.net/artworks/70552947",
    date: "2018.09.05",
    tags: ["Uniform", "Pose", "Energy"],
    art: art(3, 974, 1528, 0.42, 0.16),
    icon: true,
  },
  {
    seed: 58,
    title: "HA!!",
    author: "ice fried rice",
    link: "https://www.pixiv.net/artworks/70201089",
    date: "2018.08.14",
    tags: ["Sketch", "Jump", "Smile"],
    art: art(4, 1200, 1000, 0.5, 0.14),
  },
  {
    seed: 156,
    title: "下書き",
    author: "S式",
    link: "https://x.com/rsa65537/status/977940252651274240",
    date: "2018.03.25",
    tags: ["Sketch", "Pastel", "Soft"],
    art: art(14, 1600, 2263, 0.5, 0.3),
    icon: true,
  },
  {
    seed: 63,
    title: "Botan-chan!",
    author: "Alushia",
    link: "https://www.pixiv.net/artworks/66087633",
    date: "2017.11.29",
    tags: ["Close-up", "Smile", "Heart"],
    art: art(5, 635, 717, 0.5, 0.4),
  },
  {
    seed: 71,
    title: "もやもやしてください",
    author: "おさまだ名菓",
    link: "https://www.pixiv.net/artworks/65032512",
    date: "2017.09.18",
    tags: ["Track uniform", "Blush", "Portrait"],
    art: art(6, 905, 1280, 0.5, 0.26),
    icon: true,
  },
  {
    seed: 84,
    title: "倉敷牡丹ちゃん",
    author: "まづゆき",
    link: "https://www.pixiv.net/artworks/64384869",
    date: "2017.08.12",
    tags: ["Uniform", "Blush", "Shy"],
    art: art(7, 1242, 1938, 0.42, 0.3),
  },
  {
    seed: 194,
    title: "Botan Kurashiki",
    author: "VinceArts",
    link: "https://www.deviantart.com/vincearts/art/Botan-Kurashiki-698203157",
    date: "2017.08.11",
    tags: ["Chibi", "Close-up", "Smile"],
    art: art(18, 894, 894, 0.5, 0.45),
  },
  {
    seed: 92,
    title: "無題",
    author: "あかはら",
    link: "https://www.pixiv.net/artworks/64277725",
    date: "2017.08.07",
    tags: ["Uniform", "Smile", "Soft"],
    art: art(8, 600, 808, 0.45, 0.32),
  },
  {
    seed: 177,
    title: "4巻発売おめでとう",
    author: "桜井林檎",
    link: "https://x.com/bakaringo11/status/886199731315015681",
    date: "2017.07.15",
    tags: ["Sketch", "Vol. 4", "Surprised"],
    art: art(16, 1596, 2048, 0.55, 0.22),
  },
  {
    seed: 105,
    title: "ボタン",
    author: "Ruckce",
    link: "https://www.pixiv.net/artworks/63804992",
    date: "2017.07.10",
    tags: ["Cat ears", "Flustered", "Uniform"],
    art: art(9, 700, 800, 0.45, 0.27),
    icon: true,
  },
  {
    seed: 141,
    title: "倉敷牡丹ちゃん",
    author: "おさまだ名菓",
    link: "https://x.com/osmdmk/status/878222596629684224",
    date: "2017.06.23",
    tags: ["Line art", "Grin", "Uniform"],
    art: art(13, 480, 655, 0.45, 0.34),
  },
  {
    seed: 118,
    title: "牡丹",
    author: "junic",
    link: "https://www.pixiv.net/artworks/63418693",
    date: "2017.06.16",
    tags: ["Track uniform", "Wink", "Outdoors"],
    art: art(10, 1600, 1920, 0.45, 0.22),
  },
];

const SITES: Record<string, string> = { "pixiv.net": "pixiv", "x.com": "X", "deviantart.com": "DeviantArt", "reddit.com": "Reddit" };

/** The source site's name, for labels ("pixiv", "X", ...). */
export const sourceSite = (link: string) => {
  const host = new URL(link).hostname.replace(/^www\./, "");
  return SITES[host] ?? host;
};

/** Where the list lives on the design canvas. */
export const LIST_REGION: ListRegion = {
  top: 68,
  bottom: 912,
  gap: 8,
  minHeight: 190,
  right: 1645,
  plateLeft: [296, 306],
  paperLeft: [340, 388],
  // keep clear of the page title
  avoid: { top: 150, bottom: 310, minLeft: 386 },
};

export const COPY = {
  site: "botan.church",
  tagline: TAGLINE_LINES,
  archive: "Fanart Archive",
  /** Fanart as votive offerings (奉納) to the shrine. */
  lead: ["信者たちの、", "奉納絵。"],
  span: ["Fanart Archive", "2017 — 2026"],
  thanks: ["描かれた牡丹は、", "全員かわいい。", "例外はない。", "奉納は、", "いつでも", "受け付けています。"],
  colophon: ["botan.church", "Fanart Archive", "Unofficial fan site", "All art © its artists."],
};
