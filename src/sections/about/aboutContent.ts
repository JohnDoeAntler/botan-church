import { TAGLINE_LINES } from "../shared/siteCopy";
export type AboutLink = {
  /** Which mark the card shows. */
  icon: "manga" | "x" | "github" | "reddit";
  name: string;
  /** One or two short lines under the name. */
  role: string[];
  /** Opens in a new tab; no href = a card without a link. */
  href?: string;
  /** Card width, design px (the row is laid out left to right, centred). */
  w: number;
};

export const LINKS: AboutLink[] = [
  // the series from its first chapter (ComicWalker)
  { icon: "manga", name: "Manga Series", role: ["Read from", "Chapter 1"], href: "https://comic-walker.com/detail/KC_000669_S", w: 184 },
  { icon: "x", name: "namo", role: ["Series Creator /", "Author"], href: "https://x.com/namo_", w: 191 },
  // the source repository: set its URL here once it is published
  { icon: "github", name: "GitHub", role: ["Source Code"], w: 192 },
  { icon: "reddit", name: "r/botanchurch", role: ["Community"], href: "https://www.reddit.com/r/botanchurch/", w: 208 },
];

export const COPY = {
  site: "botan.church",
  tagline: TAGLINE_LINES,
  smiles: ["For the", "bestest", "girl."],
  est: ["Est. 2024", "Unofficial", "fan site."],
  kicker: "botan.church",
  catch: "ここは、牡丹の教会です。",
  intro: [
    "倉敷牡丹がいちばんかわいい、という事実を確かめに来る人のための非公式ファンサイトです。",
    "原作を読んで、ファンアートを眺めて、また原作を読む。",
    "入信はいつでも歓迎。退会の手続きは、ありません。",
  ],
  /** `intro`, broken for the narrow mobile column. */
  introNarrow: [
    "倉敷牡丹がいちばんかわいい、という事実を",
    "確かめに来る人のための非公式ファンサイトです。",
    "原作を読んで、ファンアートを眺めて、また原作を読む。",
    "入信はいつでも歓迎。退会の手続きは、ありません。",
  ],
  vertical: ["今日も、", "牡丹はかわいい。"],
  fanSite: ["A", "fan site", "for", "Botan."],
  more: "And still more to come.",
};
