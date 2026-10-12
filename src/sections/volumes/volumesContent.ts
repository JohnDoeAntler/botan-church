import { asset } from "../../lib/base";
import type { Art } from "../../lib/cover";

export type Volume = {
  /** "01" … */
  number: string;
  title: string;
  /** Printed down the label strip, vertically. */
  spine: string;
  date: string;
  /** Chapters collected, e.g. "#001 - #004". */
  issues: string;
  cover: Art;
  /** Where to buy it (Amazon Japan, the print edition). */
  href: string;
  /** Drives the decoration around the cover (volumeDecor). */
  seed: number;
};

/** Covers are shown whole (their box has the same 0.7 aspect), so the focus only matters for rounding. */
const cover = (n: number, w: number): Art => ({ src: asset(`/volumes/${n}.webp`), w, h: 697, focus: { x: 0.5, y: 0.5 } });

/** An Amazon Japan product page, by ISBN-10. */
const amazon = (isbn: string) => `https://www.amazon.co.jp/dp/${isbn}`;

/** The series' title, printed on every volume (cover title line and label strip). */
const SERIES = "狼少年は今日も噓を重ねる";

/** 狼少年は今日も噓を重ねる by namo: release dates and chapters per volume; covers in public/volumes. */
export const VOLUMES: Volume[] = [
  { number: "01", title: SERIES, spine: SERIES, date: "2015.01.15", issues: "#001 - #004", cover: cover(1, 488), href: amazon("4047301434"), seed: 14 },
  { number: "02", title: SERIES, spine: SERIES, date: "2015.11.12", issues: "#005 - #011", cover: cover(2, 488), href: amazon("4047306355"), seed: 37 },
  { number: "03", title: SERIES, spine: SERIES, date: "2016.08.09", issues: "#012 - #017", cover: cover(3, 490), href: amazon("4047342521"), seed: 52 },
  { number: "04", title: SERIES, spine: SERIES, date: "2017.07.15", issues: "#018 - #025", cover: cover(4, 490), href: amazon("4047346993"), seed: 73 },
  { number: "05", title: SERIES, spine: SERIES, date: "2018.03.15", issues: "#026 - #032", cover: cover(5, 490), href: amazon("4047350419"), seed: 96 },
];

export const COPY = {
  site: "botan.church",
  caption: ["botan.church", "manga volume", "archive."],
  footer: {
    est: ["BOTAN.CHURCH", "EST. 2024"],
    line: "全五巻。読めばわかる。",
    story: ["A story of", "ordinary days."],
    box: ["Manga volumes", "archive"],
    scroll: ["Scroll", "for more."],
    end: ["つづいていく、", "どこまでも。"],
  },
};
