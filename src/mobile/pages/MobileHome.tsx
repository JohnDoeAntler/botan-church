import { Barcode, BlockArt, BrandTitle, Flex, Place, Rule, Sparkle, Stack, Text, VerticalText } from "../../components";
import { link } from "../../lib/base";
import { u } from "../../lib/units";
import titleSvg from "../../sections/hero/art/botan-church.svg?raw";
import { ART, COPY } from "../../sections/hero/heroContent";
import { useMangaRotation } from "../../sections/hero/useMangaRotation";
import { MobileBrand, MobilePage } from "../MobilePage";
import { RotatingImg } from "../RotatingImg";
import { dots, slash, WAIST } from "../mobileKit";
import styles from "../mobile.module.css";

const H = 1672;

/** Teal print blocks behind the character (design px). */
const BACKDROP = {
  box: { x: 160, y: 100, w: 760, h: 840 },
  layout: {
    blocks: [
      { x: 232, y: 122, w: 520, h: 260, fill: "teal" as const },
      { x: 232, y: 382, w: 150, h: 300, fill: "teal" as const },
      { x: 382, y: 382, w: 120, h: 140, fill: "tealDots" as const },
      { x: 270, y: 440, w: 112, h: 150, fill: "whiteDots" as const },
      { x: 690, y: 690, w: 190, h: 70, fill: "tealDots" as const },
      { x: 236, y: 840, w: 120, h: 80, fill: "teal" as const },
      { x: 780, y: 120, w: 80, h: 60, fill: "tealLight" as const },
    ],
    discs: [
      { cx: 785, cy: 418, r: 82, fill: "teal" as const },
      { cx: 262, cy: 615, r: 86, fill: "tealDots" as const },
    ],
    hairs: [slash(560, 400, 180), slash(720, 860, 140)],
    sparks: [...dots(250, 640, 4, 3, 16), ...dots(790, 520, 5, 4, 16)],
  },
};

/** Lower decoration: teal discs by the closing copy, slashes, dot fields. */
const LOWER = {
  box: { x: 20, y: 1180, w: 900, h: 470 },
  layout: {
    discs: [
      { cx: 840, cy: 1280, r: 72, fill: "tealDots" as const },
      { cx: 800, cy: 1520, r: 74, fill: "tealDots" as const },
    ],
    hairs: [slash(60, 1508, 70), slash(830, 1205, 60)],
    sparks: [...dots(560, 1300, 4, 3, 16), ...dots(48, 1090 + 140, 4, 4, 14)],
  },
};

/** The two manga panels, by shape: near-square (beside the thank-you note) and wide (bottom). */
const PANEL_SLOTS = ["panel3", "panel2"] as const;

/** Home: the shrine's front page, laid out as one tall poster. */
export function MobileHome() {
  const manga = useMangaRotation(PANEL_SLOTS);
  return (
    <MobilePage id="m-home" height={H}>
      <MobileBrand tagline />

      {/* artwork: the teal blocks, the character, the manga panels, the big star */}
      <Place x={BACKDROP.box.x} y={BACKDROP.box.y} z={1} data-anim="shape">
        <BlockArt box={BACKDROP.box} layout={BACKDROP.layout} />
      </Place>
      <Place x={LOWER.box.x} y={LOWER.box.y} z={1} data-anim="shape">
        <BlockArt box={LOWER.box} layout={LOWER.layout} />
      </Place>
      <Place x={300} y={30} w={580} h={890} z={3} data-anim="panel" className={styles.art}>
        <img src={ART.character} alt="Botan" draggable={false} style={{ objectPosition: "50% 8%", background: "transparent" }} />
      </Place>
      <Place x={204} y={645} w={224} h={248} z={4} data-anim="panel" className={`${styles.art} ${styles.framed}`} style={{ background: "var(--c-ink)" }}>
        <RotatingImg src={manga.panel3.src} alt="Botan, from the manga" />
      </Place>
      <Place x={66} y={1262} w={404} h={188} z={3} data-anim="panel" className={`${styles.art} ${styles.framed}`} style={{ background: "var(--c-ink)" }}>
        <RotatingImg src={manga.panel2.src} alt="Botan, from the manga" delay={0.3} />
      </Place>
      <Place x={196} y={124} ax="start" ay="start" z={6} data-anim="sparkle">
        <Sparkle size={52} waist={WAIST} color="var(--c-ink)" />
      </Place>

      {/* left column: a rule under the tagline (top), the vertical line and the thank-you note (middle) */}
      <Place x={92} y={150} ax="start" ay="start" z={6} data-anim="rule">
        <Rule length={26} thickness={1.4} />
      </Place>
      <Place x={54} y={190} ax="start" z={6} data-anim="vtext">
        <VerticalText lines={COPY.vertical} size={50} leading={76} weight={600} />
      </Place>
      <Flex x={68} y={630} ax="start" z={6} dir="column">
        <div data-anim="sparkle" style={{ marginLeft: u(2) }}>
          <Sparkle size={32} waist={WAIST} color="var(--c-teal)" />
        </div>
        <div data-anim="rule" style={{ margin: `${u(38)} 0 0 ${u(2)}` }}>
          <Rule length={24} thickness={1.4} />
        </div>
        <div data-anim="text" style={{ marginTop: u(21) }}>
          <Text variant="mincho" size={19} leading={38} weight={500} lines={COPY.thanks} lang="ja" />
        </div>
        <div data-anim="text" style={{ marginTop: u(-14) }}>
          <Text size={11.5} leading={19} tracking={0.24} lines={COPY.smiles} />
        </div>
      </Flex>

      {/* the title, its subtitle and teal rule */}
      <BrandTitle svg={titleSvg} label="BOTAN CHURCH" x={100} y={925} scale={0.98} starScale={0.85} z={6} />
      <Flex x={120} y={1207} w={700} z={6} dir="column" align="center" gap={14}>
        <div data-anim="text">
          <Text size={19} tracking={0.3} weight={450}>
            {COPY.subtitle}
          </Text>
        </div>
        <div data-anim="rule">
          <Rule length={598} thickness={3} color="var(--c-teal)" />
        </div>
      </Flex>

      {/* beside the lower panel */}
      <Flex x={650} y={1268} z={6} dir="column">
        <div data-anim="text">
          <Text variant="mincho" size={28} leading={46} weight={600} lines={COPY.here} lang="ja" />
        </div>
        <div data-anim="rule" style={{ margin: `${u(6)} 0 0 ${u(2)}` }}>
          <Rule length={30} thickness={1.4} />
        </div>
        <div data-anim="text" style={{ marginTop: u(17) }}>
          <Text variant="mincho" size={19} leading={36} weight={500} lines={COPY.enterNote} lang="ja" />
        </div>
      </Flex>

      {/* ✦ | ENTER | ✦ */}
      <Flex x={190} y={1468} z={6} align="center" gap={16}>
        <div data-anim="sparkle" style={{ marginRight: u(10) }}>
          <Sparkle size={30} waist={WAIST} color="var(--c-teal)" />
        </div>
        <div data-anim="rule">
          <Rule length={78} thickness={1.2} vertical />
        </div>
        <div data-anim="shape" style={{ width: u(416), height: u(78) }}>
          <a href={link("/gospel")} className={styles.enter}>
            ENTER
            <svg viewBox="0 0 66 16" aria-hidden>
              <path d="M0 8h64M57 1l7 7-7 7" />
            </svg>
          </a>
        </div>
        <div data-anim="rule">
          <Rule length={78} thickness={1.2} vertical />
        </div>
        <div data-anim="sparkle" style={{ marginLeft: u(10) }}>
          <Sparkle size={30} waist={WAIST} color="var(--c-teal)" />
        </div>
      </Flex>

      {/* footer: 01 / topics — rule — est. — barcode */}
      <Flex x={88} y={1560} w={786} ay="end" z={6} align="center" justify="between">
        <Stack dir="row" align="center" gap={14}>
          <div data-anim="number">
            <Text variant="display" size={62} leading={64} weight={500}>
              01
            </Text>
          </div>
          <div data-anim="shape">
            <BlockArt box={{ x: 0, y: 0, w: 50, h: 56 }} layout={{ hairs: [slash(2, 54, 46, 1.2, "ink")] }} />
          </div>
          <div data-anim="text">
            <Text size={11.5} leading={19.5} tracking={0.24} lines={["Manga", "fanart", "volumes", "and a lot of Botan."]} />
          </div>
        </Stack>
        <div data-anim="rule" style={{ marginTop: u(56) }}>
          <Rule length={170} thickness={1} />
        </div>
        <div data-anim="text">
          <Text size={11} leading={20} tracking={0.24} lines={COPY.colophon.slice(1)} />
        </div>
        <div data-anim="barcode">
          <Barcode width={62} height={46} />
        </div>
      </Flex>
    </MobilePage>
  );
}
