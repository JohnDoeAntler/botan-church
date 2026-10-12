import { sweepToLink } from "../../animation/coverSweep";
import { BlockArt, BrandTitle, DotGrid, Flex, Place, Rule, Sparkle, Stack, Text, VerticalText } from "../../components";
import { decayFilter } from "../../components/effects/decayPresets";
import { u } from "../../lib/units";
import titleSvg from "../../sections/about/art/about.svg?raw";
import { COPY, LINKS, type AboutLink } from "../../sections/about/aboutContent";
import { ICONS } from "../../sections/about/aboutIcons";
import { AVATAR as PORTRAIT } from "../../sections/about/aboutLayout";
import { MobileBrand, MobilePage } from "../MobilePage";
import { dots, slash, WAIST } from "../mobileKit";
import styles from "../mobile.module.css";

const H = 1672;
/** Centre line of the page (design px). */
const C = 470;
const TITLE = { scale: 1.25, y: 506, w: 407 * 1.25 };
const AVATAR = { x: C - 133, y: 228, w: 266, h: 184 };

/** rule — star — rule. */
function Divider({ half, star = 34 }: { half: number; star?: number }) {
  return (
    <Stack dir="row" align="center" gap={6}>
      <div data-anim="rule">
        <Rule length={half} thickness={1.2} />
      </div>
      <div data-anim="sparkle">
        <Sparkle size={star} waist={WAIST} color="var(--c-ink)" />
      </div>
      <div data-anim="rule">
        <Rule length={half} thickness={1.2} />
      </div>
    </Stack>
  );
}

/** A thin outline circle with pencil grain. */
function Circle({ size }: { size: number }) {
  const r = size / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} aria-hidden style={{ display: "block", width: "100%", height: "100%", overflow: "visible" }}>
      <circle cx={r} cy={r} r={r - 1} style={{ fill: "none", stroke: "var(--c-ink)" }} strokeWidth={1.4} filter={decayFilter("pencil", "svg")} />
    </svg>
  );
}

/** The print artwork: margin slashes, halftones and dots, the circles, the portrait's blocks, stars. */
function Backdrop() {
  return (
    <>
      <Place x={76} y={124} ay="start" z={4} data-anim="rule" style={{ right: u(76) }}>
        <div className={styles.divider} />
      </Place>
      <Place x={0} y={280} ay="start" z={1} data-anim="shape">
        <BlockArt
          box={{ x: 0, y: 280, w: 300, h: 1300 }}
          layout={{
            hairs: [slash(100, 470, 130, 1.2, "ink"), slash(150, 1160, 120, 1, "ink"), slash(40, 840, 110, 1.4)],
            blocks: [{ x: 16, y: 1000, w: 46, h: 170, fill: "grayDots", fade: "down" }],
            sparks: [...dots(58, 302, 6, 4, 18, 2.2), ...dots(60, 920, 6, 5, 18, 2)],
          }}
        />
      </Place>
      <Place x={-130} y={410} w={280} h={280} z={1} data-anim="shape">
        <Circle size={280} />
      </Place>
      <Place x={640} y={130} ay="start" z={1} data-anim="shape">
        <BlockArt
          box={{ x: 640, y: 130, w: 301, h: 1450 }}
          layout={{
            hairs: [slash(660, 320, 140, 1, "ink"), slash(700, 1010, 160, 1, "ink"), slash(770, 1570, 140, 1.2)],
            blocks: [{ x: 880, y: 1450, w: 46, h: 110, fill: "grayDots", fade: "up" }],
            sparks: dots(630, 1460, 7, 4, 18, 2),
          }}
        />
      </Place>
      <Place x={760} y={1430} w={300} h={300} ay="end" z={1} data-anim="shape">
        <Circle size={300} />
      </Place>
      <Place x={AVATAR.x - 30} y={AVATAR.y - 30} z={2} data-anim="shape">
        <BlockArt
          box={{ x: AVATAR.x - 30, y: AVATAR.y - 30, w: AVATAR.w + 80, h: AVATAR.h + 60 }}
          layout={{
            blocks: [
              { x: AVATAR.x - 24, y: AVATAR.y + 60, w: 22, h: 80, fill: "teal" },
              { x: AVATAR.x + AVATAR.w - 30, y: AVATAR.y - 24, w: 50, h: 46, fill: "teal" },
              { x: AVATAR.x + AVATAR.w + 4, y: AVATAR.y + 100, w: 34, h: 80, fill: "tealDots", fade: "down" },
              { x: AVATAR.x - 30, y: AVATAR.y - 10, w: 80, h: 70, fill: "grayDots", fade: "left" },
            ],
          }}
        />
      </Place>
      {[
        { x: 318, y: 46, s: 38 },
        { x: 252, y: 314, s: 28 },
        { x: 636, y: 254, s: 28 },
        { x: 676, y: 334, s: 22 },
        { x: 62, y: 776, s: 32 },
        { x: 860, y: 642, s: 24 },
      ].map((s, i) => (
        <Place key={i} x={s.x} y={s.y} ay={s.y < 100 ? "start" : "center"} z={5} data-anim="sparkle">
          <Sparkle size={s.s} waist={WAIST} color="var(--c-ink)" />
        </Place>
      ))}
    </>
  );
}

/** One link card (the whole card is the link when it has one, ↗ in its corner; a tap sweeps it in teal, then opens it in a new tab). */
function LinkCard({ link }: { link: AboutLink }) {
  const body = (
    <>
      <span className={styles.linkIcon}>{ICONS[link.icon]}</span>
      {link.href && (
        <svg className={styles.external} viewBox="0 0 14 14" aria-hidden>
          <path d="M8.5 1.5h4v4M12.5 1.5 6.5 7.5M11 8.5v4H1.5V3H5.5" />
        </svg>
      )}
      <span className={styles.linkName}>
        <Text size={24} tracking={0.02} weight={600} style={{ textTransform: "none" }}>
          {link.name}
        </Text>
      </span>
      <Text variant="display" size={16} leading={22} tracking={0.06} weight={500} lines={link.role} />
    </>
  );
  return link.href ? (
    <a data-anim="shape" className={styles.linkCard} href={link.href} target="_blank" rel="noopener noreferrer" onClick={(e) => sweepToLink(e, e.currentTarget, link.href!)} aria-label={`${link.name}: ${link.role.join(" ")}`}>
      {body}
    </a>
  ) : (
    <div data-anim="shape" className={styles.linkCard}>
      {body}
    </div>
  );
}

/** About: what the site is; the four links as a 2 × 2 grid of cards. */
export function MobileAbout() {
  return (
    <MobilePage id="m-about" height={H}>
      <MobileBrand tagline />
      <Backdrop />

      {/* top: the centre star and its tick; the "smiles" caption on the left */}
      <Flex x={C - 17} y={106} w={34} ay="start" z={6} dir="column" align="center" gap={6}>
        <div data-anim="sparkle">
          <Sparkle size={34} waist={WAIST} color="var(--c-ink)" />
        </div>
        <div data-anim="rule">
          <Rule length={28} thickness={1.2} vertical />
        </div>
      </Flex>
      <Flex x={76} y={160} ay="start" z={6} dir="column" gap={14}>
        <div data-anim="text">
          <Text size={14} leading={24} tracking={0.3} lines={COPY.smiles} />
        </div>
        <div data-anim="rule" style={{ marginLeft: u(2) }}>
          <Rule length={26} thickness={1.4} />
        </div>
      </Flex>

      {/* centre: portrait, title, then the copy column */}
      <Place x={AVATAR.x} y={AVATAR.y} w={AVATAR.w} h={AVATAR.h} z={3} data-anim="panel" className={`${styles.art} ${styles.framed}`}>
        <img src={PORTRAIT.src} alt="Botan" draggable={false} style={{ objectPosition: PORTRAIT.focus }} />
      </Place>
      <Place x={C - 200} y={464} w={400} z={6} data-anim="text" className={styles.center}>
        <Text size={17} tracking={0.5}>
          {COPY.kicker}
        </Text>
      </Place>
      <BrandTitle svg={titleSvg} label="ABOUT" x={C - TITLE.w / 2} y={TITLE.y} scale={TITLE.scale} starScale={0.78} z={6} />
      <Flex x={C - 390} y={635} w={780} z={6} dir="column" align="center" className={styles.center}>
        <Divider half={262} />
        <div data-anim="text" style={{ marginTop: u(7) }}>
          <Text variant="mincho" size={34} tracking={0.18} weight={500} lang="ja">
            {COPY.catch}
          </Text>
        </div>
        <div data-anim="text" style={{ marginTop: u(35) }}>
          <Text variant="mincho" size={20} leading={40} tracking={0.12} weight={500} lines={COPY.introNarrow} lang="ja" />
        </div>
      </Flex>
      <Place x={176} y={936} w={592} h={462} z={4}>
        <div className={styles.cards}>
          {LINKS.map((link) => (
            <LinkCard key={link.name} link={link} />
          ))}
        </div>
      </Place>
      <Flex x={826} y={1100} z={6} dir="column" gap={24}>
        <div data-anim="vtext">
          <VerticalText lines={COPY.vertical} size={22} leading={36} weight={500} />
        </div>
        <div data-anim="rule" style={{ marginLeft: u(20) }}>
          <Rule length={20} thickness={1.4} />
        </div>
      </Flex>

      {/* bottom: divider, "and still more to come" between rules and dots; the corner captions */}
      <Flex x={C - 200} y={1490} w={400} z={6} justify="center">
        <Divider half={150} star={40} />
      </Flex>
      <Flex x={308} y={1552} w={370} ay="end" z={6} align="center" justify="between">
        <div data-anim="rule">
          <Rule length={44} thickness={1.2} vertical />
        </div>
        <div data-anim="dots">
          <DotGrid rows={1} cols={3} pitch={14} dot={3} />
        </div>
        <div data-anim="text" className={styles.center}>
          <Text size={12} leading={21} tracking={0.32} lines={["And still", "more to come."]} />
        </div>
        <div data-anim="dots">
          <DotGrid rows={1} cols={3} pitch={14} dot={3} />
        </div>
        <div data-anim="rule">
          <Rule length={44} thickness={1.2} vertical />
        </div>
      </Flex>
      <Flex x={86} y={1516} ay="end" z={6} dir="column">
        <div data-anim="rule">
          <Rule length={24} thickness={1.4} />
        </div>
        <div data-anim="text" style={{ marginTop: u(48) }}>
          <Text size={12} tracking={0.32}>
            Est. 2024
          </Text>
        </div>
        <div data-anim="rule" style={{ marginTop: u(23) }}>
          <Rule length={24} thickness={1.4} />
        </div>
      </Flex>
      <Flex x={748} y={1558} ay="end" z={6} dir="column" gap={16}>
        <div data-anim="text">
          <Text size={12} leading={21} tracking={0.32} lines={["A fan site", "for Botan."]} />
        </div>
        <div data-anim="rule" style={{ marginLeft: u(2) }}>
          <Rule length={24} thickness={1.4} />
        </div>
      </Flex>
    </MobilePage>
  );
}
