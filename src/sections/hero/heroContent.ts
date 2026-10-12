import { duotoneMatrix } from "../../lib/color";

export const DESIGN_SIZE = { width: 1672, height: 941 };

/**
 * The front page's copy (desktop and mobile). About Kurashiki Botan (倉敷牡丹) of namo's 狼少年は今日も噓を重ねる:
 * the bookstore's daughter, honest to a fault; "bestest girl" is what her fans call her.
 */
export const COPY = {
  site: "botan.church",
  tagline: ["A shrine", "to the", "bestest girl."],
  /** The series title, split over the two vertical lines. */
  vertical: ["狼少年は、", "今日も噓を重ねる。"],
  /** Her honesty, the trait that defines her. */
  thanks: ["正直すぎる", "ところも、", "ぜんぶ", "好き。"],
  smiles: ["For the", "bestest", "girl."],
  colophon: ["botan.church", "Est. 2024", "Unofficial fan site."],
  number: "01",
  topics: ["Manga", "Fanart", "Volumes", "And", "a lot of", "Botan."],
  here: ["本屋の娘、", "倉敷牡丹。"],
  subtitle: "The church of the bestest girl.",
  enterNote: ["ここから先は、", "牡丹のことだけ。"],
};

/** TEMP: monochrome main character (luminance → black…white). Remove to restore colour. */
export const CHARACTER_TINT = duotoneMatrix("#000000", "#ffffff");

export const ART = {
  character: "/assets/botan-character.webp",
};
