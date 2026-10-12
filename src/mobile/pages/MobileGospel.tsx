import gsap from "gsap";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BlockArt, BrandTitle, Flex, HandNote, Place, Rule, Sparkle, Stack, Text } from "../../components";
import { u } from "../../lib/units";
import titleSvg from "../../sections/gospel/art/gospel.svg?raw";
import { COPY, ENTRIES } from "../../sections/gospel/gospelContent";
import { panelDecor } from "../../sections/gospel/gospelDecor";
import { PagerCounter } from "../../sections/shared/Pager";
import { MobileFooter } from "../MobileFooter";
import { MobileBrand, MobilePage } from "../MobilePage";
import { pad2, WAIST } from "../mobileKit";
import styles from "../mobile.module.css";

const H = 1672;
const N = ENTRIES.length;
const mod = (i: number) => ((i % N) + N) % N;
/** The picture: a label strip on its left, the art to its right. */
const PANEL = { x: 108, y: 392, w: 742, h: 290, strip: 70 };
/** Gospel: one entry at a time; arrows or a swipe move between them (the entry fades over, nothing else moves). */
export function MobileGospel() {
  const [active, setActive] = useState(0);
  const entry = ENTRIES[active];
  const art = { x: PANEL.x + PANEL.strip, w: PANEL.w - PANEL.strip };
  const decor = useMemo(() => panelDecor(entry.seed, art.w, PANEL.h), [entry.seed, art.w]);
  const longest = Math.max(...entry.title.map((l) => Array.from(l).length));
  const headline = Math.min(52, Math.floor((700 / (longest * 1.02)) * 10) / 10);
  const entryRef = useRef<HTMLDivElement>(null);
  /** The entry already shown (StrictMode's double mount must not fade it in again). */
  const shown = useRef(active);

  // swipe between entries
  useEffect(() => {
    let x0: number | null = null;
    const down = (e: TouchEvent) => void (x0 = e.touches[0]?.clientX ?? null);
    const up = (e: TouchEvent) => {
      const x1 = e.changedTouches[0]?.clientX;
      if (x0 === null || x1 === undefined) return;
      const dx = x1 - x0;
      x0 = null;
      if (Math.abs(dx) > 50) setActive((a) => mod(a + (dx < 0 ? 1 : -1)));
    };
    window.addEventListener("touchstart", down, { passive: true });
    window.addEventListener("touchend", up, { passive: true });
    return () => {
      window.removeEventListener("touchstart", down);
      window.removeEventListener("touchend", up);
    };
  }, []);

  // a new entry fades in (one tween for the whole entry: cheap)
  useLayoutEffect(() => {
    if (shown.current === active) return;
    shown.current = active;
    const el = entryRef.current;
    if (el) gsap.fromTo(el, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", clearProps: "opacity,transform" });
  }, [active]);

  return (
    <MobilePage id="m-gospel" height={H}>
      <MobileBrand />
      <BrandTitle svg={titleSvg} label="GOSPEL" x={108} y={102} ay="start" scale={0.88} z={6} />
      <Place x={680} y={98} ay="start" z={6} data-anim="rule">
        <Rule length={156} thickness={1.4} vertical />
      </Place>
      <Place x={700} y={102} ay="start" z={6} data-anim="text">
        <Text size={13} leading={22.5} tracking={0.24} lines={COPY.forAll} />
      </Place>
      <Place x={806} y={150} ay="start" z={6} data-anim="sparkle">
        <Sparkle size={44} waist={WAIST} color="var(--c-ink)" />
      </Place>

      <PagerCounter x={112} y={276} ay="start" width={742} layout="inline" scale={1.6} sizes={{ number: 78, total: 34 }} index={active} count={N} onPrev={() => setActive((a) => mod(a - 1))} onNext={() => setActive((a) => mod(a + 1))} />

      <div ref={entryRef} key={active} style={{ position: "absolute", inset: 0 }}>
        <Place x={PANEL.x} y={PANEL.y} ay="start" w={PANEL.strip} h={PANEL.h} z={2} data-anim="shape" className={styles.framed} style={{ background: "#fbfaf5" }}>
          <div style={{ textAlign: "center", paddingTop: "calc(64 * var(--u))" }}>
            <Text size={10.5} leading={16} tracking={0.2} lines={["Botan", "Church"]} />
            <Text variant="display" size={44} leading={52} weight={500}>
              {pad2(active + 1)}
            </Text>
          </div>
        </Place>
        <Place x={PANEL.x + PANEL.strip / 2 - 14} y={PANEL.y + 196} ay="start" z={3} data-anim="sparkle">
          <Sparkle size={28} waist={WAIST} color="var(--c-ink)" />
        </Place>
        <Place x={art.x} y={PANEL.y} ay="start" w={art.w} h={PANEL.h} z={2} data-anim="panel" className={`${styles.art} ${styles.framed}`}>
          <img src={entry.art.src} alt="" style={{ objectPosition: `50% ${{ top: "0%", center: "50%", bottom: "100%" }[entry.art.focus]}` }} />
        </Place>
        <Place x={art.x} y={PANEL.y} ay="start" w={art.w} h={PANEL.h} z={3} data-anim="shape" style={{ pointerEvents: "none" }}>
          <BlockArt box={{ x: 0, y: 0, w: art.w, h: PANEL.h }} layout={decor} />
        </Place>

        <Flex x={112} y={698} w={720} ay="start" z={6} dir="column">
          <Stack dir="row" align="center" gap={22}>
            <Stack gap={4}>
              <Stack dir="row" align="baseline" gap={26}>
                <div data-anim="text">
                  <Text size={20} tracking={0.2} color="var(--c-teal)">
                    {COPY.label}
                  </Text>
                </div>
                <div data-anim="number">
                  <Text variant="display" size={42} leading={48} color="var(--c-teal)" weight={500}>
                    {pad2(active + 1)}
                  </Text>
                </div>
              </Stack>
              <div data-anim="rule">
                <Rule length={196} thickness={2} color="var(--c-teal)" />
              </div>
            </Stack>
            <div data-anim="rule">
              <Rule length={62} thickness={1.6} color="var(--c-teal)" />
            </div>
            <div data-anim="sparkle" style={{ marginLeft: u(126) }}>
              <Sparkle size={34} waist={WAIST} color="var(--c-teal)" />
            </div>
          </Stack>
          <div data-anim="text" style={{ marginTop: u(28) }}>
            <Text variant="mincho" size={headline} leading={74} weight={700} lines={entry.title} lang="ja" />
          </div>
          <div data-anim="text" style={{ margin: `${u(10)} 0 0 ${u(6)}` }}>
            <Text size={16} tracking={0.36}>
              {entry.en}
            </Text>
          </div>
          <div data-anim="text" style={{ margin: `${u(24)} 0 0 ${u(8)}` }}>
            <Text variant="gothic" size={19} leading={36} weight={500} tracking={0.08} lines={entry.body} lang="ja" />
          </div>

          {/* the quote (tilted), its signature, then the tags: in the flow, so a long description pushes them down */}
          <Stack dir="row" gap={18} style={{ marginTop: u(36), rotate: "-3deg", transformOrigin: "0 0" }}>
            <div data-anim="text">
              <Text variant="mincho" size={56} leading={56} weight={700}>
                “
              </Text>
            </div>
            <div data-anim="note">
              <HandNote lines={entry.quote} script={entry.quoteScript} size={entry.quoteScript === "en" ? 30 : 22} leading={38} style={{ textIndent: 0 }} />
            </div>
          </Stack>
          <Stack dir="row" align="center" gap={14} style={{ alignSelf: "flex-end", marginRight: u(110), rotate: "-10deg" }}>
            <div data-anim="rule">
              <Rule length={46} thickness={1.4} />
            </div>
            <div data-anim="note">
              <HandNote lines={[COPY.signature]} script="en" size={32} leading={34} />
            </div>
          </Stack>
          <Stack dir="row" gap={14} style={{ flexWrap: "wrap", width: u(720), marginTop: u(30) }}>
            {entry.tags.map((tag) => (
              <div key={tag} data-anim="text" className={styles.tag} style={{ height: u(42), padding: `0 ${u(20)}` }}>
                <Text variant="gothic" size={16} tracking={0.08} weight={500} lang="ja">{`# ${tag}`}</Text>
              </div>
            ))}
          </Stack>
        </Flex>
      </div>

      <MobileFooter label={COPY.collection} labelWidth={236} />
    </MobilePage>
  );
}
