import { asset } from "../../lib/base";
import { COPY as HOME } from "../hero/heroContent";
import { TAGLINE_LINES } from "../shared/siteCopy";
import data from "../../../content/gospel.json";

/** Which part of a picture stays in view when it is cropped to the panel. */
export type Focus = "top" | "center" | "bottom";

export type GospelEntry = {
  /** The entry's picture (public/gospel/<image>), cropped to the panel keeping `focus` in view. */
  art: { src: string; focus: Focus };
  /** Headline, one string per line. */
  title: string[];
  /** The English line under the headline. */
  en: string;
  body: string[];
  quote: string[];
  /** The quote's handwriting: Japanese, or an English hand when it has no Japanese in it. */
  quoteScript: "jp" | "en";
  tags: string[];
  /** Drives the print decoration on the panel (gospelDecor). */
  seed: number;
};

/** One entry as fans write it in content/gospel.json (line breaks as "\n"). */
type RawEntry = { image?: string; focus?: string; title?: string; subtitle?: string; description?: string; quote?: string[]; tags?: string[] };

const lines = (text = "") => text.split("\n").filter((l) => l.trim());
/** Hiragana, katakana, kanji. */
const JAPANESE = /[぀-ヿ㐀-鿿]/;

/** Entries the timeline shows at once (it slides along when the current one would leave it). */
export const TIMELINE_WINDOW = 5;

/** The entries, read from content/gospel.json (the file fans edit; see its fields above). */
export const ENTRIES: GospelEntry[] = (data as { entries: RawEntry[] }).entries.map((e, i) => {
  const quote = e.quote ?? [];
  return {
    art: { src: asset(`/gospel/${e.image ?? ""}`), focus: e.focus === "center" || e.focus === "bottom" ? e.focus : "top" },
    title: lines(e.title),
    en: e.subtitle ?? "",
    body: lines(e.description),
    quote,
    quoteScript: quote.some((l) => JAPANESE.test(l)) ? "jp" : "en",
    tags: e.tags ?? [],
    seed: 21 + i * 23,
  };
});

export const COPY = {
  site: "botan.church",
  tagline: TAGLINE_LINES,
  /** 布教: otaku slang for converting others to what you love (and, here, the church's missionary work). */
  vertical: ["牡丹を、", "布教します。"],
  forAll: ["The", "gospel", "of the", "bestest", "girl."],
  /** "Gospel" is old English for good news. */
  subtitle: "The good news is Botan.",
  thanks: HOME.thanks,
  colophon: HOME.colophon,
  archive: ["Gospel archive", "2024 — 2026"],
  collection: ["Botan, chapter and verse:", "her best moments, by her fans."],
  label: "Gospel",
  signature: "Botan",
  footer: "botan.church",
};
