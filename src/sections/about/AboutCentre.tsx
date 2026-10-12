import { sweepToLink } from "../../animation/coverSweep";
import { BrandTitle, DotGrid, Flex, Place, Rule, Sparkle, Stack, Text } from "../../components";
import { u } from "../../lib/units";
import titleSvg from "./art/about.svg?raw";
import { COPY, LINKS, type AboutLink } from "./aboutContent";
import { ICONS } from "./aboutIcons";
import { AVATAR, CENTRE, WAIST } from "./aboutLayout";
import styles from "./AboutPage.module.css";

/** Width of the copy column under the title. */
const COLUMN = 820;

/** rule — star — rule, `half` = each rule's length. */
function Divider({ half, star = 22 }: { half: number; star?: number }) {
  return (
    <Stack dir="row" align="center" gap={4}>
      <div data-anim="rule">
        <Rule length={half} thickness={1} />
      </div>
      <div data-anim="sparkle">
        <Sparkle size={star} waist={WAIST} color="var(--c-ink)" />
      </div>
      <div data-anim="rule">
        <Rule length={half} thickness={1} />
      </div>
    </Stack>
  );
}

/** One link card: icon, name, role; the whole card is the link when it has one (↗ in its corner): a click sweeps it in teal, then opens it in a new tab. */
function LinkCard({ link }: { link: AboutLink }) {
  const body = (
    <>
      <span className={styles.icon}>{ICONS[link.icon]}</span>
      {link.href && (
        <svg className={styles.external} viewBox="0 0 14 14" aria-hidden>
          <path d="M8.5 1.5h4v4M12.5 1.5 6.5 7.5M11 8.5v4H1.5V3H5.5" />
        </svg>
      )}
      <span data-anim="text" className={styles.cardName}>
        <Text size={14.5} tracking={0.02} weight={600} style={{ textTransform: "none" }}>
          {link.name}
        </Text>
      </span>
      <span data-anim="text">
        <Text variant="display" size={10.5} leading={14} tracking={0.08} weight={500} lines={link.role} />
      </span>
    </>
  );
  const style = { width: u(link.w) };
  return link.href ? (
    <a data-anim="shape" className={styles.card} style={style} href={link.href} target="_blank" rel="noopener noreferrer" onClick={(e) => sweepToLink(e, e.currentTarget, link.href!)} aria-label={`${link.name}: ${link.role.join(" ")}`}>
      {body}
    </a>
  ) : (
    <div data-anim="shape" className={styles.card} style={style}>
      {body}
    </div>
  );
}

/**
 * The centre column: the portrait, "botan.church" over the ABOUT title (page star in its "O"), then one centred
 * column: divider, catch line, introduction, the link cards, divider, "and still more to come".
 */
export function AboutCentre() {
  return (
    <>
      <Place x={AVATAR.x} y={AVATAR.y} w={AVATAR.w} h={AVATAR.h} z={3} data-anim="panel" className={styles.avatar}>
        <img src={AVATAR.src} alt="Botan" draggable={false} style={{ objectPosition: AVATAR.focus }} />
      </Place>
      <Place x={CENTRE - 150} y={322} w={300} z={6} data-anim="text" style={{ textAlign: "center" }}>
        <Text size={9.5} tracking={0.5}>
          {COPY.kicker}
        </Text>
      </Place>
      <BrandTitle svg={titleSvg} label="ABOUT" x={633} y={350} starScale={0.62} />

      <Flex x={CENTRE - COLUMN / 2} y={447} w={COLUMN} z={6} dir="column" align="center" style={{ textAlign: "center" }}>
        <Divider half={238} />
        <div data-anim="text">
          <Text variant="mincho" size={22} tracking={0.22} weight={500} lang="ja">
            {COPY.catch}
          </Text>
        </div>
        <div data-anim="text" style={{ marginTop: u(24) }}>
          <Text variant="mincho" size={13} leading={23.5} tracking={0.16} weight={500} lines={COPY.intro} lang="ja" />
        </div>
        <Stack dir="row" gap={22} className={styles.cards} style={{ marginTop: u(46) }}>
          {LINKS.map((link) => (
            <LinkCard key={link.name} link={link} />
          ))}
        </Stack>
        <div style={{ marginTop: u(24) }}>
          <Divider half={176} />
        </div>
        <Stack dir="row" align="center" gap={34} style={{ marginTop: u(14) }}>
          <div data-anim="dots">
            <DotGrid rows={1} cols={3} pitch={13} dot={2.4} />
          </div>
          <div data-anim="text">
            <Text size={8.5} tracking={0.34}>
              {COPY.more}
            </Text>
          </div>
          <div data-anim="dots">
            <DotGrid rows={1} cols={3} pitch={13} dot={2.4} />
          </div>
        </Stack>
      </Flex>
    </>
  );
}
