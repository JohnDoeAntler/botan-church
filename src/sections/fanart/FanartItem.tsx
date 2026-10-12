import { useRef, type MouseEvent } from "react";
import { coverSweep, openInNewTab } from "../../animation/coverSweep";
import { BlockBand, HandNote, InfoCard, Rule, Text, VerticalText } from "../../components";
import { cardLayout } from "../../components/ui/infoCardSpec";
import { u } from "../../lib/units";
import { NUMBER_SIZE, type PlacedItem } from "./fanartLayout";
import { sourceSite } from "./fanartContent";
import styles from "./FanartPage.module.css";

const CARD_W = 405;
/** The band reaches this far past the card's left edge, so its seam decoration overlaps the card. */
const SEAM = 40;

/** Absolutely placed child in item-local design px. */
const at = (x: number, y: number, z?: number) => ({ position: "absolute", left: u(x), top: u(y), zIndex: z }) as const;

/**
 * One fanart list item. Two animated units: the band (left zone, artwork, card seam, number; see BlockBand),
 * drawn over the info card art (see InfoCard) so the seam overlaps the card's edge. Subtitle, note and card copy
 * are live text on top.
 */
export function FanartItem({ item, className }: { item: PlacedItem; className?: string }) {
  const { entry, w: width, h: height, numberAt, note } = item;
  const card = { x: width - CARD_W, w: CARD_W };
  const L = cardLayout(entry.seed, card.w, height);
  const copy = "var(--c-white)";
  const muted = "#cfcfca";
  // shrink long titles so they stay clear of the thumbnail
  const titleRoom = L.thumb.x - L.title.x - 14;
  // (Latin letters are about half as wide as Japanese characters)
  const titleEms = Array.from(entry.title).reduce((n, c) => n + (c.charCodeAt(0) < 0x3000 ? 0.62 : 1.12), 0);
  const titleSize = Math.min(24, titleRoom / titleEms);
  // a plain click: the artwork is swept over in teal, then its source page opens in a new tab
  const artRef = useRef<HTMLDivElement>(null);
  const sweeping = useRef(false);
  const open = (e: MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (!artRef.current || sweeping.current) return;
    sweeping.current = true;
    coverSweep(artRef.current, {
      onCovered: () => {
        sweeping.current = false;
        openInNewTab(entry.link);
      },
    });
  };

  return (
    <article
      data-entry={item.index}
      className={className}
      style={{ position: "relative", width: u(width), height: u(height) }}
      aria-label={`${item.number} ${entry.title}`}
    >
      <div data-anim="shape" style={{ ...at(card.x, 0, 1), width: u(card.w), height: u(height) }}>
        <InfoCard width={card.w} height={height} seed={entry.seed} icon={entry.icon} thumb={entry.art} />
      </div>

      <div data-anim="panel" style={{ ...at(0, 0, 2), width: u(card.x + SEAM), height: u(height) }}>
        <BlockBand
          art={entry.art}
          width={card.x + SEAM}
          height={height}
          seed={entry.seed}
          artLeft={item.artLeft}
          card={card.x}
          variant={item.variant}
          number={{ text: item.number, x: numberAt.x, y: numberAt.y, size: NUMBER_SIZE }}
        />
      </div>

      {entry.subtitle && item.variant === "paper" && (
        <>
          <div data-anim="rule" style={at(numberAt.x + 6, numberAt.y + 82, 3)}>
            <Rule length={64} thickness={1.2} vertical />
          </div>
          <div data-anim="vtext" style={at(numberAt.x + 18, numberAt.y + 80, 3)}>
            <VerticalText lines={[entry.subtitle]} size={14} leading={20} weight={500} />
          </div>
        </>
      )}
      {note && entry.note && (
        <div data-anim="note" style={{ ...at(note.x, note.y, 3), rotate: `${note.rotate}deg` }}>
          <HandNote lines={entry.note} size={note.size} leading={note.size * 1.1} />
          <span style={{ display: "block", width: u(note.size * 4.2), height: u(2), marginTop: u(4), background: "var(--c-teal)" }} />
        </div>
      )}

      <div data-anim="text" style={at(card.x + L.title.x, L.title.y, 3)}>
        <Text variant="mincho" size={titleSize} color={copy} tracking={0.1} weight={500} lang="ja">
          {entry.title}
        </Text>
      </div>
      <div data-anim="text" style={at(card.x + L.title.x, L.title.y + 40, 3)}>
        <Text variant="display" size={16} leading={27} color={muted} tracking={0.06} weight={400} lines={[`by ${entry.author}`, entry.date]} />
      </div>
      <div data-anim="text" style={at(card.x + L.tags.x, L.tags.y, 3)}>
        <Text size={9.5} tracking={0.3} color={muted}>
          Illustration
        </Text>
      </div>
      <div data-anim="rule" style={at(card.x + L.tags.x, L.tags.y + 15, 3)}>
        <Rule length={86} thickness={1.4} color={muted} />
      </div>
      <div data-anim="text" style={at(card.x + L.tags.x, L.tags.y + 22, 3)}>
        <Text size={9.5} leading={17} tracking={0.3} color={muted} lines={entry.tags} />
      </div>
      {/* the artwork's area, where the click's sweep plays (over the art, under the copy) */}
      <div ref={artRef} aria-hidden style={{ ...at(item.artLeft, 0, 2), width: u(card.x - item.artLeft), height: u(height), pointerEvents: "none" }} />
      {/* the whole item links to the artwork's source */}
      <a className={styles.source} href={entry.link} target="_blank" rel="noopener noreferrer" onClick={open} aria-label={`${entry.title} by ${entry.author} (${sourceSite(entry.link)})`} />
    </article>
  );
}
